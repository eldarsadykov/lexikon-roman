/**
 * AudioWorkletProcessor that performs equal-power (sine-interpolated) crossfade
 * between two stereo inputs.
 *
 * Inputs:
 *   - input 0: "left" source
 *   - input 1: "right" source
 *
 * The processor self-generates ramps: when the current ramp finishes, a new one
 * is generated with random target balance and duration, and posted to the main
 * thread as { balance, duration, startTime }.
 *
 * The processor applies sin(balance * π/2) gain to the right input
 * and sin((1 - balance) * π/2) = cos(balance * π/2) gain to the left input,
 * producing a constant-power crossfade.
 */

const HALF_PI = Math.PI / 2

const random = max => Math.floor(Math.random() * max)

const linStep = (step, steps, start, end) => {
  return start + (step / (steps - 1)) * (end - start)
}

const logStep = (step, steps, start, end) => {
  return start ** (1 - step / (steps - 1)) * end ** (step / (steps - 1))
}

class CrossfadeProcessor extends AudioWorkletProcessor {
  parameters = {
    balanceSteps: 5,
    minBalance: 0,
    maxBalance: 1,
    durationSteps: 5,
    minDuration: 4,
    maxDuration: 12
  }

  constructor() {
    super()
    this.balance = linStep(random(5), 5, 0, 1)
    this.activeRamp = null
  }

  process(inputs, outputs) {
    const {
      balanceSteps,
      minBalance,
      maxBalance,
      durationSteps,
      minDuration,
      maxDuration
    } = this.parameters

    const leftInput = inputs[0]
    const rightInput = inputs[1]
    const output = outputs[0]

    if (!output?.length) return true

    const numSamples = output[0].length

    for (let i = 0; i < numSamples; i++) {
      // Self-generate a new ramp when idle
      if (!this.activeRamp) {
        const targetBalance = linStep(random(balanceSteps), balanceSteps, minBalance, maxBalance)
        const durationSeconds = logStep(random(durationSteps), durationSteps, minDuration, maxDuration)
        const durationSamples = Math.max(1, Math.round(durationSeconds * sampleRate))

        this.activeRamp = {
          targetBalance, startBalance: this.balance, durationSamples, elapsedSamples: 0
        }

        this.port.postMessage({
          startBalance: this.balance,
          balance: targetBalance,
          duration: durationSeconds,
          startTime: currentTime
        })
      }

      // Advance active ramp
      this.activeRamp.elapsedSamples++
      const t = this.activeRamp.elapsedSamples / this.activeRamp.durationSamples
      if (t >= 1) {
        this.balance = this.activeRamp.targetBalance
        this.activeRamp = null
      } else {
        this.balance = this.activeRamp.startBalance + (this.activeRamp.targetBalance - this.activeRamp.startBalance) * t
      }

      const leftGain = Math.sin((1 - this.balance) * HALF_PI)
      const rightGain = Math.sin(this.balance * HALF_PI)

      for (let channel = 0; channel < output.length; channel++) {
        const leftSample = leftInput?.[channel]?.[i] ?? 0
        const rightSample = rightInput?.[channel]?.[i] ?? 0
        output[channel][i] = leftSample * leftGain + rightSample * rightGain
      }
    }

    return true
  }
}

registerProcessor('crossfade-processor', CrossfadeProcessor)
