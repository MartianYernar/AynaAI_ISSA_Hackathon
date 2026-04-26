import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getOutputLanguage,
  setOutputLanguageStorage,
  type OutputLanguage,
} from "../i18n/outputLanguage";

type LanguageContextValue = {
  outputLanguage: OutputLanguage;
  setOutputLanguage: (lang: OutputLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [outputLanguage, setState] = useState<OutputLanguage>(() =>
    getOutputLanguage(),
  );

  const setOutputLanguage = useCallback((lang: OutputLanguage) => {
    setOutputLanguageStorage(lang);
    setState(lang);
  }, []);

  const value = useMemo(
    () => ({ outputLanguage, setOutputLanguage }),
    [outputLanguage, setOutputLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useOutputLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useOutputLanguage must be used within LanguageProvider");
  }
  return ctx;
}
