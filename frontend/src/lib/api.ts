import axios, { AxiosError } from 'axios'
import type {
  AdminResource,
  AuthCredentials,
  ChatMessage,
  ContactPayload,
  ConversationSummary,
  Experience,
  LoginResponse,
  MeResponse,
  Message,
  MessageFilters,
  PortfolioData,
  Profile,
  Project,
  Skill,
  Stats,
  Testimonial,
} from './types'

const TOKEN_KEY = 'adminToken'

const apiBase = import.meta.env.VITE_API_URL as string

const instance = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach the admin JWT on every request when present.
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// An expired/invalid token anywhere inside /admin/* kicks back to the login page.
instance.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin/')
    ) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

export const apiUrl = apiBase

/** Turn a stored "/uploads/xyz.png" path into a fully-qualified URL. */
export function resolveAssetUrl(path?: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`
}

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => Boolean(localStorage.getItem(TOKEN_KEY)),
}

const unwrap = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise.then((res) => res.data)

type CrudItem = Project | Skill | Experience | Testimonial

export const api = {
  // --- Public ---------------------------------------------------------------
  getPortfolio: () => unwrap<PortfolioData>(instance.get('/api/public/portfolio')),
  getProject: (slug: string) => unwrap<Project>(instance.get(`/api/public/projects/${slug}`)),
  sendContact: (data: ContactPayload) =>
    unwrap<{ message: string; conversationId?: string }>(
      instance.post('/api/public/contact', data)
    ),
  getConversation: (conversationId: string) =>
    unwrap<ChatMessage[]>(instance.get(`/api/public/conversation/${conversationId}`)),

  // --- Auth -----------------------------------------------------------------
  login: (creds: AuthCredentials) =>
    unwrap<LoginResponse>(instance.post('/api/auth/login', creds)),
  getMe: () => unwrap<MeResponse>(instance.get('/api/auth/me')),

  // --- Admin: profile --------------------------------------------------------
  getProfile: () => unwrap<Profile>(instance.get('/api/admin/profile')),
  updateProfile: (data: Partial<Profile>) =>
    unwrap<Profile>(instance.put('/api/admin/profile', data)),

  // --- Admin: generic CRUD ----------------------------------------------------
  list: <T extends CrudItem>(resource: AdminResource) =>
    unwrap<T[]>(instance.get(`/api/admin/${resource}`)),
  create: <T extends CrudItem>(resource: AdminResource, data: Partial<T>) =>
    unwrap<T>(instance.post(`/api/admin/${resource}`, data)),
  update: <T extends CrudItem>(resource: AdminResource, id: string, data: Partial<T>) =>
    unwrap<T>(instance.put(`/api/admin/${resource}/${id}`, data)),
  remove: (resource: AdminResource, id: string) =>
    unwrap<{ message: string }>(instance.delete(`/api/admin/${resource}/${id}`)),
  reorder: (resource: AdminResource, ids: string[]) =>
    unwrap<{ message: string }>(instance.put(`/api/admin/reorder/${resource}`, { ids })),

  // --- Admin: conversations (two-way chat) --------------------------------------------
  getConversations: () =>
    unwrap<ConversationSummary[]>(instance.get('/api/admin/conversations')),
  getConversationThread: (conversationId: string) =>
    unwrap<ChatMessage[]>(instance.get(`/api/admin/conversations/${conversationId}`)),
  replyConversation: (conversationId: string, message: string) =>
    unwrap<ChatMessage>(
      instance.post(`/api/admin/conversations/${conversationId}/reply`, { message })
    ),

  // --- Admin: messages (legacy flat inbox — kept for backwards compat) ----------------
  getMessages: (filters: MessageFilters = {}) =>
    unwrap<Message[]>(instance.get('/api/admin/messages', { params: filters })),
  setMessageRead: (id: string, isRead: boolean) =>
    unwrap<Message>(instance.patch(`/api/admin/messages/${id}/read`, { isRead })),
  setMessageStarred: (id: string, isStarred: boolean) =>
    unwrap<Message>(instance.patch(`/api/admin/messages/${id}/star`, { isStarred })),
  deleteMessage: (id: string) =>
    unwrap<{ message: string }>(instance.delete(`/api/admin/messages/${id}`)),

  // --- Admin: stats -------------------------------------------------------------
  getStats: () => unwrap<Stats>(instance.get('/api/admin/stats')),

  // --- Admin: password ------------------------------------------------------------
  changePassword: (currentPassword: string, newPassword: string) =>
    unwrap<{ message: string }>(
      instance.post('/api/admin/change-password', { currentPassword, newPassword })
    ),

  // --- Admin: upload -------------------------------------------------------------
  upload: async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await instance.post<{ url: string }>('/api/admin/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
  },
}

export default api
