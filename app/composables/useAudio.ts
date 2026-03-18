export const useAudio = () => {
  const { $audioContext, $masterGainNode, $masterGainSliderValue, $muteNode, $isAudioEnabled, $isAudioRenderingEnabled } = useNuxtApp()

  return {
    audioContext: $audioContext,
    masterGainNode: $masterGainNode,
    masterGainSliderValue: $masterGainSliderValue,
    muteNode: $muteNode,
    isAudioEnabled: $isAudioEnabled,
    isAudioRenderingEnabled: $isAudioRenderingEnabled
  }
}
