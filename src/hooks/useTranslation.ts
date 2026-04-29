import { useLanguage } from "@/lib/i18n-context";
import { getTranslation, type TranslationKey } from "@/lib/i18n";

export function useTranslation() {
  const { language: lang, setLanguage } = useLanguage();

  const t = (key: TranslationKey) => getTranslation(lang, key);

  return { t, lang, setLanguage };
}
