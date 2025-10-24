'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'
import { Calendar, MapPin, DollarSign, Building2, Briefcase, Clock } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface Application {
  id: string
  job_id: string
  status: 'submitted' | 'pending' | 'accepted' | 'rejected'
  created_at: string
  job: {
    id: string
    job_title: string
    job_type: string
    company_name?: string
    company_logo?: string
    location?: string
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

  useEffect(() => {
    loadApplications()
  }, [user])

  const loadApplications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs (
            id,
            job_title,
            job_type,
            company_name,
            company_logo,
            location,
            min_salary,
            max_salary,
            status
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Load applications error:', error)
        toast.error('Failed to load applications')
        return
      }

      setApplications(data as any)
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success'
      case 'rejected':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'submitted':
        return 'default'
      default:
        return 'default'
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true
    return app.status === filterStatus
  })

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Track the status of your job applications</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'submitted', 'pending', 'accepted', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterStatus === status
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 text-xs">
                  ({applications.filter(app => app.status === status).length})
                </span>
              )}
              {status === 'all' && (
                <span className="ml-2 text-xs">
                  ({applications.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredApplications.map((application) => (
              <Card
                key={application.id}
                className="p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Company Logo */}
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-sky-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 shadow-sm">
                      {application.job.company_logo ? (
                        <img
                          src={application.job.company_logo}
                          alt={application.job.company_name || 'Company'}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {(application.job.company_name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {application.job.job_title}
                          </h3>
                          {application.job.company_name && (
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <Building2 className="h-4 w-4 mr-1 text-gray-500" />
                              {application.job.company_name}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusVariant(application.status)} className="ml-4">
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {application.job.job_type && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Briefcase className="h-4 w-4 mr-1.5 text-teal-600" />
                            <span className="font-medium">{application.job.job_type}</span>
                          </div>
                        )}
                        {application.job.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1.5 text-teal-600" />
                            <span>{application.job.location}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1.5 text-teal-600" />
                          <span className="font-medium text-teal-700">
                            {formatCurrency(application.job.min_salary)} - {formatCurrency(application.job.max_salary)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1.5 text-gray-500" />
                          <span>
                            Applied {new Date(application.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
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
  )
}
