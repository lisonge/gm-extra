import type { AxiosAdapter } from 'axios';
import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';
import type { GmResponseEvent } from './types';
import { headersToObj, parseHeaders } from './util';

export const gmAxiosAdapter: AxiosAdapter = async (config) => {
  const u = new URL(config.url ?? ``, config.baseURL);
  if (config.params) {
    for (const k in config.params) {
      const v = config.params[k];
      if (v !== void 0) {
        u.searchParams.set(k, String(v));
      }
    }
  }
  const headers = config.headers.toJSON(true) as Record<string, string>;
  const event = await new Promise<GmResponseEvent>((res, rej) => {
    GM_xmlhttpRequest({
      method: config.method,
      url: u.href,
      headers,
      data: config.data,
      timeout: config.timeout,
      responseType: config.responseType,
      onload: res,
      onerror: rej,
    });
  });

  return {
    status: event.status,
    statusText: event.statusText,
    headers: headersToObj(parseHeaders(event.responseHeaders)),
    data: event.response || event.responseText,
    config,
  };
};
