import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Edit3, Power, PowerOff, Trash2, Users, MoreHorizontal } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface Job {
  id: string
  title: string
  status: 'active' | 'inactive' | 'draft'
  startDate: string
  salaryRange: {
    min: number
    max: number
  }
}

interface JobCardAdminProps {
  job: Job
  onManage: (jobId: string) => void
  onEdit: (job: Job) => void
  onToggleStatus: (jobId: string) => void
  onDelete: (jobId: string) => void
}

export function JobCardAdmin({ job, onManage, onEdit, onToggleStatus, onDelete }: JobCardAdminProps) {
  const [showActions, setShowActions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'danger'
      case 'draft':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <Badge variant={getStatusVariant(job.status)}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
          <span className="text-sm text-gray-500">started on {job.startDate}</span>
        </div>

        {/* Action Menu Button */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="p-1 h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {/* Action Dropdown */}
          {showActions && (
            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-20 min-w-[160px]">
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit(job)
                    setShowActions(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Job
                </button>

                <button
                  onClick={() => {
                    onToggleStatus(job.id)
                    setShowActions(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                </button>

                <button
                  onClick={() => {
                    onDelete(job.id)
                    setShowActions(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
        <p className="text-gray-600">
          {formatCurrency(job.salaryRange.min)} - {formatCurrency(job.salaryRange.max)}
        </p>
      </div>

      <Button
        onClick={() => onManage(job.id)}
        className="w-full"
        variant="primary"
      >
        <Users className="h-4 w-4 mr-2" />
        Manage Candidates
      </Button>
    </Card>
  )
}