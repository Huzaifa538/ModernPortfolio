// Shared seed data — creates the admin user + demo portfolio content.
// Uses the CURRENT mongoose connection (no connect/disconnect here),
// so both `npm run seed` and the server's auto-seed can use it.
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Profile = require('./models/Profile');
const Project = require('./models/Project');
const Skill = require('./models/Skill');
const Experience = require('./models/Experience');
const Testimonial = require('./models/Testimonial');
const Message = require('./models/Message');

async function seedData() {
// Start from a clean slate — makes the script safe to re-run.
await Promise.all([
  User.deleteMany({}),
  Profile.deleteMany({}),
  Project.deleteMany({}),
  Skill.deleteMany({}),
  Experience.deleteMany({}),
  Testimonial.deleteMany({}),
  Message.deleteMany({}),
]);
console.log('🧹 Cleared existing data');

// --- Admin user ---
const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'change-me-in-prod-123', 10);
await User.create({ username: process.env.ADMIN_USERNAME || 'admin', password: hashed });
console.log(`👤 Admin user created: ${process.env.ADMIN_USERNAME || 'admin'}`);

// --- Profile ---
await Profile.create({
  fullName: 'Alex Carter',
  heroTitle: "Hi, I'm Alex Carter",
  heroSubtitle: 'I build fast, friendly web apps that people actually enjoy using.',
  roles: ['Full-Stack Developer', 'UI Engineer', 'Open Source Contributor'],
  bio: "I'm a full-stack developer with 6 years of experience turning rough ideas into polished products. I care about clean code, honest UX and shipping things that hold up in the real world.",
  aboutText:
    'For the past 6 years I\'ve been building web applications for startups and agencies — everything from landing pages to full dashboards. My sweet spot is the MERN stack: React up front, Node behind it, Mongo where it fits. When I\'m not shipping, I\'m contributing to open source or writing about what I learned.',
  avatarUrl: 'https://i.pravatar.cc/400?img=12',
  resumeUrl: '',
  email: 'hello@alexcarter.dev',
  phone: '+1 (555) 010-2030',
  location: 'Austin, TX',
  githubUrl: 'https://github.com',
  linkedinUrl: 'https://linkedin.com',
  twitterUrl: 'https://x.com',
  availableForWork: true,
  yearsExperience: 6,
  projectsCompleted: 48,
  happyClients: 21,
  seoTitle: 'Alex Carter — Full-Stack Developer',
  seoDescription: 'Portfolio of Alex Carter, a full-stack developer building modern web applications.',
});
console.log('📝 Profile created');

// --- Projects ---
await Project.create([
  {
    title: 'Pulseboard Analytics',
    slug: 'pulseboard-analytics',
    description: 'Real-time analytics dashboard with live charts and custom reports.',
    longDescription:
      'Pulseboard is a SaaS analytics dashboard built for a marketing startup. It streams events over WebSockets, aggregates them in MongoDB and renders live charts with zero refresh. Includes role-based access, PDF report exports and a custom query builder for non-technical users.',
    imageUrl: 'https://picsum.photos/seed/pulseboard/1200/800',
    gallery: ['https://picsum.photos/seed/pulseboard-2/1200/800', 'https://picsum.photos/seed/pulseboard-3/1200/800'],
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io', 'Tailwind CSS'],
    category: 'Web',
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com',
    featured: true,
    order: 0,
  },
  {
    title: 'Nomad Gear Store',
    slug: 'nomad-gear-store',
    description: 'Headless e-commerce storefront for an outdoor gear brand.',
    longDescription:
      'A headless storefront with a custom cart, Stripe checkout and an admin panel for inventory. Server-side rendered product pages pushed the Lighthouse performance score from 62 to 98, and the checkout conversion rate went up 18% after launch.',
    imageUrl: 'https://picsum.photos/seed/nomadgear/1200/800',
    gallery: ['https://picsum.photos/seed/nomadgear-2/1200/800'],
    techStack: ['Next.js', 'TypeScript', 'Stripe', 'Sanity CMS'],
    category: 'Web',
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com',
    featured: false,
    order: 1,
  },
  {
    title: 'Habitloop Mobile',
    slug: 'habitloop-mobile',
    description: 'Cross-platform habit tracker with streaks, reminders and social challenges.',
    longDescription:
      'Habitloop is a React Native app that helps people stick to habits with streaks, smart reminders and friend challenges. Offline-first with a local SQLite store that syncs when the network is back. Hit 25k downloads in its first year on both stores.',
    imageUrl: 'https://picsum.photos/seed/habitloop/1200/800',
    gallery: [],
    techStack: ['React Native', 'Expo', 'Firebase', 'SQLite'],
    category: 'Mobile',
    liveUrl: 'https://example.com',
    githubUrl: 'https://github.com',
    featured: false,
    order: 2,
  },
]);
console.log('💼 3 projects created (1 featured)');

// --- Skills ---
await Skill.create([
  { name: 'React', category: 'Frontend', level: 95, order: 0 },
  { name: 'JavaScript', category: 'Frontend', level: 95, order: 1 },
  { name: 'TypeScript', category: 'Frontend', level: 88, order: 2 },
  { name: 'Tailwind CSS', category: 'Frontend', level: 92, order: 3 },
  { name: 'Node.js', category: 'Backend', level: 90, order: 4 },
  { name: 'Express', category: 'Backend', level: 90, order: 5 },
  { name: 'REST APIs', category: 'Backend', level: 93, order: 6 },
  { name: 'MongoDB', category: 'Database', level: 85, order: 7 },
  { name: 'PostgreSQL', category: 'Database', level: 78, order: 8 },
  { name: 'Redis', category: 'Database', level: 70, order: 9 },
  { name: 'Git & GitHub', category: 'Tools', level: 92, order: 10 },
  { name: 'Docker', category: 'Tools', level: 75, order: 11 },
]);
console.log('🛠️  12 skills created');

// --- Experience ---
await Experience.create([
  {
    company: 'Northwind Labs',
    role: 'Senior Full-Stack Developer',
    startDate: 'Jan 2022',
    endDate: '',
    current: true,
    description:
      'Leading a team of 4 on the company\'s analytics platform. Rebuilt the reporting pipeline, cutting report generation time by 70%. Own the frontend architecture and mentor junior developers.',
    order: 0,
  },
  {
    company: 'Pixelforge Studio',
    role: 'Frontend Developer',
    startDate: 'Jun 2019',
    endDate: 'Dec 2021',
    current: false,
    description:
      'Built marketing sites and web apps for agency clients. Shipped 15+ projects, introduced a shared component library that cut build time on new sites nearly in half.',
    order: 1,
  },
]);
console.log('🏢 2 experiences created');

// --- Testimonials ---
await Testimonial.create([
  {
    name: 'Sarah Mitchell',
    role: 'Product Manager',
    company: 'Northwind Labs',
    quote:
      'Alex is the rare developer who thinks like a product person. He pushed back on features that didn\'t serve users and shipped the ones that did — faster than anyone expected.',
    avatarUrl: 'https://i.pravatar.cc/200?img=47',
    order: 0,
  },
  {
    name: 'David Okafor',
    role: 'Founder',
    company: 'Nomad Gear',
    quote:
      'Our store went from a clunky template to something we\'re genuinely proud of. Conversion is up, support tickets are down, and Alex made the whole process painless.',
    avatarUrl: 'https://i.pravatar.cc/200?img=59',
    order: 1,
  },
]);
console.log('💬 2 testimonials created');
}

module.exports = seedData;
