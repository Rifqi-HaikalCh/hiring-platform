'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnResizeMode,
  ColumnOrderState,
} from '@tanstack/react-table'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  ChevronLeft,
  Edit3,
  Power,
  PowerOff,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  ChevronRight,
  X,
  Save
} from 'lucide-react'

// Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

// Services
import { getJobById, updateJob, updateJobStatus, deleteJob, Job } from '@/lib/supabase/jobs'
import {
  getApplicationsByJobId,
  Application,
  extractCandidateData,
  CandidateData
} from '@/lib/supabase/applications'

// Types
interface CandidateRow extends CandidateData {
  id: string
  status: string
  applied_at: string
  application_id: string
}

// Column helper
const columnHelper = createColumnHelper<CandidateRow>()

// Draggable Header component
function DraggableHeader({ header, table }: any) {
  const { getState, setColumnOrder } = table
  const { columnOrder } = getState()
  const { column } = header

  return (
    <div
      className="flex items-center space-x-2 cursor-pointer select-none"
      onClick={header.column.getToggleSortingHandler()}
    >
      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
      <div className="flex flex-col">
        {{
          asc: <ChevronUp className="h-4 w-4" />,
          desc: <ChevronDown className="h-4 w-4" />,
        }[header.column.getIsSorted() as string] ?? <ChevronsUpDown className="h-4 w-4 text-gray-400" />}
      </div>
      <div
        className="cursor-col-resize w-1 h-6 bg-gray-300 hover:bg-gray-400"
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
      />
    </div>
  )
}

// Edit Job Modal Component
function EditJobModal({
  isOpen,
  onClose,
  job,
  onJobUpdated
}: {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  onJobUpdated: (job: Job) => void
}) {
  const [formData, setFormData] = useState({
    job_title: '',
    job_type: '',
    job_description: '',
    candidates_needed: 1,
    min_salary: 0,
    max_salary: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (job) {
      setFormData({
        job_title: job.job_title || '',
        job_type: job.job_type || '',
        job_description: job.job_description || '',
        candidates_needed: job.candidates_needed || 1,
        min_salary: job.min_salary || 0,
        max_salary: job.max_salary || 0,
      })
    }
  }, [job])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return

    setLoading(true)
    try {
      const { data, error } = await updateJob(job.id, formData)

      if (error) {
        toast.error('Failed to update job')
        return
      }

      if (data) {
        onJobUpdated(data)
        toast.success('Job updated successfully')
        onClose()
      }
    } catch (error) {
      toast.error('An error occurred while updating the job')
    } finally {
      setLoading(false)
    }
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    Edit Job
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <Input
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type
                    </label>
                    <select
                      value={formData.job_type}
                      onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      required
                    >
                      <option value="">Select job type</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      value={formData.job_description}
                      onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                      rows={4}
                      className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Candidates Needed
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.candidates_needed}
                        onChange={(e) => setFormData({ ...formData, candidates_needed: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Salary
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.min_salary}
                        onChange={(e) => setFormData({ ...formData, min_salary: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Salary
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.max_salary}
                        onChange={(e) => setFormData({ ...formData, max_salary: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Job'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default function ManageCandidatesPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  // States
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [showEditModal, setShowEditModal] = useState(false)

  // Define table columns
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
        />
      ),
      enableSorting: false,
      enableResizing: false,
    }),
    columnHelper.accessor('full_name', {
      header: 'Full Name',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('date_of_birth', {
      header: 'Date of Birth',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('domicile', {
      header: 'Domicile',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('gender', {
      header: 'Gender',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('linkedin_url', {
      header: 'LinkedIn',
      cell: info => {
        const url = info.getValue()
        return url ? (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Profile
          </a>
        ) : '-'
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800',
          accepted: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
            {status}
          </span>
        )
      },
    }),
    columnHelper.accessor('applied_at', {
      header: 'Applied Date',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
  ], [])

  // Transform applications data for table
  const candidateData = useMemo(() => {
    return applications.map((app) => {
      const candidateInfo = extractCandidateData(app.application_data)
      return {
        id: app.id,
        application_id: app.id,
        status: app.status,
        applied_at: app.created_at, // Use created_at as applied_at
        ...candidateInfo,
      }
    })
  }, [applications])

  // Initialize table
  const table = useReactTable({
    data: candidateData,
    columns,
    state: {
      globalFilter,
      columnOrder,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange' as ColumnResizeMode,
    enableColumnResizing: true,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Load job and applications data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load job details
        const { data: jobData, error: jobError } = await getJobById(jobId)
        if (jobError) {
          toast.error('Failed to load job details')
          return
        }
        setJob(jobData)

        // Load applications
        const { data: applicationsData, error: applicationsError } = await getApplicationsByJobId(jobId)
        if (applicationsError) {
          toast.error('Failed to load applications')
          return
        }
        setApplications(applicationsData || [])
      } catch (error) {
        toast.error('An error occurred while loading data')
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      loadData()
    }
  }, [jobId])

  // Handle job status toggle
  const handleToggleJobStatus = async () => {
    if (!job) return

    const newStatus = job.status === 'active' ? 'inactive' : 'active'

    try {
      const { data, error } = await updateJobStatus(job.id, newStatus)
      if (error) {
        toast.error('Failed to update job status')
        return
      }

      if (data) {
        setJob(data)
        toast.success(`Job ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
      }
    } catch (error) {
      toast.error('An error occurred while updating job status')
    }
  }

  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!job) return

    const confirmed = window.confirm('Are you sure you want to delete this job? This action cannot be undone.')
    if (!confirmed) return

    try {
      const { error } = await deleteJob(job.id)
      if (error) {
        toast.error('Failed to delete job')
        return
      }

      toast.success('Job deleted successfully')
      router.push('/admin/dashboard')
    } catch (error) {
      toast.error('An error occurred while deleting the job')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with Breadcrumbs */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="hover:text-gray-900 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Job List
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">Manage Candidates</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.job_title}</h1>
              <p className="text-gray-600 mt-1">
                Status: <span className={`font-medium ${job.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {job.status}
                </span>
              </p>
            </div>

            {/* Job CRUD Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Job
              </Button>

              <Button
                variant={job.status === 'active' ? 'secondary' : 'primary'}
                onClick={handleToggleJobStatus}
                className="flex items-center"
              >
                {job.status === 'active' ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDeleteJob}
                className="flex items-center text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Job
              </Button>
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Candidates ({applications.length})
              </h2>

              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search candidates..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(String(e.target.value))}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {applications.length === 0 ? (
              <EmptyState
                title="No Candidates Yet"
                description="No candidates have applied for this job yet."
              />
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0 relative"
                              style={{ width: header.getSize() }}
                            >
                              <DraggableHeader header={header} table={table} />
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map(cell => (
                            <td
                              key={cell.id}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                              style={{ width: cell.column.getSize() }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={e => table.setPageSize(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      {[5, 10, 20, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                          Show {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Edit Job Modal */}
        <EditJobModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          job={job}
          onJobUpdated={setJob}
        />
      </div>
    </DndProvider>
  )
}