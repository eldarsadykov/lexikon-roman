<script setup lang="ts">
import { Urn } from '@puresignal/essl'

const { audioContext, masterGainNode, masterGainSliderValue } = useAudio()

onMounted(() => {
  const osc = new OscillatorNode(audioContext)
  osc.connect(masterGainNode)
  osc.start()
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
</template>

<style scoped>

</style>
