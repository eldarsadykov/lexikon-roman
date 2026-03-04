export function useChapterAudio() {
  if (import.meta.server) {
    return
  }

  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  let player: HTMLAudioElement | null = null
  let activeChapterKey: string | null = null
  let playbackRequestId = 0

  const stopPlayback = () => {
    if (!player) {
      return
    }

    player.pause()
    player.src = ''
    player = null
  }

  const getChapterInfo = (path: string) => {
    const [pathname] = path.split('?')
    const [cleanPath] = (pathname ?? '').split('#')
    const segments = (cleanPath ?? '').split('/').filter(Boolean)
    const firstSegment = segments[0]

    if (!firstSegment) {
      return null
    }

    const prefixedSlugMatch = firstSegment.match(/^\d+\.(.+)$/)
    const slug = prefixedSlugMatch?.[1] || firstSegment

    return {
      key: firstSegment,
      audioCandidates: Array.from(new Set([
        `/audio/${firstSegment}.mp3`,
        `/audio/${slug}.mp3`
      ]))
    }
  }

  const tryPlay = (audio: HTMLAudioElement, src: string) => {
    return new Promise<boolean>((resolve) => {
      const cleanup = () => {
        audio.removeEventListener('error', onError)
        audio.removeEventListener('canplaythrough', onReady)
      }

      const onError = () => {
        cleanup()
        resolve(false)
      }

      const onReady = () => {
        cleanup()
        resolve(true)
      }

      audio.addEventListener('error', onError, { once: true })
      audio.addEventListener('canplaythrough', onReady, { once: true })

      audio.src = src
      audio.load()
    })
  }

  const getRandomAmbientPreviewUrl = async () => {
    const token = runtimeConfig.public.freesoundApiToken
    if (!token) {
      return null
    }

    const response = await $fetch<{
      results?: Array<{
        previews?: {
          'preview-hq-mp3'?: string
          'preview-lq-mp3'?: string
        }
      }>
    }>('https://freesound.org/apiv2/search/text/', {
      query: {
        query: 'ambient',
        filter: 'duration:[20 TO 600]',
        fields: 'previews',
        page_size: 50,
        token
      }
    })

    const previews = (response.results || [])
      .map((sound) => sound.previews?.['preview-hq-mp3'] || sound.previews?.['preview-lq-mp3'] || null)
      .filter((preview): preview is string => Boolean(preview))

    if (!previews.length) {
      return null
    }

    return previews[Math.floor(Math.random() * previews.length)] || null
  }

  const updatePlaybackForPath = async (path: string) => {
    playbackRequestId += 1
    const requestId = playbackRequestId

    const chapterInfo = getChapterInfo(path)

    if (!chapterInfo) {
      activeChapterKey = null
      stopPlayback()
      return
    }

    if (chapterInfo.key === activeChapterKey) {
      return
    }

    activeChapterKey = chapterInfo.key
    stopPlayback()

    const audio = new Audio()
    audio.preload = 'auto'

    for (const candidate of chapterInfo.audioCandidates) {
      const isPlayable = await tryPlay(audio, candidate)
      if (requestId !== playbackRequestId) {
        audio.pause()
        audio.src = ''
        return
      }

      if (!isPlayable) {
        continue
      }

      player = audio
      try {
        await audio.play()
      } catch {
        // Ignore autoplay-blocked errors; source remains loaded for manual play.
      }
      return
    }

    try {
      const randomAmbientUrl = await getRandomAmbientPreviewUrl()
      if (requestId !== playbackRequestId || !randomAmbientUrl) {
        audio.pause()
        audio.src = ''
        return
      }

      const isPlayable = await tryPlay(audio, randomAmbientUrl)
      if (requestId !== playbackRequestId) {
        audio.pause()
        audio.src = ''
        return
      }

      if (!isPlayable) {
        return
      }

      player = audio
      try {
        await audio.play()
      } catch {
        // Ignore autoplay-blocked errors; source remains loaded for manual play.
      }
    } catch {
      // Ignore network/API errors and keep silent fallback behavior.
    }
  }

  watch(
    () => route.fullPath,
    (path) => {
      void updatePlaybackForPath(path)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    stopPlayback()
  })
}
