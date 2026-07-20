import { env } from "@/core/config/env";

export interface GatewayRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export function buildRequest(path: string, options: GatewayRequestOptions = {}): [string, RequestInit] {
  const url = `${env.gatewayBasePath}${path}`;

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    // Same-origin, but be explicit: the Gateway's session cookie must
    // always be sent.
    credentials: "include",
    cache: "no-store",
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  return [url, init];
}
