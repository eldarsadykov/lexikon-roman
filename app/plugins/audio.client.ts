export default defineNuxtPlugin(() => {
  const audioContext = new AudioContext()

  const MIN_DB = -40
  const sliderToGain = (v: number) => v <= 0 ? 0 : 10 ** (MIN_DB * (1 - v) / 20)

  const masterGainSliderValue = ref(1)
  const masterGainNode = new GainNode(audioContext, {
    gain: sliderToGain(masterGainSliderValue.value)
  })

  const isAudioEnabled = ref(false)

  const muteNode = new GainNode(audioContext, {
    gain: isAudioEnabled.value ? 1 : 0
  })

  masterGainNode.connect(muteNode)
  muteNode.connect(audioContext.destination)

  watch(masterGainSliderValue, (v: number) => {
    masterGainNode.gain.setTargetAtTime(sliderToGain(v), 0, 0.02)
  })

  watch(isAudioEnabled, (value) => {
    muteNode.gain.setTargetAtTime(value ? 1 : 0, 0, 0.05)
  })

  const isAudioRenderingEnabled = useState<boolean>(
    'isAudioRenderingEnabled',
    () => audioContext.state === 'running'
  )

  return {
    provide: {
      audioContext,
      masterGainNode,
      masterGainSliderValue,
      muteNode,
      isAudioEnabled,
      isAudioRenderingEnabled
    }
  }
})
