import { capturePosthogEvent, isPosthogEnabled } from './posthog.js'

export function track(event, properties = {}) {
  if (!isPosthogEnabled) return

  capturePosthogEvent(event, properties)
}
