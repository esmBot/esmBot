import { locales } from "./collections.js";

const templateRegex = /{{(\w+?)}}/g;

/**
 * @param {string} key
 * @param {{ locale?: string; returnNull?: boolean; params?: { [key: string]: any; }; }} [params]
 */
export function getString(key, params) {
  const locale = params?.locale ?? process.env.LOCALE ?? "en-US";
  const obj = locales.get(locale);
  const splitKey = key.split(".");
  let string;
  try {
    string = splitKey.reduce((prev, cur) => prev[cur], obj) || splitKey.reduce((prev, cur) => prev[cur], locales.get("en-US")) || (params?.returnNull ? null : key);
  } catch {
    try {
      string = splitKey.reduce((prev, cur) => prev[cur], locales.get("en-US"));
    } catch {
      return (params?.returnNull ? null : key);
    }
  }

  if (params?.params && string) {
    string = string.replace(templateRegex, (match, name) => (params.params?.[name] ?? match));
  }

  return string;
}

export function getAllLocalizations(key) {
  const obj = {};
  const splitKey = key.split(".");
  for (const [locale, data] of locales.entries()) {
    let str;
    try {
      str = splitKey.reduce((prev, cur) => prev[cur], data);
    } catch {}
    if (!str) continue;
    obj[locale] = str;
  }
  return obj;
}
