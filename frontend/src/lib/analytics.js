import posthog, { isPosthogEnabled } from './posthog.js'

export function track(event, properties = {}) {
  if (!isPosthogEnabled) return

  posthog.capture(event, properties)
}

export default posthog