<script setup lang="ts">
import { Urn } from '@puresignal/essl'
import { useRafFn } from '@vueuse/core'
import { type RampInfo, CrossfadeWorklet } from '~/utils/audio/CrossfadeWorklet'
import attenuationData from '~/assets/audio/attenuation.json'

const { audioContext, masterGainNode, masterGainSliderValue, isAudioEnabled } = useAudio()

const audioUrls = Object.values(
  import.meta.glob('~/assets/audio/*.opus', {
    eager: true,
    query: '?url',
    import: 'default'
  }) as Record<string, string>
)

function applyAttenuation(gainNode: GainNode, index: number) {
  if (!attenuationData[index]) throw new Error('Could not find attenuation data at index ' + index)
  const db = attenuationData[index]?.attenuation_db
  console.log('-----> [AudioControls] db', db)
  gainNode.gain.value = Math.pow(10, db / 20)
}

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

let crossfade: CrossfadeWorklet | null = null
let leftPlayer: MediaElementAudioSourceNode | null = null
let rightPlayer: MediaElementAudioSourceNode | null = null
let leftAttenuationGain: GainNode | null = null
let rightAttenuationGain: GainNode | null = null

const leftAudioEl = new Audio(audioUrls[leftUrnValue.value])
const rightAudioEl = new Audio(audioUrls[rightUrnValue.value])

let ramp: RampInfo | null = null

const currentBalance = ref<number | null>(null)

const onRamp = (incoming: RampInfo) => {
  ramp = incoming
  console.log(ramp)
}

onMounted(async () => {
  crossfade = await CrossfadeWorklet.create(audioContext, { onRamp })

  leftPlayer = new MediaElementAudioSourceNode(audioContext, {
    mediaElement: leftAudioEl
  })

  rightPlayer = new MediaElementAudioSourceNode(audioContext, {
    mediaElement: rightAudioEl
  })

  leftAttenuationGain = new GainNode(audioContext)
  rightAttenuationGain = new GainNode(audioContext)

  leftPlayer.connect(leftAttenuationGain)
  rightPlayer.connect(rightAttenuationGain)

  applyAttenuation(leftAttenuationGain, leftUrnValue.value)
  applyAttenuation(rightAttenuationGain, rightUrnValue.value)

  crossfade.connect(masterGainNode)

  crossfade.offerLeftInputConnection(leftAttenuationGain)
  crossfade.offerRightInputConnection(rightAttenuationGain)

  ;[leftAudioEl, rightAudioEl].forEach((audioEl) => {
    audioEl.loop = true
  })
})

onUnmounted(() => {
  crossfade?.disconnect()
  leftAttenuationGain?.disconnect()
  rightAttenuationGain?.disconnect()
  leftPlayer?.disconnect()
  rightPlayer?.disconnect()

  crossfade = null
  leftAttenuationGain = null
  rightAttenuationGain = null
  leftPlayer = null
  rightPlayer = null
})

let lastUrnRight = false

const next = () => {
  if (lastUrnRight) {
    const idx = leftUrn.next()
    leftUrnValue.value = idx
    leftAudioEl.src = audioUrls[idx]!
    if (leftAttenuationGain) applyAttenuation(leftAttenuationGain, idx)
    if (isAudioEnabled.value) leftAudioEl.play()
  } else {
    const idx = rightUrn.next()
    rightUrnValue.value = idx
    rightAudioEl.src = audioUrls[idx]!
    if (rightAttenuationGain) applyAttenuation(rightAttenuationGain, idx)
    if (isAudioEnabled.value) rightAudioEl.play()
  }
  lastUrnRight = !lastUrnRight
}

watch(isAudioEnabled, (enabled) => {
  if (enabled) {
    leftAudioEl.play()
    rightAudioEl.play()
  } else {
    leftAudioEl.pause()
    rightAudioEl.pause()
  }
})

const route = useRoute()
watch(() => route.path, (path) => {
  if (path.startsWith('/artikel/')) next()
  console.log(playerLabel(leftUrnCycleIndex.value, leftUrnValue.value))
  console.log(playerLabel(rightUrnCycleIndex.value, rightUrnValue.value))
})

useRafFn(() => {
  if (!crossfade || !ramp) return
  const elapsed = audioContext.currentTime - ramp.startTime
  const t = Math.min(Math.max(elapsed / ramp.duration, 0), 1)
  currentBalance.value = ramp.startBalance + (ramp.balance - ramp.startBalance) * t
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <USwitch
      v-model="isAudioEnabled"
      label="Ein / Aus"
    />
    <div class="flex flex-col gap-3">
      <div class="text-sm">
        Lautstärke
      </div>
      <USlider
        v-model="masterGainSliderValue"
        :min="0"
        :max="1"
        :step="0.01"
        :disabled="!isAudioEnabled"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
