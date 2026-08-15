// Whitelist for winget package IDs: letters, digits, dot, dash, underscore.
const WINGET_ID_REGEX = /^[\w.-]+$/;
function isValidWingetId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 200 && WINGET_ID_REGEX.test(id);
}

// Whitelist for search queries: letters (incl. accented), digits, spaces, dash, dot, underscore.
const SEARCH_QUERY_REGEX = /^[\p{L}\p{N} .\-_]+$/u;
function isValidSearchQuery(query) {
  return typeof query === 'string' && query.length > 0 && query.length <= 200 && SEARCH_QUERY_REGEX.test(query);
}

function isOriginAllowed(origin, allowedOrigins) {
  // Requests with no origin (e.g. same-origin, curl, server-to-server) are allowed.
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

module.exports = { isValidWingetId, isValidSearchQuery, isOriginAllowed };
