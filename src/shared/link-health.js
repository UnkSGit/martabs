const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export function applyLinkCheckResult(previousState, result) {
  const previous = previousState || {};

  if (result.ok) {
    return {
      firstFailureAt: null,
      lastCheckedAt: result.checkedAt,
      lastStatus: result.status || 200,
      lastSuccessAt: result.checkedAt,
      consecutiveFailures: 0,
      dismissedAt: previous.dismissedAt || null
    };
  }

  return {
    firstFailureAt: previous.firstFailureAt || result.checkedAt,
    lastCheckedAt: result.checkedAt,
    lastStatus: result.status || "network-error",
    lastSuccessAt: previous.lastSuccessAt || null,
    consecutiveFailures: (previous.consecutiveFailures || 0) + 1,
    dismissedAt: previous.dismissedAt || null
  };
}

export function shouldShowLinkWarning(state, now = Date.now()) {
  if (!state || !state.firstFailureAt || state.consecutiveFailures <= 0) {
    return false;
  }
  if (state.dismissedAt && state.dismissedAt >= state.firstFailureAt) {
    return false;
  }
  return now - state.firstFailureAt >= TEN_DAYS_MS;
}
