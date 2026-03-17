<script setup lang="ts">
import { Urn } from '@puresignal/essl'
import { AudioStreamPlayer } from '@puresignal/fetch-stream-audio'
import opusWorkerUrl from '@puresignal/fetch-stream-audio/worker-decoder-opus?url'
import { Crossfade } from '~/utils/audio/Crossfade'

const { audioContext, masterGainNode, masterGainSliderValue } = useAudio()

const targetBalance = ref(0.5)

let crossfade: Crossfade | null = null
let leftPlayer: AudioStreamPlayer | null = null
let rightPlayer: AudioStreamPlayer | null = null

onMounted(() => {
  crossfade = new Crossfade(audioContext)

  leftPlayer = new AudioStreamPlayer(
    audioContext,
    '/audio/7x7_1.opus',
    1024 * 2,
    'OPUS',
    {
      opusWorkerUrl
    }
  )

  rightPlayer = new AudioStreamPlayer(
    audioContext,
    '/audio/Cafe.opus',
    1024 * 2,
    'OPUS',
    {
      opusWorkerUrl
    }
  )

  crossfade.connect(masterGainNode)

  crossfade.connectToLeftInput(leftPlayer)
  crossfade.connectToRightInput(rightPlayer)

  leftPlayer.start()
  rightPlayer.start()
})

onUnmounted(() => {
  crossfade?.disconnect()
  leftPlayer?.disconnect()
  rightPlayer?.disconnect()

  crossfade = null
  leftPlayer = null
  rightPlayer = null
})

const fileCount = 5
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
