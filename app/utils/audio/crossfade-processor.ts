/**
 * AudioWorkletProcessor that performs equal-power (sine-interpolated) crossfade
 * between two stereo inputs.
 *
 * Inputs:
 *   - input 0: "left" source
 *   - input 1: "right" source
 *
 * Messages:
 *   - { balance: number, duration: number } — queue a linear ramp to `balance`
 *     over `duration` seconds. Ramps execute sequentially.
 *
 * The processor applies sin(balance * π/2) gain to the right input
 * and sin((1 - balance) * π/2) = cos(balance * π/2) gain to the left input,
 * producing a constant-power crossfade.
 */

const HALF_PI = Math.PI / 2

interface RampEntry {
  targetBalance: number
  durationSamples: number
}

interface ActiveRamp {
  targetBalance: number
  startBalance: number
  durationSamples: number
  elapsedSamples: number
}

class CrossfadeProcessor extends AudioWorkletProcessor {
  private balance = 0.5
  private rampQueue: RampEntry[] = []
  private activeRamp: ActiveRamp | null = null

  constructor() {
    super()
    this.port.onmessage = (event: MessageEvent<{ balance: number, duration: number }>) => {
      const { balance, duration } = event.data
      const durationSamples = Math.max(1, Math.round(duration * sampleRate))
      this.rampQueue.push({ targetBalance: balance, durationSamples })
    }
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const leftInput = inputs[0]
    const rightInput = inputs[1]
    const output = outputs[0]!

    if (!output?.length) return true

    const numSamples = output[0]!.length

    for (let i = 0; i < numSamples; i++) {
      // Activate next ramp if idle
      if (!this.activeRamp && this.rampQueue.length > 0) {
        const next = this.rampQueue.shift()!
        this.activeRamp = {
          targetBalance: next.targetBalance,
          startBalance: this.balance,
          durationSamples: next.durationSamples,
          elapsedSamples: 0
        }
      }

      // Advance active ramp
      if (this.activeRamp) {
        this.activeRamp.elapsedSamples++
        const t = this.activeRamp.elapsedSamples / this.activeRamp.durationSamples
        if (t >= 1) {
          this.balance = this.activeRamp.targetBalance
          this.activeRamp = null
        } else {
          this.balance = this.activeRamp.startBalance
            + (this.activeRamp.targetBalance - this.activeRamp.startBalance) * t
        }
      }

      const leftGain = Math.sin((1 - this.balance) * HALF_PI)
      const rightGain = Math.sin(this.balance * HALF_PI)

      for (let channel = 0; channel < output.length; channel++) {
        const leftSample = leftInput?.[channel]?.[i] ?? 0
        const rightSample = rightInput?.[channel]?.[i] ?? 0
        output[channel]![i] = leftSample * leftGain + rightSample * rightGain
      }
    }

    this.port.postMessage({ currentBalance: this.balance })

    return true
  }
}

registerProcessor('crossfade-processor', CrossfadeProcessor)
