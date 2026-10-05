import { useState } from 'react'
import { ExternalLink, Github } from 'lucide-react'
import clsx from 'clsx'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { resolveAssetUrl } from '../../lib/api'
import type { Project } from '../../lib/types'

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const gallery = project ? [project.imageUrl, ...project.gallery].filter(Boolean) as string[] : []
  const [activeImage, setActiveImage] = useState(0)

  const handleClose = () => {
    setActiveImage(0)
    onClose()
  }

  return (
    <Modal open={Boolean(project)} onClose={handleClose} title={project?.title} wide>
      {project && (
        <div>
          {/* Gallery */}
          {gallery.length > 0 && (
            <div>
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <img
                  src={resolveAssetUrl(gallery[Math.min(activeImage, gallery.length - 1)])}
                  alt={project.title}
                  className="aspect-video w-full object-cover"
                />
              </div>
              {gallery.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      onClick={() => setActiveImage(i)}
                      aria-label={`View image ${i + 1}`}
                      className={clsx(
                        'h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                        i === activeImage
                          ? 'border-[#8b5cf6]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <img src={resolveAssetUrl(img)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{project.category}</Badge>
            {project.featured && <Badge tone="success">Featured</Badge>}
          </div>

          <p className="mt-4 leading-relaxed text-[var(--muted)]">
            {project.longDescription || project.description || 'No description added yet.'}
          </p>

          {project.techStack.length > 0 && (
            <div className="mt-5">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Tech stack</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <Badge key={tech}>{tech}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
              >
                <ExternalLink className="h-4 w-4" />
                Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--glass)] px-5 py-2.5 text-sm font-semibold transition hover:border-[#8b5cf6]/60 hover:text-[#8b5cf6]"
              >
                <Github className="h-4 w-4" />
                Source Code
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
