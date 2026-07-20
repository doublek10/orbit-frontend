/**
 * Re-exported for naming clarity in call sites ("apiClient.get(...)").
 * The actual implementation lives in gateway.ts - kept as a single
 * implementation so there is exactly one HTTP entry point, per
 * Development Rule #5.
 */
export { gateway as apiClient } from "@/core/gateway/gateway";
