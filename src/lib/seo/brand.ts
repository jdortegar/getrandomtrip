/**
 * Brand identity facts used by structured data and /llms.txt. Other companies
 * also use the "Randomtrip" name, so every machine-readable description pins
 * the brand to its legal operator, domain and official profiles.
 */
export const BRAND = {
  address: {
    addressCountry: "US",
    addressLocality: "Wilmington",
    addressRegion: "DE",
    postalCode: "19808",
    streetAddress: "251 Little Falls Dr",
  },
  alternateNames: ["getrandomtrip", "getrandomtrip.com", "GetRandomTrip"],
  domain: "getrandomtrip.com",
  legalName: "Randomtrip Inc.",
  name: "Randomtrip",
  sameAs: [
    "https://www.instagram.com/getrandomtrip",
    "https://www.facebook.com/getrandomtrip",
    "https://www.linkedin.com/company/getrandomtrip",
  ],
} as const;

/** One sentence naming the operator and domain, shared by schema and llms.txt. */
export const BRAND_OPERATOR_LINE = `${BRAND.name} is operated by ${BRAND.legalName} at ${BRAND.domain}.`;
