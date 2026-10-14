import servers from "#config/servers.json" with { type: "json" };

export type SearchServer =
  | {
      type: "searxng";
      url: string;
      engines: string[];
    }
  | {
      type: "degoog";
      url: string;
      ytBang?: string;
    };

export interface ServersConfig {
  lava: { name: string; url: string; auth: string }[];
  media: { name: string; server: string; auth: string; tls: boolean }[];
  search?: SearchServer[];
  searx?: string[]; // legacy
}

export default servers as ServersConfig;
