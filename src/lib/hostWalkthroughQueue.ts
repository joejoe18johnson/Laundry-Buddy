type Listener = (options: { replay: boolean }) => void

const listeners = new Set<Listener>()

export function requestHostBookingWalkthrough(options?: { replay?: boolean }): void {
  const replay = options?.replay ?? false
  listeners.forEach((listener) => listener({ replay }))
}

export function onHostBookingWalkthroughRequested(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
