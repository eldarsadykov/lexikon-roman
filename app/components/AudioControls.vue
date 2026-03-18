<script setup lang="ts">
import { logSteps as transLog, steps as transLin, Urn } from '@puresignal/essl'
import { useRafFn } from '@vueuse/core'
import { CrossfadeWorklet } from '~/utils/audio/CrossfadeWorklet'

const { audioContext, masterGainNode, masterGainSliderValue } = useAudio()

const audioUrls = Object.values(
  import.meta.glob('~/assets/audio/*.opus', {
    eager: true,
    query: '?url',
    import: 'default'
  }) as Record<string, string>
)

const onCycle = () => {
  if (lastUrnRight) {
    leftUrnCycleIndex.value++
  } else {
    rightUrnCycleIndex.value++
  }
}

const leftUrn = new Urn(audioUrls.length, { onCycle })
const leftUrnCycleIndex = ref(0)
const leftUrnValue = ref<number>(leftUrn.next())

const rightUrn = new Urn(audioUrls.length, { onCycle })
const rightUrnCycleIndex = ref(0)
const rightUrnValue = ref<number>(rightUrn.next())

const audioName = (url: string) =>
  url.replace(/^.*\//, '').replace(/\.opus$/, '')

const playerLabel = (cycle: number, idx: number | null) =>
  `C${cycle} | ${idx ?? '-'}: ${idx != null ? audioName(audioUrls[idx]!) : '-'}`

const targetBalance = ref(0.5)

let crossfade: CrossfadeWorklet | null = null
let leftPlayer: MediaElementAudioSourceNode | null = null
let rightPlayer: MediaElementAudioSourceNode | null = null

const leftAudioEl = new Audio(audioUrls[leftUrnValue.value])
const rightAudioEl = new Audio(audioUrls[rightUrnValue.value])

onMounted(async () => {
  crossfade = await CrossfadeWorklet.create(audioContext)

  leftPlayer = new MediaElementAudioSourceNode(audioContext, {
    mediaElement: leftAudioEl
  })

  rightPlayer = new MediaElementAudioSourceNode(audioContext, {
    mediaElement: rightAudioEl
  })

  crossfade.connect(masterGainNode)

  crossfade.offerConnectionToLeftInput(leftPlayer)
  crossfade.offerConnectionToRightInput(rightPlayer)

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

const random = (max: number) => Math.floor(Math.random() * max)

const betweenLog = (start: number, end: number, steps: number) => {
  return transLog(random(steps), steps, start, end)
}

const betweenLin = (start: number, end: number, steps: number) => {
  return transLin(random(steps), steps, start, end)
}

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

  const steps = 5

  const duration = betweenLog(4, 12, steps)
  targetBalance.value = betweenLin(0, 1, steps)
  crossfade?.setBalanceOverTime(targetBalance.value, duration)
}

const currentBalance = ref(targetBalance.value)

useRafFn(() => {
  if (!crossfade) return
  currentBalance.value = crossfade.currentBalance
})
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
  <USlider
    v-model="currentBalance"
    :min="0"
    :max="1"
    :step="0.01"
    disabled
  />
</template>

<style scoped>

</style>
