import { GM_info } from 'vite-plugin-monkey/dist/client';
import type { AnyFunction } from './types';

export const delay = async (n = 0) =>
  new Promise((res) => {
    setTimeout(res, n);
  });


/**
 * lazy side effect by `__PURE__` comment
 */
export const lazy = <T extends object>(fn: () => T) => {
  let temp: T | undefined = undefined;
  let o = {
    get k() {
      if (temp === undefined) {
        temp = fn();
      }
      return temp;
    },
  };
  const wm = lazyValue(() => new WeakMap<AnyFunction, AnyFunction>());
  return new Proxy({} as T, {
    get(_, p, receiver) {
      const v = Reflect.get(o.k, p, receiver);
      if (typeof v == 'function') {
        const f = v as AnyFunction;
        let fBind = wm.value.get(f);
        if (fBind === undefined) {
          fBind = f.bind(o.k);
          wm.value.set(f, fBind);
        }
        return fBind;
      }
      return v;
    },
    set(_, p, newValue, receiver) {
      return Reflect.set(o.k, p, newValue, receiver);
    },
    has(_, p) {
      return Reflect.has(o.k, p);
    },
    ownKeys() {
      return Reflect.ownKeys(o.k);
    },
    isExtensible() {
      return Reflect.isExtensible(o.k);
    },
    deleteProperty(_, p) {
      return Reflect.deleteProperty(o.k, p);
    },
    setPrototypeOf(_, v) {
      return Reflect.setPrototypeOf(o.k, v);
    },
    getOwnPropertyDescriptor(_, p) {
      return Reflect.getOwnPropertyDescriptor(o.k, p);
    },
    defineProperty(_, property, attributes) {
      return Reflect.defineProperty(o.k, property, attributes);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(o.k);
    },
    preventExtensions() {
      return Reflect.preventExtensions(o.k);
    },
    apply(_, thisArg, argArray) {
      // @ts-ignore
      return Reflect.apply(o.k, thisArg, argArray);
    },
    construct(_, argArray, newTarget) {
      // @ts-ignore
      return Reflect.construct(o.k, argArray, newTarget);
    },
  });
};


const lazyValuePlaceholder = {};
export const lazyValue = <T>(fn: () => T) => {
  let temp: T | typeof lazyValuePlaceholder = lazyValuePlaceholder;
  return {
    get value() {
      if (temp === lazyValuePlaceholder) {
        temp = fn();
      }
      return temp as T;
    },
  };
};

/**
 * https://github.com/github/fetch/blob/fb5b0cf42b470faf8c5448ab461d561f34380a30/fetch.js#L422
 */
export const parseHeaders = (rawHeaders = '') => {
  const headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
  // https://github.com/github/fetch/issues/748
  // https://github.com/zloirock/core-js/issues/751
  preProcessedHeaders
    .split('\r')
    .map(function (header) {
      return header.startsWith(`\n`) ? header.substring(1) : header;
    })
    .forEach(function (line) {
      let parts = line.split(':');
      let key = parts.shift()?.trim();
      if (key) {
        let value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
  return headers;
};

/**
 * https://github.com/github/fetch/blob/master/fetch.js
 */
export const fixUrl = (url = '') => {
  try {
    return url === '' && location.href ? location.href : url;
  } catch {
    return url;
  }
};

export const headersToObj = (headers: Headers): Record<string, string> => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

export const reverseForm = (formData: FormData): FormData => {
  const reversedForm = new FormData();
  const reversedList: [string, FormDataEntryValue][] = [];
  formData.forEach((v, k) => {
    reversedList.push([k, v]);
  });
  reversedList.reverse().forEach(([k, v]) => {
    reversedForm.append(k, v);
  });
  return reversedForm;
};

export const compatForm = (formData: FormData, headers: Headers) => {
  headers.delete(`content-type`);
  if (GM_info.scriptHandler == `Tampermonkey`) {
    // https://github.com/Tampermonkey/tampermonkey/issues/1783
    return reverseForm(formData);
  }
  return formData;
};