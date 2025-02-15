import { locales } from "./collections.js";

const templateRegex = /{{(\w+?)}}/g;

export function getString(key: string, params?: { locale?: string; returnNull?: boolean; params?: { [key: string]: string; }; }) {
  const locale = params?.locale ?? process.env.LOCALE ?? "en-US";
  const obj = locales.get(locale);
  const splitKey = key.split(".");
  let string: string;
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

export function getAllLocalizations(key: string) {
  const obj = {};
  const splitKey = key.split(".");
  for (const [locale, data] of locales.entries()) {
    let str: string;
    try {
      str = splitKey.reduce((prev, cur) => prev[cur], data);
    } catch {}
    if (!str) continue;
    obj[locale] = str;
  }
  return obj;
}
