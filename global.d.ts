import type uk from "./messages/uk.json";
import type { Locale } from "./src/i18n/config";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof uk;
  }
}
