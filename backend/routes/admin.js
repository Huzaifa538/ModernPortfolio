const express = require('express');
const { body, param } = require('express-validator');
const Profile = require('../models/Profile');
const Project = require('../models/Project');
const Skill = require('../models/Skill');
const Experience = require('../models/Experience');
const Testimonial = require('../models/Testimonial');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { clearPortfolioCache } = require('./public');

const router = express.Router();

// Everything in this file needs a valid admin token.
router.use(auth);

// Any admin change (profile, projects, skills…) invalidates the cached
// public portfolio response so visitors see fresh data within seconds.
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      clearPortfolioCache();
      return originalJson(body);
    };
  }
  next();
});

// Tiny helper: "My Cool App!" -> "my-cool-app"
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- Profile (single document, upsert) ---
router.put('/profile', async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// --- Projects ---
router.get('/projects', async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/projects',
  [body('title').trim().notEmpty().withMessage('Title is required')],
  validate,
  async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (!data.slug) data.slug = slugify(data.title);
      const project = await Project.create(data);
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/projects/:id',
  [param('id').isMongoId().withMessage('Invalid project id')],
  validate,
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/projects/:id', async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete('/projects/:id', async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// --- Skills ---
router.get('/skills', async (req, res, next) => {
  try {
    res.json(await Skill.find().sort({ order: 1 }));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/skills',
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  async (req, res, next) => {
    try {
      const skill = await Skill.create(req.body);
      res.status(201).json(skill);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/skills/:id', async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    next(err);
  }
});

router.delete('/skills/:id', async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    next(err);
  }
});

// --- Experiences ---
router.get('/experiences', async (req, res, next) => {
  try {
    res.json(await Experience.find().sort({ order: 1 }));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/experiences',
  [
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const experience = await Experience.create(req.body);
      res.status(201).json(experience);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/experiences/:id', async (req, res, next) => {
  try {
    const experience = await Experience.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!experience) return res.status(404).json({ error: 'Experience not found' });
    res.json(experience);
  } catch (err) {
    next(err);
  }
});

router.delete('/experiences/:id', async (req, res, next) => {
  try {
    const experience = await Experience.findByIdAndDelete(req.params.id);
    if (!experience) return res.status(404).json({ error: 'Experience not found' });
    res.json({ message: 'Experience deleted' });
  } catch (err) {
    next(err);
  }
});

// --- Testimonials ---
router.get('/testimonials', async (req, res, next) => {
  try {
    res.json(await Testimonial.find().sort({ order: 1 }));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/testimonials',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('quote').trim().notEmpty().withMessage('Quote is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const testimonial = await Testimonial.create(req.body);
      res.status(201).json(testimonial);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/testimonials/:id', async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    res.json(testimonial);
  } catch (err) {
    next(err);
  }
});

router.delete('/testimonials/:id', async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    next(err);
  }
});

// --- Reorder (drag & drop in the admin panel) ---
// PUT /api/admin/reorder/projects  { ids: ["id1", "id2", ...] }
const MODELS = {
  projects: Project,
  skills: Skill,
  experiences: Experience,
  testimonials: Testimonial,
};

router.put(
  '/reorder/:type',
  [
    param('type').isIn(Object.keys(MODELS)).withMessage('Invalid type'),
    body('ids').isArray().withMessage('ids must be an array of ids'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const Model = MODELS[req.params.type];
      await Promise.all(
        req.body.ids.map((id, index) => Model.findByIdAndUpdate(id, { order: index }))
      );
      res.json({ message: 'Order updated' });
    } catch (err) {
      next(err);
    }
  }
);

// --- Conversations (two-way chat: one thread per visitor) ---
// List all conversations with last message + unread count.
router.get('/conversations', async (req, res, next) => {
  try {
    const convs = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$message' },
          lastSender: { $first: '$sender' },
          lastAt: { $first: '$createdAt' },
          name: { $first: '$name' },
          email: { $first: '$email' },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'visitor'] }, { $eq: ['$isRead', false] }] }, 1, 0] },
          },
          totalMessages: { $sum: 1 },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);
    res.json(convs);
  } catch (err) {
    next(err);
  }
});

// Get all messages in one conversation.
router.get('/conversations/:conversationId', async (req, res, next) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 });
    // Mark visitor messages as read when admin opens the thread.
    await Message.updateMany(
      { conversationId: req.params.conversationId, sender: 'visitor', isRead: false },
      { isRead: true }
    );
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Admin replies in a conversation.
router.post(
  '/conversations/:conversationId/reply',
  [body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1–2000 characters')],
  validate,
  async (req, res, next) => {
    try {
      const original = await Message.findOne({ conversationId: req.params.conversationId });
      if (!original) return res.status(404).json({ error: 'Conversation not found' });
      const reply = await Message.create({
        conversationId: req.params.conversationId,
        sender: 'admin',
        name: 'Huzaifa Adam',
        email: original.email,
        message: req.body.message,
        isRead: true,
      });
      res.status(201).json(reply);
    } catch (err) {
      next(err);
    }
  }
);

// --- Messages (legacy inbox — kept for backwards compat) ---
router.get('/messages', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.unread === 'true') filter.isRead = false;
    if (req.query.starred === 'true') filter.isStarred = true;
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
        { message: new RegExp(q, 'i') },
      ];
    }
    const messages = await Message.find(filter).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.patch('/messages/:id/read', async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: !!req.body.isRead },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (err) {
    next(err);
  }
});

router.patch('/messages/:id/star', async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isStarred: !!req.body.isStarred },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (err) {
    next(err);
  }
});

router.delete('/messages/:id', async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
});

// --- Dashboard stats ---
router.get('/stats', async (req, res, next) => {
  try {
    const [totalProjects, totalSkills, totalMessages, unreadMessages, recentMessages] =
      await Promise.all([
        Project.countDocuments(),
        Skill.countDocuments(),
        Message.countDocuments(),
        Message.countDocuments({ isRead: false }),
        Message.find().sort({ createdAt: -1 }).limit(5),
      ]);
    res.json({ totalProjects, totalSkills, totalMessages, unreadMessages, recentMessages });
  } catch (err) {
    next(err);
  }
});

// --- File upload ---
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// --- Change admin password (needs the current one first) ---
router.post(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const bcrypt = require('bcryptjs');
      const User = require('../models/User');

      const user = await User.findById(req.user.id).select('+password');
      if (!user) return res.status(404).json({ error: 'User not found' });

      const ok = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!ok) return res.status(401).json({ error: 'Current password is wrong' });

      user.password = await bcrypt.hash(req.body.newPassword, 10);
      await user.save();
      res.json({ message: 'Password changed' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
