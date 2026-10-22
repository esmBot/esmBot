import type { webcrypto } from "node:crypto";
import { createServer } from "node:http";
import { Client, Interaction } from "oceanic.js";
import type { DatabasePlugin } from "../database.ts";
import events from "../events/index.ts";

export const createInteractionServer = (client: Client, key: webcrypto.CryptoKey, database?: DatabasePlugin) =>
  createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.end();
    }

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    if (!signature && !timestamp) {
      res.statusCode = 400;
      return res.end();
    }

    const body = await new Promise<string>((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.once("end", () => {
        resolve(data);
      });
      req.once("error", (e) => {
        reject(e);
      });
    });

    const verified = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      Buffer.from(signature as string, "hex"),
      Buffer.from(timestamp + body),
    );

    if (!verified) {
      res.statusCode = 401;
      return res.end();
    }

    const json = JSON.parse(body);
    const interaction = Interaction.from(json, client);
    const val = await events.interactionCreate({ client, database, res }, interaction);

    if (val) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(val));
    } else if (!res.writableEnded) {
      res.end();
    }
  });
