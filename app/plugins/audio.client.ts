export default defineNuxtPlugin(() => {
  const audioContext = new AudioContext()

  const masterGainSliderValue = ref(1.0)
  const masterGainNode = new GainNode(audioContext, {
    gain: masterGainSliderValue.value
  })

  const isAudioEnabled = ref(false)

  const muteNode = new GainNode(audioContext, {
    gain: isAudioEnabled.value ? 1 : 0
  })

  masterGainNode.connect(muteNode)
  muteNode.connect(audioContext.destination)

  watch(masterGainSliderValue, (newValue: number) => {
    masterGainNode.gain.setTargetAtTime(newValue, 0, 0.02)
  })

  watch(isAudioEnabled, (value) => {
    muteNode.gain.setTargetAtTime(value ? 1 : 0, 0, 0.3)
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
