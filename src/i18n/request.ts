import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, type Locale } from './config'

export default getRequestConfig(async () => {
  // For now, use locale from cookie or default
  // In the future, this can be extended to support URL-based locale
  const locale: Locale = defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
