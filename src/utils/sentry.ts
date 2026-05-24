import process from "node:process";
import detectRuntime from "./detectRuntime.ts";

const { type } = detectRuntime();
const Sentry: typeof import("@sentry/node-core") = await import(
  `@sentry/${type === "node" ? "node-core/light" : type}`
);

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
