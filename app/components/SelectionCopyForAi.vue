<script setup lang="ts">
const props = defineProps<{
  articleId: string
  title: string
}>()

const toast = useToast()
const { t } = useLocale()

// Last non-empty selection inside the article. Kept after the selection
// collapses, because tapping the button can clear the selection on iOS
// before the click event fires.
const selectedText = ref('')
const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined

function getArticle() {
  return document.getElementById(props.articleId)
}

function onSelectionChange() {
  const selection = document.getSelection()
  const article = getArticle()
  const text = selection?.toString().trim() ?? ''

  if (
    selection
    && article
    && text
    && selection.rangeCount > 0
    && article.contains(selection.getRangeAt(0).commonAncestorContainer)
  ) {
    clearTimeout(hideTimer)
    selectedText.value = text
    visible.value = true
    return
  }

  // Delay hiding so a tap on the button still registers.
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 400)
}

function buildPrompt(articleText: string, selection: string) {
  return [
    t('copyForAi.prompt'),
    '',
    `${t('copyForAi.source')}: „${props.title}“ – Andreas Okopenko, Lexikon-Roman (${window.location.href})`,
    '',
    '<artikel>',
    articleText,
    '</artikel>',
    '',
    '<auswahl>',
    selection,
    '</auswahl>'
  ].join('\n')
}

async function copyForAi() {
  const article = getArticle()
  if (!article || !selectedText.value) return

  try {
    await navigator.clipboard.writeText(buildPrompt(article.innerText.trim(), selectedText.value))
    toast.add({ title: t('copyForAi.copied'), icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: t('copyForAi.failed'), icon: 'i-lucide-circle-x', color: 'error' })
  }

  visible.value = false
}

onMounted(() => document.addEventListener('selectionchange', onSelectionChange))
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  clearTimeout(hideTimer)
})
</script>

<template>
  <Transition
    enter-from-class="opacity-0 translate-y-2"
    leave-to-class="opacity-0 translate-y-2"
    enter-active-class="transition duration-150"
    leave-active-class="transition duration-150"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 z-50 flex justify-center pointer-events-none select-none bottom-[calc(env(safe-area-inset-bottom)+1.5rem)]"
    >
      <UButton
        class="pointer-events-auto shadow-lg"
        color="primary"
        size="lg"
        icon="i-lucide-sparkles"
        :label="t('copyForAi.button')"
        @pointerdown.prevent
        @mousedown.prevent
        @click="copyForAi"
      />
    </div>
  </Transition>
</template>
