// ModernPortfolio API — entry point.
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

async function connectDB() {
  if (process.env.USE_IN_MEMORY_DB === 'true') {
    // Dev mode: spin up a throwaway MongoDB in RAM. Nothing to install,
    // nothing to clean up — data vanishes when the process exits.
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('🗄️  Using in-memory MongoDB (dev mode — data is NOT persisted)');
  } else {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`🗄️  Connected to MongoDB at ${process.env.MONGO_URI}`);
  }
}

const app = express();

// --- Hardening / parsing ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Uploaded files are served publicly at /uploads/<filename>
app.use('/uploads', express.static('uploads'));

// --- Rate limiting ---
// General: 100 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Login: only 5 tries per 15 minutes per IP (slows down brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form: 5 messages per hour per IP (keeps the inbox spam-free)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth/login', loginLimiter); // runs before the router below
app.use('/api/public/contact', contactLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// --- Not found ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Central error handler (must be last) ---
app.use(errorHandler);

// --- Boot ---
connectDB()
  .then(async () => {
    // Auto-seed on first boot so the demo always has content + an admin login.
    // (In-memory DB is empty on every restart, so re-seed whenever it's empty.)
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
      console.log('🌱 Database empty — seeding demo content...');
      await require('./seed-data')();
    }
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ModernPortfolio API is up');
      console.log(`   → http://localhost:${PORT}`);
      console.log(`   → Health check: http://localhost:${PORT}/api/health`);
      console.log('');
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to the database:', err.message);
    process.exit(1);
  });
