export function applyLinkCheckResult(previousState, result) {
  const previous = previousState || {};

  if (result.ok) {
    return {
      lastCheckedAt: result.checkedAt,
      lastStatus: result.status || 200,
      lastSuccessAt: result.checkedAt,
      consecutiveFailures: 0
    };
  }

  return {
    lastCheckedAt: result.checkedAt,
    lastStatus: result.status || "network-error",
    lastSuccessAt: previous.lastSuccessAt || null,
    consecutiveFailures: (previous.consecutiveFailures || 0) + 1
  };
}
