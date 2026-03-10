export function useFocusMode() {
  const focusMode = useState('focusMode', () => false)
  return { focusMode }
}
