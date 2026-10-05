// Runs after express-validator chain(s) — returns a tidy 400 if anything failed.
const { validationResult } = require('express-validator');

module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const fields = result.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));
  return res.status(400).json({ error: 'Validation failed', fields });
};
