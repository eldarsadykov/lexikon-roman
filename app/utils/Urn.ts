function range(n: number) {
  return Array.from({ length: n }, (_, i) => i)
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j]!, array[i]!]
  }
  return array
}

export default class Urn {
  private collection: number[] = []
  private offset = 0
  private last: number | null = null
  readonly max: number

  constructor(max: number) {
    this.max = max
    this.clear()
  }

  private clear() {
    this.collection = shuffle(range(this.max))
  }

  private toggleOffset() {
    this.offset = 1 - this.offset
  }

  private withOffset(value: number) {
    return (value + this.offset) % this.max
  }

  bang() {
    if (this.collection.length === 0) {
      this.clear()
    }

    const newValue = this.collection.pop()

    if (newValue === undefined) {
      throw new Error('Collection is unexpectedly empty!')
    }

    if (this.withOffset(newValue) === this.last) {
      this.toggleOffset()
    }

    this.last = this.withOffset(newValue)

    return this.last
  }
}
