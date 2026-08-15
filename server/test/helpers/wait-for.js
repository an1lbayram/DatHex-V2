// Polls `conditionFn` until it returns truthy, or rejects after `timeout` ms.
// Needed because a handful of integration tests need to observe a side effect
// (e.g. spawn() being called) that happens after the HTTP/socket request is
// fired but before the response completes; a single setImmediate/tick is not
// always enough to guarantee the server has processed the request yet.
async function waitFor(conditionFn, { timeout = 1000, interval = 10 } = {}) {
  const start = Date.now();
  while (!conditionFn()) {
    if (Date.now() - start > timeout) {
      throw new Error(`waitFor: condition not met within ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

module.exports = { waitFor };
