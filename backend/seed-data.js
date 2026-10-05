// Shared seed data — Huzaifa Adam's real portfolio content.
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
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await User.create({ username: process.env.ADMIN_USERNAME || 'admin', password: hashed });
  console.log(`👤 Admin user created: ${process.env.ADMIN_USERNAME || 'admin'}`);

  // --- Profile — Huzaifa Adam (Facebook + LinkedIn details) ---
  await Profile.create({
    fullName: 'Huzaifa Adam',
    heroTitle: "Hi, I'm Huzaifa Adam",
    heroSubtitle: 'I build modern web experiences that people love.',
    roles: ['Front-End Developer', 'Digital Marketer', 'Video Editor'],
    bio: "I'm a front-end developer from Karachi, Pakistan. I build fast, modern websites with React and JavaScript, grow brands with digital marketing, and bring stories to life with video editing.",
    aboutText:
      "I turn ideas into polished digital products — from responsive websites and e-commerce stores to engaging video content. My toolkit spans HTML, CSS, JavaScript, TypeScript, React and Node.js, plus digital marketing and video editing. I care about clean code, honest design and shipping work that actually performs.",
    avatarUrl: '',
    resumeUrl: '',
    email: 'huzaifaadam321@gmail.com',
    phone: '+92 326 2364378',
    location: 'Karachi, Pakistan',
    githubUrl: 'https://github.com/Huzaifa538',
    linkedinUrl: 'https://www.linkedin.com/in/huzaifawebdev/',
    twitterUrl: '',
    availableForWork: true,
    yearsExperience: 3,
    projectsCompleted: 12,
    happyClients: 8,
    seoTitle: 'Huzaifa Adam — Front-End Developer',
    seoDescription: 'Portfolio of Huzaifa Adam, a front-end developer from Karachi building modern web experiences.',
  });
  console.log('📝 Profile created');

  // --- Projects — from GitHub (Huzaifa538) ---
  await Project.create([
    {
      title: 'Live Chat',
      slug: 'live-chat',
      description: 'Real-time chat app with Google sign-in, live messaging and typing indicator.',
      longDescription:
        'A real-time chat application built with Firebase Firestore. Features Google sign-in, instant messaging, a live typing indicator and a modern dark UI. Deployed on Vercel with automatic deployments from GitHub.',
      imageUrl: 'https://picsum.photos/seed/livechat-huzaifa/1200/800',
      gallery: [],
      techStack: ['JavaScript', 'Firebase', 'Firestore', 'Vercel'],
      category: 'Web',
      liveUrl: 'https://huzaifa-live-chat-psi.vercel.app/',
      githubUrl: 'https://github.com/Huzaifa538/Live-Chat',
      featured: true,
      order: 0,
    },
    {
      title: 'HTC E-commerce Website',
      slug: 'htc-ecommerce',
      description: 'Complete hardware e-commerce store with 111 products, admin panel and order management.',
      longDescription:
        'A full e-commerce website for Hammer Trading Company. 111 hardware products, shopping cart, checkout, order tracking, and a complete admin panel with sales reports, inventory and customer management. Built with Next.js and Firebase.',
      imageUrl: 'https://picsum.photos/seed/htc-huzaifa/1200/800',
      gallery: [],
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Firebase'],
      category: 'Web',
      liveUrl: 'https://htc-website-two.vercel.app',
      githubUrl: 'https://github.com/Huzaifa538',
      featured: true,
      order: 1,
    },
    {
      title: 'SK Wood Works Platform',
      slug: 'sk-wood-works',
      description: 'Business management platform with admin panel, orders and digital khata.',
      longDescription:
        'A complete business platform for SK Wood Works — premium public website plus admin panel with customer management, orders, digital khata, quotations and reporting. Built with Next.js and PostgreSQL.',
      imageUrl: 'https://picsum.photos/seed/skwood-huzaifa/1200/800',
      gallery: [],
      techStack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
      category: 'Web',
      liveUrl: 'https://sk-wood-works-six.vercel.app',
      githubUrl: 'https://github.com/Huzaifa538',
      featured: false,
      order: 2,
    },
    {
      title: 'My Portfolio',
      slug: 'my-portfolio',
      description: 'Personal portfolio website — fully responsive.',
      longDescription:
        'My personal portfolio website showcasing my work as a front-end developer. Fully responsive with a modern design.',
      imageUrl: 'https://picsum.photos/seed/portfolio-huzaifa/1200/800',
      gallery: [],
      techStack: ['HTML', 'CSS', 'JavaScript'],
      category: 'Web',
      liveUrl: 'https://huzaifa-myportfolio.vercel.app',
      githubUrl: 'https://github.com/Huzaifa538/My-Portfolio',
      featured: false,
      order: 3,
    },
  ]);
  console.log('💼 4 projects created (2 featured)');

  // --- Skills — from LinkedIn + Facebook ---
  await Skill.create([
    { name: 'HTML', category: 'Frontend', level: 95, order: 0 },
    { name: 'CSS', category: 'Frontend', level: 95, order: 1 },
    { name: 'JavaScript', category: 'Frontend', level: 92, order: 2 },
    { name: 'React', category: 'Frontend', level: 90, order: 3 },
    { name: 'TypeScript', category: 'Frontend', level: 85, order: 4 },
    { name: 'Tailwind CSS', category: 'Frontend', level: 90, order: 5 },
    { name: 'Bootstrap', category: 'Frontend', level: 85, order: 6 },
    { name: 'Node.js', category: 'Backend', level: 85, order: 7 },
    { name: 'Express', category: 'Backend', level: 82, order: 8 },
    { name: 'MongoDB', category: 'Database', level: 80, order: 9 },
    { name: 'Python', category: 'Backend', level: 78, order: 10 },
    { name: 'Digital Marketing', category: 'Other', level: 85, order: 11 },
    { name: 'Video Editing', category: 'Other', level: 82, order: 12 },
    { name: 'Git & GitHub', category: 'Tools', level: 90, order: 13 },
  ]);
  console.log('🛠️  14 skills created');

  // --- Experience ---
  await Experience.create([
    {
      company: 'Self-Employed',
      role: 'Freelance Front-End Developer',
      startDate: 'Jan 2023',
      endDate: '',
      current: true,
      description:
        'Building websites, e-commerce stores and web apps for clients. Recent work includes a real-time chat app, a 111-product hardware e-commerce site and a business management platform — all designed, built and deployed end to end.',
      order: 0,
    },
    {
      company: 'Freelance',
      role: 'Digital Marketer & Video Editor',
      startDate: 'Jun 2022',
      endDate: 'Dec 2022',
      current: false,
      description:
        'Grew brands with social media marketing and created engaging video content. Edited promotional videos and product reels for businesses.',
      order: 1,
    },
  ]);
  console.log('🏢 2 experiences created');

  // No fake testimonials — the section stays empty until real ones are added.
  console.log('💬 Testimonials skipped (no fake quotes)');
}

module.exports = seedData;
