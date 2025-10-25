'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { createPortal } from 'react-dom'
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
import { Dialog, Transition, Menu } from '@headlessui/react'
import { Fragment } from 'react'

// Services
import { getJobById, updateJob, updateJobStatus, deleteJob, Job } from '@/lib/supabase/jobs'
import {
  getApplicationsByJobId,
  updateApplicationStatus,
  checkAndDeactivateJobIfFull,
  Application,
  extractCandidateData,
  CandidateData
} from '@/lib/supabase/applications'
import { cn } from '@/lib/utils'

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
    const { data, error } = await updateApplicationStatus(applicationId, newStatus); // Update status aplikasi dulu

    if (error) {
      toast.error('Failed to update candidate status');
      return;
    }
      // Update local state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      )

      toast.success(`Candidate ${newStatus === 'accepted' ? 'accepted' : newStatus === 'rejected' ? 'rejected' : 'set to pending'} successfully`)

      // Check if job should be auto-deactivated when accepting a candidate
if (newStatus === 'accepted' && jobId) {
      console.log(`[handleStatusChange] Status changed to accepted for app ${applicationId}, job ${jobId}. Checking if job should be deactivated...`); // Log sebelum memanggil
      const result = await checkAndDeactivateJobIfFull(jobId); // Panggil fungsi cek
      console.log('[handleStatusChange] Auto-deactivate check result:', result); // Log hasilnya

        if (result.success && result.deactivated) {
          // Reload job details to reflect the status change
const { data: updatedJob, error: refreshError } = await getJobById(jobId);
        if (!refreshError && updatedJob) {
          setJob(updatedJob);
          toast('Lowongan telah otomatis dinonaktifkan karena semua posisi telah terisi'); // Pesan mungkin perlu disesuaikan
        }
      } else if (!result.success) {
          // Tambahkan pesan jika checkAndDeactivateJobIfFull gagal
          toast.error('Gagal memeriksa status deaktivasi otomatis lowongan.');
          console.error('[handleStatusChange] checkAndDeactivateJobIfFull failed:', result.error);
      }
    }
  } catch (error) {
    toast.error('An error occurred while updating status');
    console.error('[handleStatusChange] Unexpected error:', error); // Log error tak terduga
  }
};

