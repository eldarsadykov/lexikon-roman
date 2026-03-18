import type AudioNodeLike from '~/utils/audio/AudioNodeLike'

/**
 * AudioWorklet-based equal-power crossfade between two audio sources.
 *
 * Must call `CrossfadeWorklet.register(audioContext)` once before constructing.
 * Balance automation is message-based: `setBalanceOverTime()` posts ramp commands
 * to the processor, which queues and executes them sequentially.
 */
export class CrossfadeWorklet {
  readonly audioContext: AudioContext
  private readonly workletNode: AudioWorkletNode
  private readonly leftInput: GainNode
  private readonly rightInput: GainNode
  private _currentBalance = 0.5

  private constructor(audioContext: AudioContext) {
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

    this.workletNode.port.onmessage = (e: MessageEvent<{ currentBalance: number }>) => {
      this._currentBalance = e.data.currentBalance
    }
  }

  get currentBalance(): number {
    return this._currentBalance
  }

  /**
   * Register the crossfade processor with the given AudioContext.
   * Call once before creating any CrossfadeWorklet instances.
   */
  static async register(audioContext: AudioContext): Promise<void> {
    const processorUrl = new URL('./crossfade-processor.ts', import.meta.url).href
    await audioContext.audioWorklet.addModule(processorUrl)
  }

  /**
   * Create a CrossfadeWorklet. Registers the processor if needed.
   */
  static async create(audioContext: AudioContext): Promise<CrossfadeWorklet> {
    await CrossfadeWorklet.register(audioContext)
    return new CrossfadeWorklet(audioContext)
  }

  /**
   * Queue a linear balance ramp. Ramps execute sequentially on the audio thread.
   * @param balance Target balance (0 = full left, 1 = full right)
   * @param duration Ramp duration in seconds
   */
  setBalanceOverTime(balance: number, duration: number) {
    this.workletNode.port.postMessage({ balance, duration })
  }

  offerConnectionToLeftInput(node: AudioNodeLike) {
    node.connect(this.leftInput)
  }

  offerConnectionToRightInput(node: AudioNodeLike) {
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
