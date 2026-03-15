export default defineNuxtPlugin(() => {
  const audioContext = new AudioContext()

  const masterGainSliderValue = ref(0.0)
  const masterGainNode = new GainNode(audioContext, {
    gain: masterGainSliderValue.value
  })

  masterGainNode.connect(audioContext.destination)

  watch(masterGainSliderValue, (newValue: number) => {
    masterGainNode.gain.setTargetAtTime(newValue, 0, 0.02)
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
      isAudioRenderingEnabled
    }
  }
})
