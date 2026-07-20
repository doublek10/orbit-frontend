export interface Country {
  code: string;
  name: string;
  currency: string;
  active: boolean;
}

export interface CountriesResponse {
  countries: Country[];
}
