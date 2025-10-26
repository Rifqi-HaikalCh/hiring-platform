import { useState } from 'react'
import { Building2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ApplyJobModal } from '@/components/modals/ApplyJobModal'
import type { Job as OriginalJob } from '@/lib/supabase/jobs'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salaryRange: {
    min: number
    max: number
  }
  type: string
  description: string[]
  companyLogo?: string | null;
}

interface JobDetailsProps {
  job: Job | null
  originalJob: OriginalJob | null
  isApplied?: boolean
  applicationStatus?: 'submitted' | 'pending' | 'accepted' | 'rejected'
}

export function JobDetails({ job, originalJob, isApplied = false, applicationStatus }: JobDetailsProps) {
  const [showApplyModal, setShowApplyModal] = useState(false)

  if (!job) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500 mb-4">
          <Building2 className="h-16 w-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job to view details</h3>
        <p className="text-gray-600">Choose a job from the list to see more information</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <Building2 className="h-8 w-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="info">{job.type}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
          <p className="text-lg text-gray-600 mb-2">{job.company}</p>
          <div className="flex items-center text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{job.location}</span>
          </div>
        </div>
      </div>

      {/* Salary */}
      <div className="mb-6">
        <p className="text-xl font-semibold text-gray-900">
          {formatCurrency(job.salaryRange.min)} - {formatCurrency(job.salaryRange.max)}
        </p>
      </div>

      {/* Apply Button or Application Status */}
      <div className="mb-8">
        {isApplied && applicationStatus ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={applicationStatus} showIcon={true} />
            </div>
            <p className="text-gray-700 leading-relaxed">
              {applicationStatus === 'submitted' && (
                "Your application has been sent. Please wait for it to be processed. Good luck!"
              )}
              {applicationStatus === 'pending' && (
                "Your application is currently under review. We'll update you soon!"
              )}
              {applicationStatus === 'accepted' && (
                "Congratulations! Your application has been accepted. Expect further communication!"
              )}
              {applicationStatus === 'rejected' && (
                "Thank you for your interest. Unfortunately, we've decided not to move forward with your application at this time."
              )}
            </p>
          </div>
        ) : originalJob && originalJob.status === 'inactive' ? (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <h3 className="text-lg font-semibold text-red-800">Tidak Lagi Menerima Lamaran</h3>
            </div>
            <p className="text-red-700 leading-relaxed">
              Maaf, lowongan pekerjaan ini sudah tidak aktif. Semua posisi yang dibutuhkan telah terisi atau lowongan telah ditutup.
            </p>
          </div>
        ) : (
          <Button
            onClick={() => setShowApplyModal(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 shadow-lg shadow-orange-500/30"
            size="lg"
          >
            Apply for this Position
          </Button>
        )}
      </div>

      {/* Job Description */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h2>
        <ul className="space-y-3">
          {job.description.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={originalJob}
      />
    </div>
  )
}