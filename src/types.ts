import type { GmXhrRequest } from 'vite-plugin-monkey/dist/client';

export type AnyFunction = (...args: any[]) => any;
export type FetchType = typeof fetch;
export type WindowLike = {
  fetch: FetchType;
};
export type XhrOnloadType = typeof XMLHttpRequest.prototype.onload;
export type XhrOnreadystatechangeType =
  typeof XMLHttpRequest.prototype.onreadystatechange;

export type XMLHttpRequestType = typeof XMLHttpRequest;
export type IPromise<T = unknown> = Promise<T> | T;

export type GmResponseEvent = Parameters<
  NonNullable<
    GmXhrRequest<
      unknown,
      'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
    >['onload']
  >
>[0];
