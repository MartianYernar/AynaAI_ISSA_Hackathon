import { useOutputLanguage } from "../../context/LanguageContext";
import {
  OUTPUT_LANGUAGE_LABELS,
  type OutputLanguage,
} from "../../i18n/outputLanguage";

const CODES: OutputLanguage[] = ["en", "ru", "kk"];

type LanguageSwitchProps = {
  /** Larger padding for character selection screen */
  variant?: "compact" | "comfortable";
};

export function LanguageSwitch({ variant = "compact" }: LanguageSwitchProps) {
  const { outputLanguage, setOutputLanguage } = useOutputLanguage();

  return (
    <div
      className={`output-language-switch${variant === "comfortable" ? " is-comfortable" : ""}`}
      role="group"
      aria-label="AI response language"
    >
      <span className="output-language-label">Responses</span>
      <div className="output-language-pills">
        {CODES.map((code) => (
          <button
            aria-label={OUTPUT_LANGUAGE_LABELS[code].aria}
            aria-pressed={outputLanguage === code}
            className={outputLanguage === code ? "is-active" : ""}
            key={code}
            onClick={() => setOutputLanguage(code)}
            type="button"
          >
            {OUTPUT_LANGUAGE_LABELS[code].short}
          </button>
        ))}
      </div>
    </div>
  );
}
