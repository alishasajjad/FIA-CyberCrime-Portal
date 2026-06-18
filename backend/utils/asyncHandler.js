/**
 * Wraps async route handlers so rejected promises reach Express error middleware.
 * Prevents unhandled promise rejections from crashing the Node process under load.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
