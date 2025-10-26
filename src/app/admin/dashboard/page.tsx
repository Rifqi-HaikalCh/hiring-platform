'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Briefcase, TrendingUp, Clock, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { JobCardAdmin } from '@/components/admin/JobCardAdmin'
import { JobFormModal } from '@/components/modals/JobFormModal'
import { Footer } from '@/components/layout/Footer'
import { getJobs, updateJobStatus, deleteJob, type Job } from '@/lib/supabase/jobs'
import { toast } from 'react-hot-toast'
import { gsap } from 'gsap'

const transformJobForAdmin = (job: any): {
  id: string
  title: string
  status: 'active' | 'inactive' | 'draft'
  startDate: string
  salaryRange: { min: number; max: number }
  jobType?: string
  companyName?: string
  companyLogo?: string
  location?: string
  department?: string
} => ({
  id: job.id,
  title: job.job_title || job.title,
  status: job.status,
  startDate: new Date(job.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }),
  salaryRange: {
    min: job.min_salary || job.salary_min || 0,
    max: job.max_salary || job.salary_max || 0
  },
  ...(job.job_type && { jobType: job.job_type }),
  ...(job.company_name && { companyName: job.company_name }),
  ...((job.company || job.company_name === undefined) && job.company && { companyName: job.company }),
  ...(job.company_logo_url && { companyLogo: job.company_logo_url }),
  ...(job.location && { location: job.location }),
  ...(job.department && { department: job.department })
})

