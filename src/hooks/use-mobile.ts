import * as React from "react"

// The sidebar is an off-canvas sheet below `lg` (CLAUDE.md), so "mobile" here means narrower than lg.
const MOBILE_BREAKPOINT = 1024
// Local change: useSyncExternalStore instead of an effect, so the first render already knows the width.
const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
