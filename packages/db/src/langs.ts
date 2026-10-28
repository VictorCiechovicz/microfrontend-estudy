export type Lang = "pt" | "en";
export const LANGS: readonly Lang[] = ["pt", "en"];

export function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang);
}
