import { buildRequest, type GatewayRequestOptions } from "@/core/gateway/request";
import { GatewayError, isGatewayErrorBody } from "@/core/gateway/response";
import { handleUnauthorized } from "@/core/gateway/interceptors";

/**
 * gateway.ts
 *
 * Development Rule #5 (frontend): "gateway.ts is the only HTTP entry
 * point." No page, no component, no hook may call fetch() directly or
 * talk to the Gateway/Kernel any other way - everything routes through
 * the single `gateway.request` function below, via a service.
 */
async function request<T>(path: string, options?: GatewayRequestOptions): Promise<T> {
  const [url, init] = buildRequest(path, options);
  const res = await fetch(url, init);

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    if (isGatewayErrorBody(body)) {
      throw new GatewayError(res.status, body.error.code, body.error.message);
    }
    throw new GatewayError(res.status, "UNKNOWN", "Gateway request failed");
  }

  return body as T;
}

export const gateway = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
