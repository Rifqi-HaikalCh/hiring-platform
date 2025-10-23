import { Building2, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salaryRange: {
    min: number
    max: number
  }
  companyLogo?: string
}

interface JobCardCandidateProps {
  job: Job
  isActive: boolean
  onClick: (jobId: string) => void
}

export function JobCardCandidate({ job, isActive, onClick }: JobCardCandidateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-l-4 border-l-teal-600 bg-teal-50' : 'border-l-4 border-l-transparent'
      }`}
      onClick={() => onClick(job.id)}
    >
      <div className="flex items-start space-x-3">
        {/* Company Logo */}
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-8 h-8 object-contain"
            />
          ) : (
            <Building2 className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {job.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{job.company}</p>

          <div className="flex items-center text-sm text-gray-500 mt-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{job.location}</span>
          </div>

          <p className="text-sm font-medium text-gray-900 mt-2">
            {formatCurrency(job.salaryRange.min)} - {formatCurrency(job.salaryRange.max)}
          </p>
        </div>
      </div>
    </Card>
  )
}