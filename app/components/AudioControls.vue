<script setup lang="ts">
import { Urn } from '@puresignal/essl'
import { Crossfade } from '~/utils/audio/Crossfade'

const { audioContext, masterGainNode, masterGainSliderValue } = useAudio()

const targetBalance = ref(0.5)

let crossfade: Crossfade | null = null
let leftPlayer: MediaElementAudioSourceNode | null = null
let rightPlayer: MediaElementAudioSourceNode | null = null

const leftAudioEl = new Audio('/audio/7x7_1.opus')
const rightAudioEl = new Audio('/audio/Cafe.opus')

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

const fileCount = 91
let lastUrnRight = false

const onCycle = () => {
  if (lastUrnRight) {
    leftUrnCycleIndex.value++
  } else {
    rightUrnCycleIndex.value++
  }
}

const leftUrn = new Urn(fileCount, { onCycle })
const leftUrnCycleIndex = ref(0)
const leftUrnValue = ref<number | null>(null)

const rightUrn = new Urn(fileCount, { onCycle })
const rightUrnCycleIndex = ref(0)
const rightUrnValue = ref<number | null>(null)

const next = () => {
  if (lastUrnRight) {
    leftUrnValue.value = leftUrn.next()
  } else {
    rightUrnValue.value = rightUrn.next()
  }
  lastUrnRight = !lastUrnRight
  crossfade?.setBalanceOverTime(targetBalance.value, 1)
}
</script>

<template>
  <div>Left Cycle: {{ leftUrnCycleIndex }}</div>
  <div>Left Value: {{ leftUrnValue ?? '-' }}</div>
  <div>Right Cycle: {{ rightUrnCycleIndex }}</div>
  <div>Right Value: {{ rightUrnValue ?? '-' }}</div>
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
