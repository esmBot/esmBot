import process from "node:process";
import { locales } from "./collections.ts";

const templateRegex = /{{(\w+?)}}/g;

type GetStringParams = {
  locale?: string;
  returnNull?: boolean;
  params?: { [key: string]: string };
};

export function getString(key: string, params?: { returnNull?: false } & GetStringParams): string;
export function getString(key: string, params: { returnNull: boolean } & GetStringParams): string | undefined;
export function getString(key: string, params?: GetStringParams): string | undefined {
  const locale = params?.locale ?? process.env.LOCALE ?? "en-US";
  const obj = locales.get(locale);
  const splitKey = key.split(".");
  let string: string;
  try {
    string =
      splitKey.reduce((prev, cur) => prev[cur], obj) ||
      splitKey.reduce((prev, cur) => prev[cur], locales.get("en-US")) ||
      (params?.returnNull ? null : key);
  } catch {
    try {
      string = splitKey.reduce((prev, cur) => prev[cur], locales.get("en-US"));
    } catch {
      return params?.returnNull ? undefined : key;
    }
  }

  if (params?.params && string) {
    string = string.replace(templateRegex, (match, name) => params.params?.[name] ?? match);
  }

  return string;
}

export function getAllLocalizations(key: string) {
  const obj: { [key: string]: string } = {};
  const splitKey = key.split(".");
  for (const [locale, data] of locales.entries()) {
    let str: string | undefined;
    try {
      str = splitKey.reduce((prev, cur) => prev[cur], data);
    } catch {
      /* empty */
    }
    if (!str) continue;
    obj[locale] = str;
  }
  return obj;
}
