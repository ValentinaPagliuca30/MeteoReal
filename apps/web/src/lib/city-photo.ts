const WIKI_TITLE_OVERRIDES: Record<string, string> = {
  "new-york-us": "New York City",
  "los-angeles-us": "Los Angeles",
  "san-francisco-us": "San Francisco",
  "new-orleans-us": "New Orleans",
  "mexico-city-mx": "Mexico City",
  "sao-paulo-br": "São Paulo",
  "cape-town-za": "Cape Town",
};

function titleFor(cityId: string, cityName: string) {
  return WIKI_TITLE_OVERRIDES[cityId] ?? cityName;
}

export async function fetchCityPhoto(
  cityId: string,
  cityName: string,
): Promise<string | null> {
  const title = titleFor(cityId, cityName);
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("pithumbsize", "1600");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("origin", "*");

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload = await response.json();
  const pages = payload?.query?.pages;
  if (!pages) return null;

  const firstPage = Object.values(pages)[0] as { thumbnail?: { source?: string } };
  return firstPage?.thumbnail?.source ?? null;
}
