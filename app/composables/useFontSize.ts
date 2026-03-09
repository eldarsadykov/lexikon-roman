const fontSizeMap = {
  small: 'text-sm [&_p]:leading-6',
  normal: '',
  large: 'text-lg [&_p]:leading-8'
} as const

export type FontSize = keyof typeof fontSizeMap

export const fontSizeItems = [
  { label: 'Klein', value: 'small' },
  { label: 'Normal', value: 'normal' },
  { label: 'Groß', value: 'large' }
] satisfies { label: string, value: FontSize }[]

export function useFontSize() {
  const fontSize = useState<FontSize>('article-font-size', () => 'normal')
  const fontSizeClass = computed(() => fontSizeMap[fontSize.value])
  return { fontSize, fontSizeClass }
}
