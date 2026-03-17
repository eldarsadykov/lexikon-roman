import type AudioNodeLike from '~/utils/audio/AudioNodeLike'

export interface CrossfadeOptions {
  balance: number
}

function smoothParameterChange(parameter: AudioParam, value: number) {
  parameter.setTargetAtTime(value, 0, 0.3)
}

function sineInterpolation(t: number) {
  return Math.sin(t * Math.PI / 2)
}

function sineRampToValueAtTime(
  parameter: AudioParam,
  oldValue: number,
  newValue: number,
  startTime: number,
  duration: number,
  resolution: number) {
  const length = duration * resolution
  const values = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const rampPhase = i / length
    const currentWeight = oldValue + (newValue - oldValue) * rampPhase
    values[i] = sineInterpolation(currentWeight)
  }
  parameter.setValueCurveAtTime(values, startTime, duration)
  console.log(values)
}

export class Crossfade {
  readonly audioContext: AudioContext
  private _balance: number
  private readonly leftGain: GainNode
  private readonly rightGain: GainNode

  constructor(audioContext: AudioContext, { balance = 0.5 } = {} as CrossfadeOptions) {
    this.audioContext = audioContext
    this._balance = balance

    this.leftGain = new GainNode(this.audioContext, {
      gain: this.leftGainValue
    })

    this.rightGain = new GainNode(this.audioContext, {
      gain: this.rightGainValue
    })
  }

  setBalanceOverTime(value: number, startTime: number, duration: number) {
    const oldBalance = this.balance
    this._balance = value

    const oldLeftGainWeight = 1 - oldBalance
    const oldRightGainWeight = oldBalance

    const resolution = this.audioContext.sampleRate / 100

    sineRampToValueAtTime(this.leftGain.gain, oldLeftGainWeight, this.leftGainWeight, startTime, duration, resolution)
    sineRampToValueAtTime(this.rightGain.gain, oldRightGainWeight, this.rightGainWeight, startTime, duration, resolution)
  }

  connectToLeftInput(node: AudioNodeLike) {
    node.connect(this.leftGain)
  }

  connectToRightInput(node: AudioNodeLike) {
    node.connect(this.rightGain)
  }

  get currentBalance(): number {
    return this.rightGain.gain.value
  }

  private get leftGainWeight() {
    return 1 - this.balance
  }

  private get rightGainWeight() {
    return this.balance
  }

  private get leftGainValue() {
    return sineInterpolation(this.leftGainWeight)
  }

  private get rightGainValue() {
    return sineInterpolation(this.rightGainWeight)
  }

  get balance() {
    return this._balance
  }

  set balance(value: number) {
    this._balance = value
    smoothParameterChange(this.leftGain.gain, this.leftGainValue)
    smoothParameterChange(this.rightGain.gain, this.rightGainValue)
  }

  connect(audioNode: AudioNode) {
    this.leftGain.connect(audioNode)
    this.rightGain.connect(audioNode)
    return audioNode
  }

  disconnect() {
    this.leftGain.disconnect()
    this.rightGain.disconnect()
  }
}
