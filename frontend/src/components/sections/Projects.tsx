import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, FolderKanban, Github, Star } from 'lucide-react'
import clsx from 'clsx'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionFlip } from '../ui/SectionFlip'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { TiltCard } from '../ui/TiltCard'
import { ProjectModal } from './ProjectModal'
import { resolveAssetUrl } from '../../lib/api'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { Project } from '../../lib/types'

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  const reduceMotion = useReducedMotion()
  const image = resolveAssetUrl(project.imageUrl)

  return (
    <motion.div
      layout
      style={{ transformPerspective: 900 }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 44, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, rotateX: -8 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
    >
      <TiltCard
        maxTilt={10}
        wrapperClassName="h-full"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        aria-label={`Open details for ${project.title}`}
        className="glass group h-full cursor-pointer overflow-hidden rounded-2xl transition-[box-shadow,border-color] duration-300 hover:border-[#8b5cf6]/40 hover:shadow-[0_24px_60px_-20px_rgba(99,102,241,0.35)]"
      >
        {/* Cover image */}
        <div className="relative aspect-video overflow-hidden bg-[var(--surface2)]">
          {image ? (
            <img
              src={image}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FolderKanban className="h-12 w-12 text-[var(--muted)] opacity-40" />
            </div>
          )}
          {project.featured && (
            <span className="absolute left-3 top-3">
              <Badge tone="brand">
                <Star className="h-3 w-3" />
                Featured
              </Badge>
            </span>
          )}

          {/* Hover overlay with quick actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Open live demo"
                className="rounded-full bg-white/15 p-3.5 text-white backdrop-blur transition hover:scale-110 hover:bg-white/25"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Open source code"
                className="rounded-full bg-white/15 p-3.5 text-white backdrop-blur transition hover:scale-110 hover:bg-white/25"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
              {project.category}
            </span>
          </div>
          <h3 className="font-display mt-1.5 text-lg font-bold leading-snug">{project.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
            {project.description ?? 'No description added yet.'}
          </p>
          {project.techStack.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.techStack.slice(0, 4).map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
              {project.techStack.length > 4 && (
                <Badge>+{project.techStack.length - 4}</Badge>
              )}
            </div>
          )}
        </div>
      </TiltCard>
    </motion.div>
  )
}

interface ProjectsProps {
  projects: Project[]
  loading: boolean
}

export function Projects({ projects, loading }: ProjectsProps) {
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Project | null>(null)
  const reduceMotion = useReducedMotion()

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects]
  )

  const visible = useMemo(
    () => (category === 'All' ? projects : projects.filter((p) => p.category === category)),
    [projects, category]
  )

  return (
    <section id="projects" className="relative py-24 sm:py-32 bg-[var(--bg-soft)]">
      <SectionFlip flip="up">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          label="projects"
          title="Things I've built"
          subtitle="A selection of projects I'm proud of — click any card for the full story."
        />

        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={clsx(
                'rounded-full px-5 py-2 text-sm font-medium transition-[box-shadow,border-color,background-color,color] duration-300',
                category === cat
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md shadow-indigo-500/30'
                  : 'border border-[var(--border)] bg-[var(--glass)] text-[var(--muted)] hover:border-[#8b5cf6]/40 hover:text-[var(--text)]'
              )}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="text-center text-[var(--muted)]">
              <FolderKanban className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No projects yet — check back soon.</p>
            </Card>
          ) : (
            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode={reduceMotion ? 'sync' : 'popLayout'}>
                {visible.map((project, i) => (
                  <ProjectCard key={project._id} project={project} index={i} onOpen={() => setSelected(project)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      </SectionFlip>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
