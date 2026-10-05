const express = require('express');
const { body } = require('express-validator');
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const Testimonial = require('../models/Testimonial');
const Message = require('../models/Message');
const validate = require('../middleware/validate');

const router = express.Router();

// Portfolio content changes rarely (only from the admin panel), so cache the
// assembled response in memory for 60s — repeat visits skip MongoDB entirely.
let portfolioCache = null;
let portfolioCacheAt = 0;
const PORTFOLIO_TTL_MS = 60 * 1000;

// GET /api/public/portfolio — everything the site needs in one call
router.get('/portfolio', async (req, res, next) => {
  try {
    if (portfolioCache && Date.now() - portfolioCacheAt < PORTFOLIO_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(portfolioCache);
    }
    const [profile, projects, skills, experiences, testimonials] = await Promise.all([
      Profile.findOne(),
      Project.find().sort({ order: 1, createdAt: -1 }),
      Skill.find().sort({ order: 1 }),
      Experience.find().sort({ order: 1 }),
      Testimonial.find().sort({ order: 1 }),
    ]);
    portfolioCache = { profile, projects, skills, experiences, testimonials };
    portfolioCacheAt = Date.now();
    res.set('Cache-Control', 'public, max-age=60');
    res.json(portfolioCache);
  } catch (err) {
    next(err);
  }
});

// GET /api/public/projects/:slug
router.get('/projects/:slug', async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST /api/public/contact
// "website" is a honeypot field — bots fill it, humans don't. If it's set,
// we pretend everything went fine but quietly drop the message.
router.post(
  '/contact',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('subject').optional().trim().isLength({ max: 120 }).withMessage('Subject is too long'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.body.website) {
        return res.status(201).json({ message: 'Message received' }); // honeypot tripped
      }

      const { name, email, subject, message, conversationId } = req.body;
      // Each visitor gets their own conversation. Reuse the ID if they already have one.
      const cid = conversationId || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const doc = await Message.create({ conversationId: cid, sender: 'visitor', name, email, subject, message });
      res.status(201).json({ message: 'Message received', conversationId: doc.conversationId });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/public/conversation/:conversationId — visitor reads their own thread.
router.get('/conversation/:conversationId', async (req, res, next) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 })
      .select('sender name message createdAt');
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.clearPortfolioCache = () => {
  portfolioCache = null;
  portfolioCacheAt = 0;
};
