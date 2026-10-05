// Vercel serverless entry point — re-exports the Express app.
// server.js detects VERCEL env and skips app.listen(), exporting instead.
module.exports = require('../backend/server.js');
