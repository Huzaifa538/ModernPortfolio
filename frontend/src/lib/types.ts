// Shapes mirrored from the backend Mongoose models + API contract.
// The API is the source of truth; components render whatever comes back.

export interface Profile {
  _id: string
  fullName?: string
  heroTitle?: string
  heroSubtitle?: string
  roles: string[]
  bio?: string
  aboutText?: string
  avatarUrl?: string
  resumeUrl?: string
  email?: string
  phone?: string
  location?: string
  githubUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  availableForWork: boolean
  yearsExperience?: number
  projectsCompleted?: number
  happyClients?: number
  seoTitle?: string
  seoDescription?: string
}

export interface Project {
  _id: string
  title: string
  slug: string
  description?: string
  longDescription?: string
  imageUrl?: string
  gallery: string[]
  techStack: string[]
  category: string
  liveUrl?: string
  githubUrl?: string
  featured: boolean
  order: number
}

export interface Skill {
  _id: string
  name: string
  category: 'Frontend' | 'Backend' | 'Database' | 'Tools' | 'Other'
  level: number
  iconUrl?: string
  order: number
}

export interface Experience {
  _id: string
  company: string
  role: string
  startDate?: string
  endDate?: string
  current: boolean
  description?: string
  order: number
}

export interface Testimonial {
  _id: string
  name: string
  role?: string
  company?: string
  quote: string
  avatarUrl?: string
  order: number
}

export interface Message {
  _id: string
  name: string
  email: string
  subject?: string
  message: string
  isRead: boolean
  isStarred: boolean
  createdAt: string
}

export interface PortfolioData {
  profile: Profile | null
  projects: Project[]
  skills: Skill[]
  experiences: Experience[]
  testimonials: Testimonial[]
}

export interface Stats {
  totalProjects: number
  totalSkills: number
  totalMessages: number
  unreadMessages: number
  recentMessages: Message[]
}

export interface AuthCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  username: string
}

export interface MeResponse {
  id: string
  username: string
}

export interface ContactPayload {
  name: string
  email: string
  subject?: string
  message: string
  /** Honeypot — bots fill it, humans don't. */
  website?: string
}

export type AdminResource = 'projects' | 'skills' | 'experiences' | 'testimonials'

export interface MessageFilters {
  unread?: boolean
  starred?: boolean
  search?: string
}
