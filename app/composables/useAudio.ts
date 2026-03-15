export const useAudio = () => {
  const { $audioContext, $masterGainNode, $masterGainSliderValue, $isAudioRenderingEnabled } = useNuxtApp()

  return {
    audioContext: $audioContext,
    masterGainNode: $masterGainNode,
    masterGainSliderValue: $masterGainSliderValue,
    isAudioRenderingEnabled: $isAudioRenderingEnabled
  }
}
