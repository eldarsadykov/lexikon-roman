export default interface AudioNodeLike {
  connect(node: AudioNodeLike): AudioNodeLike
  disconnect(): void
}
