'use client'

import { useState, useEffect } from 'react'
import { JobCardCandidate } from '@/components/candidate/JobCardCandidate'
import { JobDetails } from '@/components/candidate/JobDetails'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/Card'
import { getJobs, type Job } from '@/lib/supabase/jobs'
import { getUserAppliedJobIds, getUserApplicationStatuses } from '@/lib/supabase/applications'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Search, SlidersHorizontal, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Transform job data for candidate display
const transformJobForCandidate = (job: Job) => {
  // Convert job_description string to array for display
  const descriptionArray = job.job_description
    ? job.job_description.split('\n').filter(line => line.trim() !== '')
    : ['No description available']

  return {
    id: job.id,
    title: job.job_title,
    company: job.company_name || job.company || 'Company Name',
    location: job.location || 'Remote',
    salaryRange: {
      min: job.min_salary || 0,
      max: job.max_salary || 0
    },
    type: job.job_type,
    jobType: job.job_type,
    companyLogo: job.company_logo_url,
    description: descriptionArray
  }
}

export default function CandidateDashboard() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([])
  const [applicationStatuses, setApplicationStatuses] = useState<Record<string, 'submitted' | 'pending' | 'accepted' | 'rejected'>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterJobType, setFilterJobType] = useState<string>('all')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterRecent, setFilterRecent] = useState<boolean>(false)
  const [filterSalaryMin, setFilterSalaryMin] = useState<number>(0)
  const [filterSalaryMax, setFilterSalaryMax] = useState<number>(0)
  const [mobileView, setMobileView] = useState<'list' | 'details'>('list')
  const [isMobile, setIsMobile] = useState(false)
  const { user } = useAuth()

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // Load applied jobs first
        await loadAppliedJobs()
      }
      // Then load all jobs (so appliedJobIds is already populated)
      await loadJobs()
    }
    loadData()
  }, [user])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const { data, error } = await getJobs()

      if (error) {
        toast.error('Failed to load jobs')
        console.error('Load jobs error:', error)
        return
      }

      // Filter jobs: show active jobs OR jobs that user has applied to (even if inactive)
      let visibleJobs = (data || []).filter(job => {
        // Always show active jobs
        if (job.status === 'active') return true

        // Also show inactive jobs if user has applied to them
        if (user && appliedJobIds.includes(job.id)) return true

        return false
      })

      setJobs(visibleJobs)

      // Select first job if available
      if (visibleJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(visibleJobs[0].id)
      }
    } catch (error) {
      toast.error('Failed to load jobs')
      console.error('Load jobs error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAppliedJobs = async () => {
    if (!user) return

    try {
      const [jobIdsResult, statusesResult] = await Promise.all([
        getUserAppliedJobIds(user.id),
        getUserApplicationStatuses(user.id)
      ])

      if (!jobIdsResult.error && jobIdsResult.data) {
        setAppliedJobIds(jobIdsResult.data)
      }

      if (!statusesResult.error && statusesResult.data) {
        setApplicationStatuses(statusesResult.data)
      }
    } catch (error) {
      console.error('Load applied jobs error:', error)
    }
  }

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId)
    // Switch to details view on mobile
    if (isMobile) {
      setMobileView('details')
    }
  }

  const transformedJobs = jobs.map(transformJobForCandidate)

  // Filter logic
  const filteredJobs = transformedJobs.filter(job => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())

    // Job type filter
    const matchesJobType = filterJobType === 'all' || job.jobType === filterJobType

    // Location filter
    const matchesLocation = filterLocation === 'all' || job.location === filterLocation

    // Company filter
    const matchesCompany = filterCompany === 'all' || job.company === filterCompany

    // Recent filter (posted within last 7 days)
    const matchesRecent = !filterRecent || (() => {
      const originalJob = jobs.find(j => j.id === job.id)
      if (!originalJob) return true
      const jobDate = new Date(originalJob.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return jobDate >= weekAgo
    })()

    // Salary filter
    const matchesSalary = (filterSalaryMin === 0 && filterSalaryMax === 0) ||
      (job.salaryRange.min >= filterSalaryMin &&
       (filterSalaryMax === 0 || job.salaryRange.max <= filterSalaryMax))

    return matchesSearch && matchesJobType && matchesLocation && matchesCompany && matchesRecent && matchesSalary
  })

  // Get unique job types, locations, and companies for filters
  const jobTypes = ['all', ...Array.from(new Set(transformedJobs.map(j => j.jobType).filter(Boolean)))]
  const locations = ['all', ...Array.from(new Set(transformedJobs.map(j => j.location).filter(Boolean)))]
  const companies = ['all', ...Array.from(new Set(transformedJobs.map(j => j.company).filter(Boolean)))]

  const selectedJob = filteredJobs.find(job => job.id === selectedJobId) || filteredJobs[0] || null
  const selectedOriginalJob = jobs.find(job => job.id === (selectedJob?.id || selectedJobId)) || null

  // Update selected job when filters change
  useEffect(() => {
    if (filteredJobs.length > 0 && !filteredJobs.find(j => j.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].id)
    }
  }, [searchQuery, filterJobType, filterLocation, filterCompany, filterRecent, filterSalaryMin, filterSalaryMax, filteredJobs])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 h-[calc(100vh-12rem)] bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 gap-6">
        {/* Left Column - Job List */}
        <Card className={cn(
          "w-full lg:w-[40%] bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl overflow-y-auto flex flex-col",
          isMobile && mobileView === 'details' ? 'hidden' : 'flex'
        )}>
          {/* Search and Filter Section */}
          <div className="p-6 border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Listings</h2>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-lg transition-all ${showFilters ? 'bg-teal-50 border-teal-500 text-teal-700' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <div className="flex flex-wrap gap-2">
                    {jobTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterJobType(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          filterJobType === type
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type === 'all' ? 'All Types' : type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="flex flex-wrap gap-2">
                    {locations.slice(0, 6).map(location => (
                      <button
                        key={location}
                        onClick={() => setFilterLocation(location)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          filterLocation === location
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {location === 'all' ? 'All Locations' : location}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <div className="flex flex-wrap gap-2">
                    {companies.slice(0, 6).map(company => (
                      <button
                        key={company}
                        onClick={() => setFilterCompany(company)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          filterCompany === company
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {company === 'all' ? 'All Companies' : company}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recent Jobs (Last 7 Days)</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterRecent(!filterRecent)}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                        filterRecent
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {filterRecent ? 'Showing Recent Only' : 'Show All Jobs'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (IDR)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="number"
                        placeholder="Min salary"
                        value={filterSalaryMin || ''}
                        onChange={(e) => setFilterSalaryMin(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Max salary"
                        value={filterSalaryMax || ''}
                        onChange={(e) => setFilterSalaryMax(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {(filterJobType !== 'all' || filterLocation !== 'all' || filterCompany !== 'all' || filterRecent || filterSalaryMin > 0 || filterSalaryMax > 0) && (
                  <button
                    onClick={() => {
                      setFilterJobType('all')
                      setFilterLocation('all')
                      setFilterCompany('all')
                      setFilterRecent(false)
                      setFilterSalaryMin(0)
                      setFilterSalaryMax(0)
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Job Cards */}
          <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <JobCardCandidate
                  key={job.id}
                  job={job}
                  isActive={selectedJobId === job.id}
                  isApplied={appliedJobIds.includes(job.id)}
                  onClick={handleJobSelect}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No jobs match your filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterJobType('all')
                    setFilterLocation('all')
                  }}
                  className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column - Job Details */}
        <Card className={cn(
          "flex-1 bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl overflow-y-auto",
          isMobile && mobileView === 'list' ? 'hidden' : 'block'
        )}>
          {/* Back to List button for mobile */}
          {isMobile && (
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4">
              <Button
                variant="ghost"
                onClick={() => setMobileView('list')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to List
              </Button>
            </div>
          )}
          <JobDetails
            job={selectedJob}
            originalJob={selectedOriginalJob}
            isApplied={selectedJob ? appliedJobIds.includes(selectedJob.id) : false}
            applicationStatus={selectedJob ? applicationStatuses[selectedJob.id] : undefined}
          />
        </Card>
      </div>
      <Footer />
    </div>
  )
}
