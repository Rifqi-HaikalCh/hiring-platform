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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  Save,
  GripVertical,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

// Components
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

// Services
import { getJobById, updateJob, updateJobStatus, deleteJob, Job } from '@/lib/supabase/jobs'
import {
  getApplicationsByJobId,
  updateApplicationStatus,
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

// Draggable Header component using @dnd-kit
function DraggableHeader({ header, table }: any) {
  const { column } = header
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center space-x-2 select-none">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-gray-200/50 p-1 rounded">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div
        className="flex items-center space-x-2 cursor-pointer flex-1"
        onClick={header.column.getToggleSortingHandler()}
      >
        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
        <div className="flex flex-col">
          {{
            asc: <ChevronUp className="h-4 w-4" />,
            desc: <ChevronDown className="h-4 w-4" />,
          }[header.column.getIsSorted() as string] ?? <ChevronsUpDown className="h-4 w-4 text-gray-400" />}
        </div>
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
    department: '',
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
        department: job.department || '',
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department (Optional)
                    </label>
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Engineering, Marketing, Sales"
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Handle status change for candidates
  const handleStatusChange = async (applicationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      const { data, error } = await updateApplicationStatus(applicationId, newStatus)

      if (error) {
        toast.error('Failed to update candidate status')
        return
      }

      // Update local state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      )

      toast.success(`Candidate ${newStatus === 'accepted' ? 'accepted' : newStatus === 'rejected' ? 'rejected' : 'set to pending'} successfully`)
    } catch (error) {
      toast.error('An error occurred while updating status')
    }
  }

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
        // Map status to StatusBadge format
        const badgeStatus = status === 'submitted' ? 'submitted' : status
        return <StatusBadge status={badgeStatus as any} showIcon={false} />
      },
    }),
    columnHelper.accessor('applied_at', {
      header: 'Applied Date',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const applicationId = row.original.application_id
        const currentStatus = row.original.status

        return (
          <div className="flex items-center gap-2">
            {currentStatus !== 'accepted' && (
              <button
                onClick={() => handleStatusChange(applicationId, 'accepted')}
                className="group relative p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:shadow-md"
                title="Accept Candidate"
                aria-label="Accept this candidate"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Accept
                </span>
              </button>
            )}
            {currentStatus !== 'rejected' && (
              <button
                onClick={() => handleStatusChange(applicationId, 'rejected')}
                className="group relative p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-md"
                title="Reject Candidate"
                aria-label="Reject this candidate"
              >
                <XCircle className="h-4 w-4" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Reject
                </span>
              </button>
            )}
            {(currentStatus === 'accepted' || currentStatus === 'rejected') && currentStatus !== 'pending' && (
              <button
                onClick={() => handleStatusChange(applicationId, 'pending')}
                className="group relative p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all hover:shadow-md"
                title="Set to Pending"
                aria-label="Set this candidate status to pending"
              >
                <Clock className="h-4 w-4" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Pending
                </span>
              </button>
            )}
          </div>
        )
      },
      enableSorting: false,
      enableResizing: false,
    }),
  ], [handleStatusChange])

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

  // Handle column drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string)
      const newIndex = columnOrder.indexOf(over.id as string)

      const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex)
      setColumnOrder(newColumnOrder)
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
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
        <Card className="p-6 bg-white/80 backdrop-blur-md border-gray-200/50 shadow-xl shadow-teal-500/5">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                  Candidates
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {applications.length} {applications.length === 1 ? 'application' : 'applications'} received
                </p>
              </div>

              {/* Global Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-hover:text-teal-500" />
                <Input
                  placeholder="Search candidates..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(String(e.target.value))}
                  className="pl-10 w-72 bg-white/60 backdrop-blur-sm border-gray-300/50 focus:bg-white transition-all"
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
                {/* Modern Glassmorphism Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200/50 bg-white/50 backdrop-blur-sm">
                  <table className="w-full">
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} className="border-b border-gray-200/50 bg-gradient-to-r from-teal-50/80 via-sky-50/80 to-teal-50/80">
                          <SortableContext
                            items={columnOrder.length > 0 ? columnOrder : headerGroup.headers.map(h => h.column.id)}
                            strategy={horizontalListSortingStrategy}
                          >
                            {headerGroup.headers.map(header => {
                              const isSelect = header.column.id === 'select'
                              const isFullName = header.column.id === 'full_name'
                              const isActions = header.column.id === 'actions'

                              return (
                              <th
                                key={header.id}
                                className={`px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider first:rounded-tl-2xl last:rounded-tr-2xl relative ${
                                  isSelect ? 'sticky left-0 z-20 bg-gradient-to-r from-teal-50/80 via-sky-50/80 to-teal-50/80 border-r border-gray-200/50' : ''
                                } ${
                                  isFullName ? 'sticky left-[60px] z-20 bg-gradient-to-r from-teal-50/80 via-sky-50/80 to-teal-50/80 border-r border-gray-200/50' : ''
                                } ${
                                  isActions ? 'sticky right-0 z-20 bg-gradient-to-r from-teal-50/80 via-sky-50/80 to-teal-50/80 border-l border-gray-200/50' : ''
                                }`}
                                style={{ width: header.getSize() }}
                              >
                                <DraggableHeader header={header} table={table} />
                              </th>
                              )
                            })}
                          </SortableContext>
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                      {table.getRowModel().rows.map((row, index) => (
                        <tr
                          key={row.id}
                          className="group relative transition-all duration-200 hover:bg-teal-50/30"
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          {row.getVisibleCells().map((cell, cellIndex) => {
                            const isSelect = cell.column.id === 'select'
                            const isFullName = cell.column.id === 'full_name'
                            const isActions = cell.column.id === 'actions'

                            return (
                            <td
                              key={cell.id}
                              className={`px-6 py-5 text-sm text-gray-900 transition-colors duration-200 ${
                                cellIndex === 0 ? 'rounded-l-xl' : ''
                              } ${
                                cellIndex === row.getVisibleCells().length - 1 ? 'rounded-r-xl' : ''
                              } ${
                                isSelect ? 'sticky left-0 z-10 bg-white group-hover:bg-teal-50/30 border-r border-gray-200/50' : ''
                              } ${
                                isFullName ? 'sticky left-[60px] z-10 bg-white group-hover:bg-teal-50/30 border-r border-gray-200/50' : ''
                              } ${
                                isActions ? 'sticky right-0 z-10 bg-white group-hover:bg-teal-50/30 border-l border-gray-200/50' : ''
                              }`}
                              style={{ width: cell.column.getSize() }}
                            >
                              {/* Magic Bento Grid Animation - Only on first cell */}
                              {cellIndex === 0 && (
                                <div className="absolute inset-0 left-0 right-[calc(-100vw)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden rounded-xl -z-0">
                                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-sky-500/5 to-purple-500/5 animate-gradient-shift"></div>
                                  <div className="bento-grid absolute inset-0">
                                    {[...Array(20)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="bento-cell"
                                        style={{
                                          animationDelay: `${i * 30}ms`
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="relative z-10">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      Page <span className="text-teal-600 font-bold">{table.getState().pagination.pageIndex + 1}</span> of <span className="font-bold">{table.getPageCount()}</span>
                    </span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={e => table.setPageSize(Number(e.target.value))}
                      className="border border-gray-300/50 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                      className="font-medium hover:bg-teal-50 hover:text-teal-700 hover:border-teal-500 transition-all disabled:opacity-40"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="font-medium hover:bg-teal-50 hover:text-teal-700 hover:border-teal-500 transition-all disabled:opacity-40"
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
    </DndContext>
  )
}