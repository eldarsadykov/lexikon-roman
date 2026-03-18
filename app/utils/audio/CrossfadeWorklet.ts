import type AudioNodeLike from '~/utils/audio/AudioNodeLike'
import processorCode from '~/utils/audio/crossfade-processor.js?raw'

export interface RampInfo {
  startBalance: number
  balance: number
  duration: number
  startTime: number
}

export interface CrossfadeOptions {
  onRamp: (ramp: RampInfo) => void
}

/**
 * AudioWorklet-based equal-power crossfade between two audio sources.
 *
 * Must call `CrossfadeWorklet.register(audioContext)` once before constructing.
 * The processor self-generates ramps and notifies the main thread via `onRamp`.
 */
export class CrossfadeWorklet {
  readonly audioContext: AudioContext
  private readonly workletNode: AudioWorkletNode
  private readonly leftInput: GainNode
  private readonly rightInput: GainNode
  private static processorRegistered = false

  private constructor(audioContext: AudioContext, options: CrossfadeOptions) {
    this.audioContext = audioContext

    this.workletNode = new AudioWorkletNode(audioContext, 'crossfade-processor', {
      numberOfInputs: 2,
      numberOfOutputs: 1,
      outputChannelCount: [2]
    })

    // AudioWorkletNode inputs need explicit channel merging via intermediate nodes.
    // We use GainNodes (gain=1) as pass-through connectors to each input index.
    this.leftInput = new GainNode(audioContext)
    this.rightInput = new GainNode(audioContext)

    this.leftInput.connect(this.workletNode, 0, 0)
    this.rightInput.connect(this.workletNode, 0, 1)

    this.workletNode.port.onmessage = (e: MessageEvent<RampInfo>) => {
      options.onRamp(e.data)
    }
  }

  /**
   * Register the crossfade processor with the given AudioContext.
   * Call once before creating any CrossfadeWorklet instances.
   */
  private static async register(audioContext: AudioContext): Promise<void> {
    const blob = new Blob([processorCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    await audioContext.audioWorklet.addModule(url)
    URL.revokeObjectURL(url)
    CrossfadeWorklet.processorRegistered = true
  }

  /**
   * Create a CrossfadeWorklet. Registers the processor if needed.
   */
  static async create(audioContext: AudioContext, options: CrossfadeOptions): Promise<CrossfadeWorklet> {
    if (!CrossfadeWorklet.processorRegistered) {
      await CrossfadeWorklet.register(audioContext)
    }
    return new CrossfadeWorklet(audioContext, options)
  }

  offerLeftInputConnection(node: AudioNodeLike) {
    node.connect(this.leftInput)
  }

  offerRightInputConnection(node: AudioNodeLike) {
    node.connect(this.rightInput)
  }

  connect(audioNode: AudioNode) {
    this.workletNode.connect(audioNode)
    return audioNode
  }

  disconnect() {
    this.leftInput.disconnect()
    this.rightInput.disconnect()
    this.workletNode.disconnect()
  }
}
