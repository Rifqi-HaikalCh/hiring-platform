'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Building2, MapPin, DollarSign, Briefcase, Calendar, User, Mail, Phone, Cake, Home, Globe2, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { extractCandidateData } from '@/lib/supabase/applications'

interface ApplicationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  application: {
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
  } | null
}

export function ApplicationDetailsModal({
  isOpen,
  onClose,
  application
}: ApplicationDetailsModalProps) {
  if (!application) return null

  const candidateData = extractCandidateData(application.application_data || {})

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 px-6 py-8 text-white">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border-2 border-white/30">
                        {application.job.company_logo ? (
                          <img
                            src={application.job.company_logo}
                            alt={application.job.company_name || 'Company'}
                            className="w-16 h-16 object-contain rounded-xl"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-teal-600 font-bold text-2xl shadow-md">
                            {(application.job.company_name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <Dialog.Title className="text-2xl font-bold mb-2">
                          {application.job.job_title}
                        </Dialog.Title>
                        {application.job.company_name && (
                          <p className="text-teal-100 text-lg mb-2 flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {application.job.company_name}
                          </p>
                        )}
                        <StatusBadge status={application.status} className="inline-block" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-300"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Job Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-teal-600" />
                          Job Information
                        </h3>

                        <div className="space-y-3">
                          {application.job.job_type && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Briefcase className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Job Type</p>
                                <p className="text-sm font-semibold text-gray-900">{application.job.job_type}</p>
                              </div>
                            </div>
                          )}

                          {application.job.location && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <MapPin className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                                <p className="text-sm font-semibold text-gray-900">{application.job.location}</p>
                              </div>
                            </div>
                          )}

                          {application.job.department && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Building2 className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Department</p>
                                <p className="text-sm font-semibold text-gray-900">{application.job.department}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                            <DollarSign className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-teal-700 font-medium mb-1">Salary Range</p>
                              <p className="text-sm font-bold text-teal-900">
                                {formatCurrency(application.job.min_salary)} - {formatCurrency(application.job.max_salary)}
                              </p>
                            </div>
                          </div>

                          {application.job.required_skills && application.job.required_skills.length > 0 && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-xs text-gray-500 font-medium mb-2">Required Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {application.job.required_skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full border border-teal-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {application.job.job_description && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-teal-600" />
                            Job Description
                          </h3>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {application.job.job_description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Candidate Information */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User className="h-5 w-5 text-teal-600" />
                          Your Submitted Information
                        </h3>

                        <div className="space-y-3">
                          {candidateData.full_name && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <User className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Full Name</p>
                                <p className="text-sm font-semibold text-gray-900">{candidateData.full_name}</p>
                              </div>
                            </div>
                          )}

                          {candidateData.email && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Mail className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                                <p className="text-sm font-semibold text-gray-900">{candidateData.email}</p>
                              </div>
                            </div>
                          )}

                          {candidateData.phone && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Phone className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Phone Number</p>
                                <p className="text-sm font-semibold text-gray-900">{candidateData.phone}</p>
                              </div>
                            </div>
                          )}

                          {candidateData.gender && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <User className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Gender</p>
                                <p className="text-sm font-semibold text-gray-900">{candidateData.gender}</p>
                              </div>
                            </div>
                          )}

                          {candidateData.date_of_birth && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Cake className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Date of Birth</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {new Date(candidateData.date_of_birth).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}

                          {candidateData.domicile && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Home className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Domicile</p>
                                <p className="text-sm font-semibold text-gray-900">{candidateData.domicile}</p>
                              </div>
                            </div>
                          )}

                          {candidateData.linkedin_url && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <Globe2 className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">LinkedIn Profile</p>
                                <a
                                  href={candidateData.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                                >
                                  View Profile
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-teal-700 font-medium mb-1">Application Date</p>
                            <p className="text-sm font-bold text-teal-900">
                              {formatDate(application.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #14b8a6, #06b6d4);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #0d9488, #0891b2);
          }
        `}</style>
      </Dialog>
    </Transition>
  )
}
