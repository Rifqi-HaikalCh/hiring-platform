'use client'

import { useState, useEffect } from 'react'
import { JobCardCandidate } from '@/components/candidate/JobCardCandidate'
import { JobDetails } from '@/components/candidate/JobDetails'
import { getJobs, type Job } from '@/lib/supabase/jobs'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

// Transform job data for candidate display
const transformJobForCandidate = (job: Job) => {
  // Convert job_description string to array for display
  const descriptionArray = job.job_description
    ? job.job_description.split('\n').filter(line => line.trim() !== '')
    : ['No description available']

  return {
    id: job.id,
    title: job.job_title, // Use job_title from database
    company: job.company || 'Company Name', // Fallback since this field might not exist
    location: job.location || 'Remote', // Fallback since this field might not exist
    salaryRange: {
      min: job.min_salary || 0, // Use min_salary from database
      max: job.max_salary || 0  // Use max_salary from database
    },
    type: job.job_type,
    description: descriptionArray
  }
}

// Mock data for demonstration (keeping as fallback)
const mockJobs = [
  {
    id: '1',
    title: 'Front End Developer',
    company: 'TechCorp Indonesia',
    location: 'Jakarta, Indonesia',
    salaryRange: { min: 7000000, max: 8000000 },
    type: 'Full-Time',
    description: [
      'Develop and maintain user-facing web applications using React.js and TypeScript',
      'Collaborate with designers to implement pixel-perfect UI components',
      'Optimize applications for maximum speed and scalability',
      'Write clean, maintainable, and well-documented code',
      'Participate in code reviews and technical discussions',
      'Stay up-to-date with the latest frontend technologies and best practices'
    ]
  },
  {
    id: '2',
    title: 'UI/UX Designer',
    company: 'Design Studio Co',
    location: 'Bandung, Indonesia',
    salaryRange: { min: 6000000, max: 8000000 },
    type: 'Full-Time',
    description: [
      'Create user-centered design solutions for web and mobile applications',
      'Conduct user research and usability testing to inform design decisions',
      'Develop wireframes, prototypes, and high-fidelity mockups',
      'Collaborate with developers to ensure design implementation quality',
      'Maintain and evolve design systems and component libraries',
      'Present design concepts and rationale to stakeholders'
    ]
  },
  {
    id: '3',
    title: 'Backend Developer',
    company: 'ServerTech Solutions',
    location: 'Surabaya, Indonesia',
    salaryRange: { min: 8000000, max: 10000000 },
    type: 'Full-Time',
    description: [
      'Design and develop scalable backend APIs using Node.js and Express',
      'Work with databases (PostgreSQL, MongoDB) to design efficient data schemas',
      'Implement authentication and authorization systems',
      'Write comprehensive unit and integration tests',
      'Deploy and monitor applications on cloud platforms (AWS, GCP)',
      'Collaborate with frontend teams to integrate APIs seamlessly'
    ]
  },
  {
    id: '4',
    title: 'Product Manager',
    company: 'InnovateTech',
    location: 'Jakarta, Indonesia',
    salaryRange: { min: 12000000, max: 15000000 },
    type: 'Full-Time',
    description: [
      'Define product strategy and roadmap based on market research and user feedback',
      'Work closely with engineering teams to prioritize features and manage development',
      'Analyze product metrics and user behavior to drive data-driven decisions',
      'Coordinate cross-functional teams including design, engineering, and marketing',
      'Conduct competitive analysis and stay informed about industry trends',
      'Communicate product vision and updates to stakeholders and leadership'
    ]
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudOps Pro',
    location: 'Jakarta, Indonesia',
    salaryRange: { min: 9000000, max: 12000000 },
    type: 'Full-Time',
    description: [
      'Manage and optimize CI/CD pipelines for automated deployment processes',
      'Monitor system performance and implement infrastructure improvements',
      'Work with containerization technologies like Docker and Kubernetes',
      'Implement and maintain security best practices across all environments',
      'Collaborate with development teams to streamline deployment workflows',
      'Troubleshoot production issues and implement preventive measures'
    ]
  }
]

export default function CandidateDashboard() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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

      const activeJobs = (data || []).filter(job => job.status === 'active')
      setJobs(activeJobs)

      // Select first job if available
      if (activeJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(activeJobs[0].id)
      }
    } catch (error) {
      toast.error('Failed to load jobs')
      console.error('Load jobs error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId)
  }


  const transformedJobs = jobs.map(transformJobForCandidate)
  const selectedJob = transformedJobs.find(job => job.id === selectedJobId) || null
  const selectedOriginalJob = jobs.find(job => job.id === selectedJobId) || null

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
    <div className="flex h-full">
      {/* Left Column - Job List */}
      <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Available Jobs</h2>
          <p className="text-sm text-gray-600 mt-1">{transformedJobs.length} jobs found</p>
        </div>

        <div className="p-4 space-y-3">
          {transformedJobs.length > 0 ? (
            transformedJobs.map((job) => (
              <JobCardCandidate
                key={job.id}
                job={job}
                isActive={selectedJobId === job.id}
                onClick={handleJobSelect}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No active jobs available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Job Details */}
      <div className="flex-1 bg-gray-50">
        <JobDetails job={selectedJob} originalJob={selectedOriginalJob} />
      </div>
    </div>
  )
}