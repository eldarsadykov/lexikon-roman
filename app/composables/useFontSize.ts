const fontSizeMap = {
  small: 'text-sm',
  normal: '',
  large: 'text-lg'
} as const

export type FontSize = keyof typeof fontSizeMap

export function useFontSize() {
  const { t } = useLocale()
  const fontSize = useState<FontSize>('article-font-size', () => 'normal')
  const fontSizeClass = computed(() => fontSizeMap[fontSize.value])
  const fontSizeItems = computed(() => [
    { label: t('fontSize.small'), value: 'small' as FontSize },
    { label: t('fontSize.normal'), value: 'normal' as FontSize },
    { label: t('fontSize.large'), value: 'large' as FontSize }
  ])
  return { fontSize, fontSizeClass, fontSizeItems }
}
