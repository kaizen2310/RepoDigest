const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_POSTHOG_HOST

export const isPosthogEnabled = Boolean(posthogKey && posthogHost)

let posthogClientPromise

function getPosthogClient() {
  if (!isPosthogEnabled) return Promise.resolve(null)

  if (!posthogClientPromise) {
    posthogClientPromise = import('posthog-js').then(({ default: posthog }) => {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        capture_pageleave: true,
        // These add-on scripts were blocked during the Lighthouse run and are not used by RepoDigest.
        autocapture: false,
        disable_session_recording: true,
        logs: {
          serviceName: 'repodigest-web',
          environment: import.meta.env.MODE,
        },
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: false,
        },
      })
      return posthog
    })
  }

  return posthogClientPromise
}

export function schedulePosthogInitialization() {
  if (!isPosthogEnabled || typeof window === 'undefined') return

  const initialize = () => { void getPosthogClient() }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initialize, { timeout: 3000 })
  } else {
    window.setTimeout(initialize, 1500)
  }
}

export function capturePosthogEvent(event, properties = {}) {
  void getPosthogClient().then((posthog) => posthog?.capture(event, properties))
}

export function logPosthogEvent(level, message, attributes) {
  void getPosthogClient().then((posthog) => posthog?.logger?.[level]?.(message, attributes))
}
