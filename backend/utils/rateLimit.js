// rateLimit.js

const attempts = {};
const MAX_ATTEMPTS = 5;
const WINDOW_TIME = 60 * 1000;

function rateLimit(ip) {
  const now = Date.now();

  if (!attempts[ip]) {
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }

  const data = attempts[ip];

  if (now - data.firstAttempt > WINDOW_TIME) {
    attempts[ip] = { count: 1, firstAttempt: now };
    return true;
  }

  data.count++;
  if (data.count > MAX_ATTEMPTS) return false;

  return true;
}

module.exports = rateLimit;
