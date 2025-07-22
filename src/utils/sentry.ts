import process from "node:process";
import detectRuntime from "./detectRuntime.ts";

const Sentry = await import(`@sentry/${detectRuntime().type}`);

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
