import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react'

interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: 'submitted' | 'pending' | 'accepted' | 'rejected'
  showIcon?: boolean
}

const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, showIcon = true, ...props }, ref) => {
    const statusConfig = {
      submitted: {
        label: 'Submitted',
        icon: FileText,
        className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm shadow-blue-200/50',
      },
      pending: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-2 border-amber-300 shadow-sm shadow-amber-200/50',
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle2,
        className: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-2 border-emerald-300 shadow-sm shadow-emerald-200/50',
      },
      rejected: {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 border-2 border-rose-300 shadow-sm shadow-rose-200/50',
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105',
          config.className,
          status === 'accepted' && 'animate-glow-burst',
          className
        )}
        {...props}
      >
        {showIcon && <Icon className="h-3.5 w-3.5" />}
        <span>{config.label}</span>
      </div>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

export { StatusBadge }
