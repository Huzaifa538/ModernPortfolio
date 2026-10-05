// Last resort for thrown errors / rejected promises (used by server.js).
// Keeps responses in the same { error } shape the rest of the API uses.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message || 'Something went wrong';
  res.status(status).json({ error: message });
};
