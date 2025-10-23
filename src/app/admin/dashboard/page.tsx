'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { JobCardAdmin } from '@/components/admin/JobCardAdmin'
import { CreateJobModal } from '@/components/modals/CreateJobModal'
import { getJobs, updateJobStatus, deleteJob, type Job } from '@/lib/supabase/jobs'
import { toast } from 'react-hot-toast'

// Transform job data for admin display
const transformJobForAdmin = (job: any) => ({
  id: job.id,
  title: job.job_title || job.title,
  status: job.status,
  startDate: new Date(job.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }),
  salaryRange: {
    min: job.min_salary || job.salary_min,
    max: job.max_salary || job.salary_max
  }
})

export default function AdminDashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'recent'>('all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  const handleJobEdit = (job: Job) => {
    // You can implement edit modal here later
    toast.info('Edit job functionality coming soon')
  }

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

      // Update local state
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

      // Remove from local state
      setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId))
      toast.success('Job deleted successfully')
    } catch (error) {
      toast.error('An error occurred while deleting the job')
    }
  }

  const handleCreateJob = () => {
    setIsCreateModalOpen(true)
  }

  const handleJobCreated = () => {
    loadJobs() // Refresh the job list
  }

  const transformedJobs = jobs.map(transformJobForAdmin)

  const filteredJobs = transformedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === 'active') {
      return matchesSearch && job.status === 'active'
    }
    if (activeFilter === 'recent') {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const jobDate = new Date(job.startDate)
      return matchesSearch && jobDate >= weekAgo
    }

    return matchesSearch
  })

  return (
    <div className="px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job List</h1>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by job details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={activeFilter === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === 'active' ? 'all' : 'active')}
              >
                Active
              </Button>
              <Button
                variant={activeFilter === 'recent' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(activeFilter === 'recent' ? 'all' : 'recent')}
              >
                started on 1 Oct 2025
              </Button>
            </div>
          </div>

          {/* Job List */}
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <JobCardAdmin
                  key={job.id}
                  job={job}
                  onManage={handleJobManage}
                  onEdit={handleJobEdit}
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Recruit the best candidates</h2>
              <p className="text-gray-300 text-sm">
                Create jobs, invite, and hire with ease
              </p>
            </div>

            <Button
              onClick={handleCreateJob}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create a new job
            </Button>
          </Card>

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

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onJobCreated={handleJobCreated}
      />
    </div>
  )
}