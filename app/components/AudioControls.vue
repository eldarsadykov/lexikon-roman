<script setup lang="ts">
import { Urn } from '@puresignal/essl'
import { Crossfade } from '~/utils/audio/Crossfade'

const { audioContext, masterGainNode, masterGainSliderValue } = useAudio()

const audioUrls = Object.values(
  import.meta.glob('~/assets/audio/*.opus', {
    eager: true,
    query: '?url',
    import: 'default'
  }) as Record<string, string>
)

const audioName = (url: string) =>
  url.replace(/^.*\//, '').replace(/\.opus$/, '')

const playerLabel = (cycle: number, idx: number | null) =>
  `C${cycle} | ${idx ?? '-'}: ${idx != null ? audioName(audioUrls[idx]!) : '-'}`

const targetBalance = ref(0.5)

let crossfade: Crossfade | null = null
let leftPlayer: MediaElementAudioSourceNode | null = null
let rightPlayer: MediaElementAudioSourceNode | null = null

const leftAudioEl = new Audio(audioUrls[0])
const rightAudioEl = new Audio(audioUrls[1])

onMounted(() => {
  crossfade = new Crossfade(audioContext)

  leftPlayer = new MediaElementAudioSourceNode(audioContext, {
    mediaElement: leftAudioEl
  })

  rightPlayer = new MediaElementAudioSourceNode(audioContext, {
    mediaElement: rightAudioEl
  })

  crossfade.connect(masterGainNode)

  crossfade.connectToLeftInput(leftPlayer)
  crossfade.connectToRightInput(rightPlayer)

  ;[leftAudioEl, rightAudioEl].forEach((audioEl) => {
    audioEl.loop = true
    audioEl.play()
  })
})

onUnmounted(() => {
  crossfade?.disconnect()
  leftPlayer?.disconnect()
  rightPlayer?.disconnect()

  crossfade = null
  leftPlayer = null
  rightPlayer = null
})

let lastUrnRight = false

const onCycle = () => {
  if (lastUrnRight) {
    leftUrnCycleIndex.value++
  } else {
    rightUrnCycleIndex.value++
  }
}

const leftUrn = new Urn(audioUrls.length, { onCycle })
const leftUrnCycleIndex = ref(0)
const leftUrnValue = ref<number | null>(null)

const rightUrn = new Urn(audioUrls.length, { onCycle })
const rightUrnCycleIndex = ref(0)
const rightUrnValue = ref<number | null>(null)

const next = () => {
  if (lastUrnRight) {
    const idx = leftUrn.next()
    leftUrnValue.value = idx
    leftAudioEl.src = audioUrls[idx]!
    leftAudioEl.play()
  } else {
    const idx = rightUrn.next()
    rightUrnValue.value = idx
    rightAudioEl.src = audioUrls[idx]!
    rightAudioEl.play()
  }
  lastUrnRight = !lastUrnRight
  crossfade?.setBalanceOverTime(targetBalance.value, 1)
}
</script>

<template>
  <div>{{ playerLabel(leftUrnCycleIndex, leftUrnValue) }}</div>
  <div>{{ playerLabel(rightUrnCycleIndex, rightUrnValue) }}</div>
  <UButton @click="next">
    Next
  </UButton>
  <USlider
    v-model="masterGainSliderValue"
    :min="0"
    :max="1"
    :step="0.01"
  />
  <USlider
    v-model="targetBalance"
    :min="0"
    :max="1"
    :step="0.01"
  />
</template>

<style scoped>

</style>
