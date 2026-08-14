import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "./config";
import { deepMerge } from "./merge";
import uk from "../../messages/uk.json";
import ru from "../../messages/ru.json";

export default getRequestConfig(async () => {
  // Next 14: cookies() is synchronous (await-style is Next 15 — G3 lesson class).
  const store = cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  return {
    locale,
    messages: locale === "ru" ? deepMerge(uk, ru) : uk,
    timeZone: "Europe/Kyiv",
  };
});