// Definisi kolom (columns) tetap sama
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
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
        />
      ),
      size: 60, // Lebar tetap untuk checkbox
      enableSorting: false,
      enableResizing: false,
    }),
    columnHelper.accessor('full_name', {
      header: 'Full Name',
      cell: info => info.getValue() || '-',
      size: 200, // Beri ukuran awal
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue() || '-',
       size: 220,
    }),
    columnHelper.accessor('phone', { // Pastikan key 'phone' benar sesuai extractCandidateData
      header: 'Phone',
      cell: info => info.getValue() || '-',
       size: 150,
    }),
    columnHelper.accessor('date_of_birth', {
      header: 'Date of Birth',
      cell: info => {
        const dateStr = info.getValue();
        if (!dateStr) return '-';
        try {
            // Format tanggal yang lebih ramah
            return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr; // Fallback jika format tidak valid
        }
      },
       size: 130,
    }),
    columnHelper.accessor('domicile', {
      header: 'Domicile',
      cell: info => info.getValue() || '-',
       size: 150,
    }),
    columnHelper.accessor('gender', {
      header: 'Gender',
      cell: info => info.getValue() || '-',
      size: 100,
    }),
    columnHelper.accessor('linkedin_url', { // Pastikan key 'linkedin_url' benar
      header: 'LinkedIn',
      cell: info => {
        const url = info.getValue();
        // Validasi URL sederhana
        const isValidUrl = url && (url.startsWith('http://') || url.startsWith('https://'));
        return isValidUrl ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline truncate max-w-[150px] inline-block"
             title={url} // Tooltip untuk URL penuh
          >
            View Profile
          </a>
        ) : '-'
      },
      size: 130,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const badgeStatus = status === 'submitted' ? 'submitted' : status;
        // Berikan tipe yang benar ke StatusBadge jika perlu
        return <StatusBadge status={badgeStatus as 'submitted' | 'pending' | 'accepted' | 'rejected'} showIcon={false} />;
      },
      size: 120,
    }),
    columnHelper.accessor('applied_at', {
      header: 'Applied Date',
      cell: info => new Date(info.getValue()).toLocaleDateString('en-GB'), // Format DD/MM/YYYY
       size: 130,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center">Actions</div>, // Pusatkan header Actions
      cell: ({ row }) => {
        const applicationId = row.original.application_id;
        const currentStatus = row.original.status;
        const buttonRef = React.useRef<HTMLButtonElement>(null);
        const [menuPosition, setMenuPosition] = React.useState<{ top: number; right: number } | null>(null);

        return (
          <div className="flex justify-center">
            <Menu as="div" className="relative inline-block text-left">
              {({ open }) => {
                // Calculate position when menu opens
                React.useEffect(() => {
                  if (open && buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect();
                    setMenuPosition({
                      top: rect.bottom + 8,
                      right: window.innerWidth - rect.right
                    });
                  }
                }, [open]);

                return (
                  <>
                    <Menu.Button
                      ref={buttonRef}
                      className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Menu.Button>

                    {open && menuPosition && typeof document !== 'undefined' && createPortal(
                      <Transition
                        as={Fragment}
                        show={open}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="fixed w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]"
                          style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`
                          }}
                        >
                          <div className="py-1">
                            {currentStatus !== 'accepted' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleStatusChange(applicationId, 'accepted')}
                                    className={`${
                                      active ? 'bg-green-50 text-green-900' : 'text-gray-700'
                                    } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                                  >
                                    <CheckCircle className="mr-3 h-4 w-4 text-green-500" />
                                    Accept
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {currentStatus !== 'rejected' && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleStatusChange(applicationId, 'rejected')}
                                    className={`${
                                      active ? 'bg-red-50 text-red-900' : 'text-gray-700'
                                    } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                                  >
                                    <XCircle className="mr-3 h-4 w-4 text-red-500" />
                                    Reject
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {(currentStatus === 'accepted' || currentStatus === 'rejected') && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleStatusChange(applicationId, 'pending')}
                                    className={`${
                                      active ? 'bg-yellow-50 text-yellow-900' : 'text-gray-700'
                                    } group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors`}
                                  >
                                    <Clock className="mr-3 h-4 w-4 text-yellow-500" />
                                    Mark as Pending
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>,
                      document.body
                    )}
                  </>
                );
              }}
            </Menu>
          </div>
        );
      },
      size: 100, // Lebar tetap untuk Actions
      enableSorting: false,
      enableResizing: false,
    }),
  ], [handleStatusChange]); // Dependensi handleStatusChange

  // Initial column order (example, sesuaikan jika perlu)
  useEffect(() => {
    setColumnOrder([
      'select',
      'full_name',
      'email',
      'phone',
      'status',
      'applied_at',
      'date_of_birth',
      'domicile',
      'gender',
      'linkedin_url',
      'actions',
    ]);
  }, []);

  // Extract candidateData from applications
  const candidateData: CandidateRow[] = useMemo(() => {
    return applications.map(app => {
      const candidate = extractCandidateData(app.application_data);
      return {
        ...candidate,
        id: app.applicant_id ?? '', // fallback if null
        status: app.status,
        applied_at: app.created_at ?? '',
        application_id: app.id,
      };
    });
  }, [applications]);

  const table = useReactTable({
      data: candidateData,
      columns,
      state: {
        globalFilter,
        columnOrder,
        // Anda mungkin perlu menambahkan sorting state di sini jika Anda ingin menyimpannya
        // sorting: sortingState,
      },
      onGlobalFilterChange: setGlobalFilter,
      onColumnOrderChange: setColumnOrder,
      // onSortingChange: setSortingState, // Handler untuk sorting
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      columnResizeMode: 'onChange' as ColumnResizeMode,
      enableColumnResizing: true,
      // Berikan ukuran kolom default
      defaultColumn: {
        minSize: 50,
        size: 150, // Ukuran default jika tidak ditentukan di kolom
        maxSize: 500,
      },
      initialState: {
        pagination: {
          pageSize: 10,
        },
      },
  });

  // Hitung total lebar tabel untuk min-w
  const tableTotalSize = useMemo(
    () => table.getTotalSize(),
    [table.getState().columnSizing, table.getState().columnOrder] // Recalculate if sizing or order changes
  );


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

const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((currentOrder) => {
        const oldIndex = currentOrder.indexOf(active.id as string);
        const newIndex = currentOrder.indexOf(over.id as string);
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
    }
  };

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
      <div className="container mx-auto px-2 sm:px-4 py-8"> {/* Kurangi padding horizontal di mobile */}
        {/* Header with Breadcrumbs & Job Actions */}
        <div className="mb-6">
          {/* ... (Navigasi breadcrumb tetap sama) ... */}
           <nav className="flex items-center space-x-1 sm:space-x-2 text-sm text-gray-600 mb-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="hover:text-gray-900 flex items-center p-1 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Job List
              </button>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 font-medium truncate">Manage Candidates</span>
            </nav>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate max-w-lg">{job.job_title}</h1>
              <p className="text-gray-600 mt-1">
                Status: <span className={`font-medium ${job.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)} {/* Capitalize */}
                </span>
              </p>
            </div>

            {/* Job CRUD Buttons */}
             <div className="flex flex-wrap gap-2"> {/* Gunakan flex-wrap */}
              <Button
                variant="outline"
                size="sm" // Ukuran tombol lebih kecil
                onClick={() => setShowEditModal(true)}
                className="flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Job</span> {/* Sembunyikan teks di mobile */}
                 <span className="sm:hidden">Edit</span>
              </Button>

              <Button
                variant={job.status === 'active' ? 'secondary' : 'primary'}
                 size="sm"
                onClick={handleToggleJobStatus}
                className="flex items-center"
              >
                {job.status === 'active' ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-1 sm:mr-2" />
                     <span className="hidden sm:inline">Deactivate</span>
                      <span className="sm:hidden">Off</span>
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Activate</span>
                     <span className="sm:hidden">On</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                 size="sm"
                onClick={handleDeleteJob}
                className="flex items-center text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                 <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Candidates Table Card */}
        {/* Ganti Card sebelumnya dengan div biasa atau Card dengan p-0 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
           {/* Header Card (Search & Title) */}
           <div className="p-4 sm:p-6 border-b border-gray-200">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Candidates
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                    {applications.length} {applications.length === 1 ? 'application' : 'applications'} received
                    </p>
                </div>
                {/* Global Search */}
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                    placeholder="Search candidates..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(String(e.target.value))}
                    className="pl-9 w-full sm:w-64 h-9 text-sm rounded-md border-gray-300 focus:border-teal-500 focus:ring-teal-500" // Sesuaikan styling input
                    />
                </div>
               </div>
           </div>

          {applications.length === 0 && !loading ? (
             <div className="p-6">
                <EmptyState
                    title="No Candidates Yet"
                    description="No candidates have applied for this job yet."
                />
             </div>
          ) : (
            <>
              {/* Modern Solid Table */}
              <div className="overflow-x-auto"> {/* Wrapper untuk horizontal scroll */}
                <table className="min-w-full divide-y divide-gray-200" style={{ width: tableTotalSize }}>
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        <SortableContext
                           items={columnOrder.length > 0 ? columnOrder : headerGroup.headers.map(h => h.column.id)}
                          strategy={horizontalListSortingStrategy}
                        >
                          {headerGroup.headers.map(header => {
                            const isSelect = header.column.id === 'select';
                            const isFullName = header.column.id === 'full_name';
                            const isActions = header.column.id === 'actions';

                            return (
                              <th
                                key={header.id}
                                scope="col"
                                className={cn(
                                  "px-4 py-3 sm:px-6 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider relative group", // Kurangi padding mobile
                                  header.column.getCanResize() && "cursor-col-resize select-none",
                                   // --- STICKY STYLING ---
                                  isSelect && "sticky left-0 z-20 bg-gray-50 border-r border-gray-200",
                                  // Offset 'left' harus sesuai lebar kolom 'select' (size: 60)
                                  isFullName && "sticky left-[60px] z-20 bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                   // Offset 'left' = lebar 'select' + padding
                                   isActions && "sticky right-0 z-20 bg-gray-50 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center" // Center align header
                                )}
                                style={{
                                    width: header.getSize(),
                                }}
                              >
                                  <div className="flex items-center">
                                      {/* Draggable Header Content (termasuk drag handle) */}
                                      <DraggableHeader header={header} table={table} />
                                  </div>
                                  {/* Resizer */}
                                   {header.column.getCanResize() && (
                                    <div
                                        onMouseDown={header.getResizeHandler()}
                                        onTouchStart={header.getResizeHandler()}
                                        className={cn(
                                        'absolute top-0 right-0 h-full w-[5px] cursor-col-resize select-none touch-none bg-gray-300 opacity-0 group-hover:opacity-100',
                                        header.column.getIsResizing() && 'bg-teal-400 opacity-100'
                                        )}
                                    />
                                    )}
                              </th>
                            );
                          })}
                        </SortableContext>
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors duration-150 group" // group untuk hover di sticky
                      >
                        {row.getVisibleCells().map(cell => {
                           const isSelect = cell.column.id === 'select';
                           const isFullName = cell.column.id === 'full_name';
                           const isActions = cell.column.id === 'actions';
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                "px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-800", // Kurangi padding mobile
                                 // --- STICKY STYLING ---
                                isSelect && "sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200",
                                // Offset 'left' harus sesuai lebar kolom 'select'
                                isFullName && "sticky left-[60px] z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                                 // Offset 'left' = lebar 'select' + padding
                                 isActions && "sticky right-0 z-10 bg-white group-hover:bg-gray-50 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                              )}
                                style={{ width: cell.column.getSize() }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
               <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-200">
                    {/* Items per page and page info */}
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Page <span className="font-bold">{table.getState().pagination.pageIndex + 1}</span> of <span className="font-bold">{table.getPageCount()}</span>
                        </span>
                        <select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all"
                        >
                        {[5, 10, 20, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                            </option>
                        ))}
                        </select>
                         <span className="text-sm text-gray-500 whitespace-nowrap">
                            ({candidateData.length} total candidates)
                         </span>
                    </div>

                    {/* Pagination buttons */}
                    <div className="flex space-x-2">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="font-medium disabled:opacity-50"
                        >
                        Previous
                        </Button>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="font-medium disabled:opacity-50"
                        >
                        Next
                        </Button>
                    </div>
                </div>
            </>
          )}
        </div>

        {/* Edit Job Modal */}
        <EditJobModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          job={job}
          onJobUpdated={setJob}
        />
      </div>
    </DndContext>
  );
}