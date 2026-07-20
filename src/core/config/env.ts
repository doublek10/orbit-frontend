/**
 * Single source of truth for frontend environment configuration.
 * There is intentionally very little here: the Frontend holds no
 * secrets and talks to nothing but the Gateway.
 */
export const env = {
  // Same-origin path that next.config.ts rewrites to the real Gateway
  // deployment. Keeping this same-origin means the Gateway's cookies
  // behave as normal first-party cookies in the browser.
  gatewayBasePath: "/gateway",
};
