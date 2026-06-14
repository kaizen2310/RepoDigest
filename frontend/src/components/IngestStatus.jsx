import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock3, Loader2, Ban } from "lucide-react"

const STATUS_META = {
  pending: {
    label: 'Queued',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  processing: {
    label: 'Indexing',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: Loader2,
    spin: true,
  },
  ready: {
    label: 'Chat ready',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Index failed',
    className: 'border-red-200 bg-red-50 text-red-700',
    icon: AlertCircle,
  },
  too_large: {
    label: 'Too large',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Ban,
  },
}

export default function IngestStatus({ status = 'pending', error }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const Icon = meta.icon

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={meta.className}>
        <Icon className={`mr-1 h-3.5 w-3.5 ${meta.spin ? 'animate-spin' : ''}`} />
        {meta.label}
      </Badge>
      {error && status === 'failed' && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  )
}