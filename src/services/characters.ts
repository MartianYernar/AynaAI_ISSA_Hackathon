import type {
  CharacterManifest,
  CharacterRegistryEntry,
  CharacterState,
} from "../types";

const CHARACTER_REGISTRY_URL = "/characters/characters.json";

type RawCharacterManifest = Omit<
  CharacterManifest,
  "states" | "fallbackState" | "manifestUrl"
> & {
  states?: Partial<Record<CharacterState, string>>;
  fallbackState?: CharacterState;
};

function resolveAssetUrl(manifestUrl: string, assetPath: string) {
  return new URL(assetPath, new URL(manifestUrl, window.location.origin)).pathname;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }

  return response.json() as Promise<T>;
}

export async function loadCharacterRegistry() {
  return fetchJson<CharacterRegistryEntry[]>(CHARACTER_REGISTRY_URL);
}

export async function loadCharacterManifest(
  entry: CharacterRegistryEntry,
): Promise<CharacterManifest> {
  const manifestUrl = entry.manifest;
  const manifest = await fetchJson<RawCharacterManifest>(manifestUrl);
  const rawStates = manifest.states ?? {};
  const resolvedStates = Object.fromEntries(
    Object.entries(rawStates).map(([state, assetPath]) => [
      state,
      assetPath ? resolveAssetUrl(manifestUrl, assetPath) : assetPath,
    ]),
  ) as Partial<Record<CharacterState, string>>;

  return {
    ...manifest,
    id: manifest.id || entry.id,
    name: manifest.name || entry.id,
    states: resolvedStates,
    fallbackState: manifest.fallbackState ?? "idle",
    manifestUrl,
  };
}

export async function loadCharacters() {
  const registry = await loadCharacterRegistry();
  return Promise.all(registry.map((entry) => loadCharacterManifest(entry)));
}
