import { useMemo, useState } from "react";
import type { CharacterManifest, CharacterState } from "../../types";

interface CharacterRendererProps {
  manifest: CharacterManifest | null;
  state: CharacterState;
}

export function CharacterRenderer({ manifest, state }: CharacterRendererProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fallbackState = manifest?.fallbackState ?? "idle";
  const fallbackSrc = manifest?.states[fallbackState] ?? manifest?.states.idle;
  const requestedSrc = manifest?.states[state];
  const imageSrc = useMemo(() => {
    if (!requestedSrc) {
      return fallbackSrc;
    }

    if (failedSrc === requestedSrc) {
      return fallbackSrc;
    }

    return requestedSrc;
  }, [failedSrc, fallbackSrc, requestedSrc]);

  if (!manifest || !imageSrc || failedSrc === imageSrc) {
    return <div className="character-missing">Character assets missing</div>;
  }

  return (
    <img
      alt={manifest.name}
      className="character-image"
      draggable={false}
      onError={() => setFailedSrc(imageSrc)}
      src={imageSrc}
    />
  );
}