// Create Job Card dengan Magic Bento Effects
function CreateJobCard({ onClick }: { onClick: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const isHoveredRef = useRef(false)

  useEffect(() => {
    if (!cardRef.current) return

    const card = cardRef.current

    const handleMouseEnter = () => {
      isHoveredRef.current = true

      // Create particles
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!isHoveredRef.current || !cardRef.current) return

          const particle = document.createElement('div')
          particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none'
          particle.style.cssText = `
            background: rgba(20, 184, 166, 0.8);
            box-shadow: 0 0 6px rgba(20, 184, 166, 0.6);
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            z-index: 10;
          `

          cardRef.current!.appendChild(particle)
          particlesRef.current.push(particle)

          gsap.fromTo(particle,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
          )

          gsap.to(particle, {
            x: (Math.random() - 0.5) * 80,
            y: (Math.random() - 0.5) * 80,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: 'none',
            repeat: -1,
            yoyo: true
          })

          gsap.to(particle, {
            opacity: 0.3,
            duration: 1.5,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true
          })
        }, i * 100)
      }
    }

    const handleMouseLeave = () => {
      isHoveredRef.current = false

      particlesRef.current.forEach(particle => {
        gsap.to(particle, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'back.in(1.7)',
          onComplete: () => particle.remove()
        })
      })
      particlesRef.current = []

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Tilt effect
      const rotateX = ((y - centerY) / centerY) * -8
      const rotateY = ((x - centerX) / centerX) * 8

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.1,
        ease: 'power2.out'
      })

      // Magnetism
      const magnetX = (x - centerX) * 0.03
      const magnetY = (y - centerY) * 0.03

      gsap.to(card, {
        x: magnetX,
        y: magnetY,
        duration: 0.3,
        ease: 'power2.out'
      })

      // Border glow
      const relativeX = (x / rect.width) * 100
      const relativeY = (y / rect.height) * 100
      card.style.setProperty('--glow-x', `${relativeX}%`)
      card.style.setProperty('--glow-y', `${relativeY}%`)
    }

    const handleClick = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )

      const ripple = document.createElement('div')
      ripple.className = 'absolute rounded-full pointer-events-none'
      ripple.style.cssText = `
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        background: radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, rgba(20, 184, 166, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        z-index: 1000;
      `

      card.appendChild(ripple)

      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      )
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)
    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('click', handleClick)

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div ref={cardRef} className="relative magic-bento-card" style={{
      '--glow-x': '50%',
      '--glow-y': '50%'
    } as React.CSSProperties}>
      <Card className="relative bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 overflow-hidden border border-gray-700 hover:border-teal-400 cursor-pointer transition-all">
        {/* Border glow effect */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none border-glow-effect"
          style={{
            background: `radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgba(20, 184, 166, 0.2), transparent 60%)`,
            opacity: 0
          }}
        />

        <div className="relative z-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Recruit the best candidates</h2>
            <p className="text-gray-300 text-sm">
              Create jobs, invite, and hire with ease
            </p>
          </div>

          <Button
            onClick={onClick}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white transition-all duration-300 hover:scale-105"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create a new job
          </Button>
        </div>
      </Card>

      <style jsx>{`
        .magic-bento-card:hover .border-glow-effect {
          opacity: 1 !important;
          transition: opacity 0.3s ease;
        }
      `}</style>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'draft' | 'recent'>('all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReturnType<typeof transformJobForAdmin>; direction: 'ascending' | 'descending' } | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const { data, error } = await getJobs()

      if (error) {
        toast.error('Failed to load jobs')
        console.error('Load jobs error:', error)
        return
      }

      setJobs(data || [])
    } catch (error) {
      toast.error('Failed to load jobs')
      console.error('Load jobs error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobManage = (jobId: string) => {
    router.push(`/admin/jobs/${jobId}/manage`)
  }

  const handleOpenJobFormModal = (job: Job | null) => {
    setEditingJob(job);
    setIsJobFormModalOpen(true);
  };

  const handleJobSaved = (savedJob: Job) => {
    if (editingJob) {
      setJobs(prevJobs => prevJobs.map(j => j.id === savedJob.id ? savedJob : j));
    } else {
      loadJobs();
    }
    setIsJobFormModalOpen(false);
    setEditingJob(null);
  };

  const handleJobToggleStatus = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    const newStatus = job.status === 'active' ? 'inactive' : 'active'

    try {
      const { data, error } = await updateJobStatus(jobId, newStatus)
      if (error) {
        toast.error('Failed to update job status')
        return
      }

      setJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === jobId ? { ...j, status: newStatus } : j
        )
      )

      toast.success(`Job ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('An error occurred while updating job status')
    }
  }

  const handleJobDelete = async (jobId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this job? This action cannot be undone.')
    if (!confirmed) return

    try {
      const { error } = await deleteJob(jobId)
      if (error) {
        toast.error('Failed to delete job')
        return
      }

      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId))
      toast.success('Job deleted successfully')
    } catch (error) {
      toast.error('An error occurred while deleting the job')
    }
  }

  const transformedJobs = jobs.map(transformJobForAdmin)

  const filteredJobs = transformedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === 'active') {
      return matchesSearch && job.status === 'active'
    }
    if (activeFilter === 'inactive') {
      return matchesSearch && job.status === 'inactive'
    }
    if (activeFilter === 'draft') {
      return matchesSearch && job.status === 'draft'
    }
    if (activeFilter === 'recent') {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const jobDate = new Date(job.startDate)
      return matchesSearch && jobDate >= weekAgo
    }

    return matchesSearch
  })

  const sortedJobs = useMemo(() => {
    let sortableJobs = [...filteredJobs]
    if (sortConfig !== null) {
      sortableJobs.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        // Handle nested salaryRange object
        if (sortConfig.key === 'salaryRange') {
          const aSalary = (a.salaryRange?.min || 0) + (a.salaryRange?.max || 0)
          const bSalary = (b.salaryRange?.min || 0) + (b.salaryRange?.max || 0)
          return sortConfig.direction === 'ascending' ? aSalary - bSalary : bSalary - aSalary
        }

        // Handle undefined/null values
        if (aValue === undefined || aValue === null) return 1
        if (bValue === undefined || bValue === null) return -1

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableJobs
  }, [filteredJobs, sortConfig])

  const handleSort = (key: keyof ReturnType<typeof transformJobForAdmin>) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job List</h1>

            {/* Search Bar */}
            <div className="relative mb-4 group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-teal-600" />
              <Input
                type="text"
                placeholder="Search by job details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Button
                variant={activeFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="transition-all duration-300 hover:scale-105"
              >
                All Jobs
              </Button>
              <Button
                variant={activeFilter === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('active')}
                className="transition-all duration-300 hover:scale-105"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Active
              </Button>
              <Button
                variant={activeFilter === 'inactive' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('inactive')}
                className="transition-all duration-300 hover:scale-105"
              >
                Inactive
              </Button>
              <Button
                variant={activeFilter === 'draft' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('draft')}
                className="transition-all duration-300 hover:scale-105"
              >
                Draft
              </Button>
              <Button
                variant={activeFilter === 'recent' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('recent')}
                className="transition-all duration-300 hover:scale-105"
              >
                <Clock className="h-4 w-4 mr-1" />
                Recent
              </Button>

              {/* Sorting */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="flex gap-1">
                  <Button
                    variant={sortConfig?.key === 'title' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('title')}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    Title
                    {sortConfig?.key === 'title' && (
                      sortConfig.direction === 'ascending'
                        ? <ArrowUp className="h-3 w-3 ml-1" />
                        : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant={sortConfig?.key === 'startDate' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('startDate')}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    Date
                    {sortConfig?.key === 'startDate' && (
                      sortConfig.direction === 'ascending'
                        ? <ArrowUp className="h-3 w-3 ml-1" />
                        : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant={sortConfig?.key === 'salaryRange' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('salaryRange')}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    Salary
                    {sortConfig?.key === 'salaryRange' && (
                      sortConfig.direction === 'ascending'
                        ? <ArrowUp className="h-3 w-3 ml-1" />
                        : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                  {sortConfig && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortConfig(null)}
                      className="transition-all duration-300 hover:scale-105"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedJobs.length > 0 ? (
                sortedJobs.map((job) => (
                  <JobCardAdmin
                    key={job.id}
                    job={job}
                    onManage={handleJobManage}
                    onEdit={() => handleOpenJobFormModal(jobs.find(j => j.id === job.id) || null)}
                    onToggleStatus={handleJobToggleStatus}
                    onDelete={handleJobDelete}
                  />
                ))
              ) : (
                <EmptyState
                  title="No jobs found"
                  description="No jobs match your current filters."
                />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <CreateJobCard onClick={() => handleOpenJobFormModal(null)} />

          {/* Additional stats card */}
          <Card className="mt-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Jobs</span>
                <span className="font-semibold">{jobs.filter(j => j.status === 'active').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Draft Jobs</span>
                <span className="font-semibold">{jobs.filter(j => j.status === 'draft').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Jobs</span>
                <span className="font-semibold">{jobs.length}</span>
              </div>
            </div>
          </Card>
        </div>
        </div>

        <JobFormModal
          isOpen={isJobFormModalOpen}
          onClose={() => {
            setIsJobFormModalOpen(false);
            setEditingJob(null);
          }}
          onJobSave={handleJobSaved}
          jobToEdit={editingJob}
        />
      </div>
      <Footer />
    </div>
  )
}
