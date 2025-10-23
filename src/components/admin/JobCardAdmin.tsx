import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
}

export function JobCardAdmin({ job, onManage }: JobCardAdminProps) {
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
        Manage Job
      </Button>
    </Card>
  )
}