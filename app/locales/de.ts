import { de } from '@nuxt/ui/locale'
import type { Locale, Messages } from '@nuxt/ui'

export type AppMessages = Messages & {
  fontSize: {
    label: string
    small: string
    normal: string
    large: string
  }
  audio: {
    label: string
  }
  copyForAi: {
    button: string
    copied: string
    failed: string
    source: string
    prompt: string
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
    },
    audio: {
      label: 'Audio'
    },
    copyForAi: {
      button: 'Für KI kopieren',
      copied: 'Prompt mit Artikel und Auswahl kopiert',
      failed: 'Kopieren fehlgeschlagen',
      source: 'Quelle',
      prompt: 'Erkläre mir die markierte Stelle (<auswahl>) im Kontext des ganzen Artikels (<artikel>). '
        + 'Gib zuerst eine natürliche Übersetzung, dann erkläre ungewöhnliche Wörter, Wortneuschöpfungen, '
        + 'Austriazismen, Anspielungen und die Grammatik, wo sie schwierig ist. '
        + 'Ich lerne Deutsch (Niveau B1–B2); antworte in der Sprache, in der ich dir schreibe, sonst auf Englisch.'
    }
  }
}

export default locale
