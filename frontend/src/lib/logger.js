import posthog, { isPosthogEnabled } from './posthog.js'

function emit(level, message, attributes) {
  if (isPosthogEnabled) {
    posthog.logger[level](message, attributes)
  }
}

export const appLogger = {
  digestGenerationRequested(inputSource) {
    emit('info', 'digest_generation_requested', { input_source: inputSource })
  },
  digestGenerationCompleted({ repositoryFileCount, digestFileCount, digestTokenCount, servedFromCache }) {
    emit('info', 'digest_generation_completed', {
      repository_file_count: repositoryFileCount,
      digest_file_count: digestFileCount,
      digest_token_count: digestTokenCount,
      served_from_cache: servedFromCache,
    })
  },
  digestGenerationFailed() {
    emit('error', 'digest_generation_failed')
  },
  chatQuestionSubmitted(questionSource) {
    emit('info', 'chat_question_submitted', { question_source: questionSource })
  },
  chatResponseCompleted(questionSource) {
    emit('info', 'chat_response_completed', { question_source: questionSource })
  },
  chatResponseFailed(questionSource) {
    emit('error', 'chat_response_failed', { question_source: questionSource })
  },
}
