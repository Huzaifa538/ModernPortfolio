const mongoose = require('mongoose');

// There is exactly ONE profile document — the site owner's public info.
const profileSchema = new mongoose.Schema(
  {
    fullName: String,
    heroTitle: String,
    heroSubtitle: String,
    roles: [String],
    bio: String,
    aboutText: String,
    avatarUrl: String,
    resumeUrl: String,
    email: String,
    phone: String,
    location: String,
    githubUrl: String,
    linkedinUrl: String,
    twitterUrl: String,
    availableForWork: { type: Boolean, default: true },
    yearsExperience: Number,
    projectsCompleted: Number,
    happyClients: Number,
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
