export type CityOption = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  accent: string;
};

export const cityOptions: CityOption[] = [
  { id: "chicago-us", name: "Chicago", country: "US", latitude: 41.8781, longitude: -87.6298, accent: "from-sky-200 to-cyan-100" },
  { id: "new-york-us", name: "New York", country: "US", latitude: 40.7128, longitude: -74.006, accent: "from-indigo-200 to-slate-100" },
  { id: "los-angeles-us", name: "Los Angeles", country: "US", latitude: 34.0522, longitude: -118.2437, accent: "from-amber-200 to-orange-100" },
  { id: "miami-us", name: "Miami", country: "US", latitude: 25.7617, longitude: -80.1918, accent: "from-teal-200 to-emerald-100" },
  { id: "seattle-us", name: "Seattle", country: "US", latitude: 47.6062, longitude: -122.3321, accent: "from-slate-300 to-stone-100" },
  { id: "denver-us", name: "Denver", country: "US", latitude: 39.7392, longitude: -104.9903, accent: "from-cyan-200 to-blue-100" },
  { id: "austin-us", name: "Austin", country: "US", latitude: 30.2672, longitude: -97.7431, accent: "from-orange-200 to-amber-100" },
  { id: "boston-us", name: "Boston", country: "US", latitude: 42.3601, longitude: -71.0589, accent: "from-sky-200 to-indigo-100" },
  { id: "san-francisco-us", name: "San Francisco", country: "US", latitude: 37.7749, longitude: -122.4194, accent: "from-teal-200 to-cyan-100" },
  { id: "new-orleans-us", name: "New Orleans", country: "US", latitude: 29.9511, longitude: -90.0715, accent: "from-lime-200 to-emerald-100" },
  { id: "london-gb", name: "London", country: "GB", latitude: 51.5072, longitude: -0.1276, accent: "from-slate-300 to-stone-100" },
  { id: "paris-fr", name: "Paris", country: "FR", latitude: 48.8566, longitude: 2.3522, accent: "from-rose-200 to-pink-100" },
  { id: "berlin-de", name: "Berlin", country: "DE", latitude: 52.52, longitude: 13.405, accent: "from-zinc-200 to-slate-100" },
  { id: "rome-it", name: "Rome", country: "IT", latitude: 41.9028, longitude: 12.4964, accent: "from-amber-200 to-yellow-100" },
  { id: "milan-it", name: "Milan", country: "IT", latitude: 45.4642, longitude: 9.19, accent: "from-stone-200 to-zinc-100" },
  { id: "madrid-es", name: "Madrid", country: "ES", latitude: 40.4168, longitude: -3.7038, accent: "from-orange-200 to-rose-100" },
  { id: "amsterdam-nl", name: "Amsterdam", country: "NL", latitude: 52.3676, longitude: 4.9041, accent: "from-sky-200 to-cyan-100" },
  { id: "stockholm-se", name: "Stockholm", country: "SE", latitude: 59.3293, longitude: 18.0686, accent: "from-cyan-100 to-blue-100" },
  { id: "istanbul-tr", name: "Istanbul", country: "TR", latitude: 41.0082, longitude: 28.9784, accent: "from-red-200 to-orange-100" },
  { id: "tokyo-jp", name: "Tokyo", country: "JP", latitude: 35.6764, longitude: 139.65, accent: "from-rose-200 to-pink-100" },
  { id: "seoul-kr", name: "Seoul", country: "KR", latitude: 37.5665, longitude: 126.978, accent: "from-violet-200 to-indigo-100" },
  { id: "bangkok-th", name: "Bangkok", country: "TH", latitude: 13.7563, longitude: 100.5018, accent: "from-fuchsia-200 to-rose-100" },
  { id: "singapore-sg", name: "Singapore", country: "SG", latitude: 1.3521, longitude: 103.8198, accent: "from-emerald-200 to-teal-100" },
  { id: "dubai-ae", name: "Dubai", country: "AE", latitude: 25.2048, longitude: 55.2708, accent: "from-yellow-200 to-orange-100" },
  { id: "mumbai-in", name: "Mumbai", country: "IN", latitude: 19.076, longitude: 72.8777, accent: "from-orange-200 to-red-100" },
  { id: "sydney-au", name: "Sydney", country: "AU", latitude: -33.8688, longitude: 151.2093, accent: "from-sky-200 to-blue-100" },
  { id: "melbourne-au", name: "Melbourne", country: "AU", latitude: -37.8136, longitude: 144.9631, accent: "from-indigo-200 to-blue-100" },
  { id: "cape-town-za", name: "Cape Town", country: "ZA", latitude: -33.9249, longitude: 18.4241, accent: "from-teal-200 to-cyan-100" },
  { id: "cairo-eg", name: "Cairo", country: "EG", latitude: 30.0444, longitude: 31.2357, accent: "from-yellow-200 to-amber-100" },
  { id: "mexico-city-mx", name: "Mexico City", country: "MX", latitude: 19.4326, longitude: -99.1332, accent: "from-lime-200 to-yellow-100" },
  { id: "sao-paulo-br", name: "Sao Paulo", country: "BR", latitude: -23.5505, longitude: -46.6333, accent: "from-emerald-200 to-lime-100" },
];

const accentPalette = [
  "from-sky-200 to-cyan-100",
  "from-indigo-200 to-slate-100",
  "from-amber-200 to-orange-100",
  "from-teal-200 to-emerald-100",
  "from-slate-300 to-stone-100",
  "from-rose-200 to-pink-100",
];

export function getAccentForCity(cityId: string) {
  const exact = cityOptions.find((city) => city.id === cityId);

  if (exact) {
    return exact.accent;
  }

  const hash = [...cityId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return accentPalette[hash % accentPalette.length];
}
