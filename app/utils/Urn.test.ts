import { describe, it, expect } from 'vitest'
import Urn from './Urn'

describe('Urn', () => {
  it('returns values in range [0, max)', () => {
    const urn = new Urn(5)
    for (let i = 0; i < 20; i++) {
      const v = urn.bang()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(5)
    }
  })

  it('returns each value exactly once before repeating (within a cycle)', () => {
    const max = 6
    const urn = new Urn(max)
    const seen = new Set<number>()
    for (let i = 0; i < max; i++) {
      seen.add(urn.bang())
    }
    expect(seen.size).toBe(max)
  })

  it('never returns the same value twice in a row', () => {
    const urn = new Urn(3)
    let prev = urn.bang()
    for (let i = 0; i < 30; i++) {
      const next = urn.bang()
      expect(next).not.toBe(prev)
      prev = next
    }
  })

  it('never returns the same value twice in a row across cycle boundaries', () => {
    // With max=2 the reshuffle happens often, making cross-boundary collision likely
    const urn = new Urn(2)
    let prev = urn.bang()
    for (let i = 0; i < 20; i++) {
      const next = urn.bang()
      expect(next).not.toBe(prev)
      prev = next
    }
  })

  it('exposes the max it was created with', () => {
    const urn = new Urn(7)
    expect(urn.max).toBe(7)
  })
})
