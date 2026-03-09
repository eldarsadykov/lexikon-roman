import { de } from '@nuxt/ui/locale'
import type { Locale, Messages } from '@nuxt/ui'

export type AppMessages = Messages & {
  fontSize: {
    label: string
    small: string
    normal: string
    large: string
  }
}

const locale: Locale<AppMessages> = {
  ...de,
  messages: {
    ...de.messages,
    fontSize: {
      label: 'Schriftgröße',
      small: 'Klein',
      normal: 'Normal',
      large: 'Groß'
    }
  }
}

export default locale
