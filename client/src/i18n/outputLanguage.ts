export type OutputLanguage = "en" | "ru" | "kk";

const STORAGE_KEY = "ayna-output-language";

function isOutputLanguage(v: string | null): v is OutputLanguage {
  return v === "en" || v === "ru" || v === "kk";
}

/** Read persisted UI / model output language (sync; safe for TTS outside React). */
export function getOutputLanguage(): OutputLanguage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isOutputLanguage(raw)) {
      return raw;
    }
  } catch {
    /* private mode etc. */
  }
  return "en";
}

export function setOutputLanguageStorage(lang: OutputLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export const OUTPUT_LANGUAGE_LABELS: Record<
  OutputLanguage,
  { short: string; aria: string }
> = {
  en: { short: "EN", aria: "English" },
  ru: { short: "RU", aria: "Русский" },
  kk: { short: "KZ", aria: "Қазақша" },
};
