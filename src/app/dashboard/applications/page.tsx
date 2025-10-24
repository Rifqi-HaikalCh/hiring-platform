'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserAppliedJobs } from '@/lib/supabase/applications'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Footer } from '@/components/layout/Footer'
import { ApplicationDetailsModal } from '@/components/modals/ApplicationDetailsModal'
import { toast } from 'react-hot-toast'
import { Calendar, MapPin, DollarSign, Building2, Briefcase, Clock, CheckCircle2, XCircle, FileText, Eye } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface Application {
  id: string
  job_id: string
  status: 'submitted' | 'pending' | 'accepted' | 'rejected'
  created_at: string
  application_data?: any
  job: {
    id: string
    job_title: string
    job_type: string
    job_description?: string
    company_name?: string
    company_logo?: string
    location?: string
    department?: string
    required_skills?: string[]
    min_salary: number
    max_salary: number
    status: string
  }
}

export default function MyApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending' | 'accepted' | 'rejected'>('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailsModal(false)
    setSelectedApplication(null)
  }

  useEffect(() => {
    loadApplications()
  }, [user])

  const loadApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await getUserAppliedJobs(user.id)

      if (error) {
        console.error('Load applications error:', error)
        toast.error('Failed to load applications')
        return
      }

      setApplications(data || [])
    } catch (error) {
      console.error('Load applications error:', error)
      toast.error('An error occurred while loading applications')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true
    return app.status === filterStatus
  })

  const filterOptions = [
    { value: 'all' as const, label: 'All Applications', icon: Briefcase, count: applications.length },
    { value: 'submitted' as const, label: 'Submitted', icon: FileText, count: applications.filter(app => app.status === 'submitted').length },
    { value: 'pending' as const, label: 'Pending', icon: Clock, count: applications.filter(app => app.status === 'pending').length },
    { value: 'accepted' as const, label: 'Accepted', icon: CheckCircle2, count: applications.filter(app => app.status === 'accepted').length },
    { value: 'rejected' as const, label: 'Rejected', icon: XCircle, count: applications.filter(app => app.status === 'rejected').length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 flex flex-col">
      <div className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent mb-2">My Applications</h1>
            <p className="text-gray-600">Track the status of your job applications</p>
          </div>

          {/* Layout with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filter */}
            <aside className="lg:w-72 flex-shrink-0">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Filter by Status</h2>
                <div className="space-y-2">
                  {filterOptions.map((option) => {
                    const Icon = option.icon
                    const isActive = filterStatus === option.value
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFilterStatus(option.value)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-md shadow-teal-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                          <span>{option.label}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {option.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Card>
            </aside>

            {/* Applications List */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredApplications.map((application) => (
                    <Card
                      key={application.id}
                      className="group p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-md hover:scale-[1.01] cursor-pointer"
                      onClick={() => handleViewDetails(application)}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Company Logo */}
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-sky-50 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-gray-200 shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                          {application.job.company_logo ? (
                            <img
                              src={application.job.company_logo}
                              alt={application.job.company_name || 'Company'}
                              className="w-16 h-16 object-contain rounded-xl"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-sky-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md">
                              {(application.job.company_name || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                                {application.job.job_title}
                              </h3>
                              {application.job.company_name && (
                                <p className="text-base font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                  <Building2 className="h-5 w-5 text-teal-600" />
                                  {application.job.company_name}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={application.status} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {application.job.job_type && (
                              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                <Briefcase className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                <span className="font-semibold">{application.job.job_type}</span>
                              </div>
                            )}
                            {application.job.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                <span className="font-medium">{application.job.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-teal-50 to-sky-50 px-3 py-2 rounded-lg border border-teal-200">
                              <DollarSign className="h-4 w-4 text-teal-600 flex-shrink-0" />
                              <span className="font-bold text-teal-700">
                                {formatCurrency(application.job.min_salary)} - {formatCurrency(application.job.max_salary)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium">
                                Applied {new Date(application.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-sky-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-sky-700 transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(application)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No applications found"
                  description={
                    filterStatus === 'all'
                      ? "You haven't applied to any jobs yet. Start exploring job listings!"
                      : `No applications with status "${filterStatus}"`
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
        application={selectedApplication}
      />
    </div>
  )
}
