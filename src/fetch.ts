import {
  GM_xmlhttpRequest,
  type GmXhrRequest,
} from 'vite-plugin-monkey/dist/client';
import { delay, parseHeaders, fixUrl, compatForm, headersToObj } from './util';

/**
 * simulate window.fetch with GM_xmlhttpRequest
 *
 * because [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) will delete [Forbidden_header_name](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name)
 *
 * so you must manually modify these headers by set the second parameter of gmFetch
 * @example
 * gmFetch(
 *   new Request('https://www.pixiv.net/', {
 *     headers: { referer: 'https://www.pixiv.net/' }, // it will not work !!!
 *   }),
 * );
 * gmFetch(new Request('https://www.pixiv.net/'), {
 *   headers: { referer: 'https://www.pixiv.net/' }, // it will work
 *   headers: new Headers({ referer: 'https://www.pixiv.net/' }), // it will also work
 * });
 */
export const gmFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  xhrDetails: Partial<GmXhrRequest<unknown, 'blob'>> | ((arg: GmXhrRequest<unknown, 'blob'>) => GmXhrRequest<unknown, 'blob'>) = {},
): Promise<Response> => {
  const request = new Request(input, init);
  if (request.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const method = request.method.toUpperCase();
  const url = fixUrl(request.url);

  // headers
  const sendHeaders = new Headers(request.headers);
  new Headers(init.headers).forEach((value, key) => {
    sendHeaders.set(key, value);
  });

  let binary = false;
  let data: URLSearchParams | FormData | Blob | string | undefined = undefined;

  if (method != 'GET') {
    if (init.body) {
      if (init.body instanceof FormData) {
        data = compatForm(init.body, sendHeaders);
      } else if (
        typeof init.body == 'string' ||
        init.body instanceof URLSearchParams
      ) {
        data = init.body;
      } else {
        binary = true;
        data = await request.blob();
      }
    } else {
      const formData = await request
        .clone()
        .formData()
        .catch(() => {});
      if (formData) {
        data = compatForm(formData, sendHeaders);
      }
    }
  }
  return new Promise<Response>((resolve, reject) => {
    let initXhrDetails: GmXhrRequest<unknown, 'blob'> = {
      method,
      url,
      headers: headersToObj(sendHeaders),
      data,
      binary,
      responseType: 'blob',
      async onload(event) {
        let body: BodyInit | null | undefined = undefined;
        if (!(event.response instanceof Blob && event.response.size == 0)) {
          // Response': Response with null body status cannot have body
          body = event.response ?? event.responseText;
        }
        await delay();
        const resp = new Response(body, {
          status: event.status,
          statusText: event.statusText,
          headers: parseHeaders(event.responseHeaders),
        });
        Object.defineProperty(resp, 'url', { value: event.finalUrl });
        resolve(resp);
      },
      async onerror() {
        await delay();
        reject(new TypeError('Network request onerror failed'));
      },
      async ontimeout() {
        await delay();
        reject(new TypeError('Network request ontimeout failed'));
      },
      async onabort() {
        await delay();
        reject(new DOMException('Aborted', 'AbortError'));
      },
      async onreadystatechange(event) {
        if (event.readyState === 4) {
          request.signal?.removeEventListener('abort', abortXhr);
        }
      },
    };
    if (typeof xhrDetails == 'function') {
      initXhrDetails = xhrDetails(initXhrDetails);
    } else {
      initXhrDetails = { ...initXhrDetails, ...xhrDetails };
    }
    const handle = GM_xmlhttpRequest(initXhrDetails);
    function abortXhr() {
      handle.abort();
    }
    request.signal?.addEventListener('abort', abortXhr);
  });
};
