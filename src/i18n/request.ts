import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { LOCALE_COOKIE, parseLocale } from "./config";
import { getMessagesForLocale } from "./messages";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});
