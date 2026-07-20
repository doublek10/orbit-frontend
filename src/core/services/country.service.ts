import { gateway } from "@/core/gateway/gateway";
import { endpoints } from "@/core/gateway/endpoints";
import type { CountriesResponse, Country } from "@/types/country";

/**
 * The Frontend never hardcodes which countries (and therefore which
 * Country Package) are available - it asks the Gateway, which asks the
 * Kernel's Country Package registry. A country only shows as
 * selectable once its package is fully built and `active`; everything
 * else still appears, just disabled, so people can see what's coming.
 */
export const countryService = {
  async list(): Promise<Country[]> {
    const result = await gateway.get<CountriesResponse>(endpoints.countries);
    return result.countries;
  },
};
