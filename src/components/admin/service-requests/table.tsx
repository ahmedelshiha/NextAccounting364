"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export interface ServiceRequestItem {
  id: string
  title: string
  status: 'DRAFT'|'SUBMITTED'|'IN_REVIEW'|'APPROVED'|'ASSIGNED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'
  priority: 'LOW'|'MEDIUM'|'HIGH'|'URGENT'
  client?: { id: string; name?: string | null; email?: string | null } | null
  service?: { id: string; name?: string | null; slug?: string | null; category?: string | null } | null
  assignedTeamMember?: { id: string; name?: string | null; email?: string | null } | null
  deadline?: string | null
  scheduledAt?: string | null
  createdAt?: string | null
  isBooking?: boolean | null
  bookingType?: 'STANDARD'|'RECURRING'|'EMERGENCY'|'CONSULTATION'|null
  paymentStatus?: 'UNPAID'|'INTENT'|'PAID'|'FAILED'|'REFUNDED'|null
  paymentSessionId?: string | null
  paymentAmountCents?: number | null
  paymentCurrency?: string | null
}

interface Props {
  items: ServiceRequestItem[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (checked: boolean) => void
  onOpen: (id: string) => void
}

function statusColor(s: ServiceRequestItem['status']) {
  switch (s) {
    case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ASSIGNED': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'IN_REVIEW': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'SUBMITTED': return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'DRAFT': default: return 'bg-muted text-muted-foreground border-gray-200'
  }
}

function priorityColor(p: ServiceRequestItem['priority']) {
  switch (p) {
    case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
    case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'LOW': return 'bg-muted text-muted-foreground border-gray-200'
    case 'MEDIUM': default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export default function ServiceRequestsTable({ items, selectedIds, onToggle, onToggleAll, onOpen }: Props) {
  const renderText = (v: any) => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string' || typeof v === 'number') return v
    if (typeof v === 'object') {
      if ('name' in v && typeof v.name === 'string') return v.name
      if ('title' in v && typeof v.title === 'string') return v.title
      try { return JSON.stringify(v) } catch { return String(v) }
    }
    return String(v)
  }

  const safeDate = (val: any) => {
    try {
      if (!val) return ''
      const d = new Date(val)
      if (isNaN(d.getTime())) return ''
      return d
    } catch { return '' }
  }
  const allSelected = items.length > 0 && items.every(i => selectedIds.has(i.id))

  return (
    <div className="border rounded-md overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input type="checkbox" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} aria-label="Select all" />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="hidden sm:table-cell">Scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="hidden md:table-cell">Payment</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="hidden sm:table-cell">Deadline</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id} className="hover:bg-background">
              <TableCell className="w-10">
                <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => onToggle(r.id)} aria-label={`Select ${r.title}`} />
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground truncate max-w-[280px]">{renderText(r.title)}</div>
                <div className="text-xs text-muted-foreground">{safeDate(r.createdAt) ? (safeDate(r.createdAt) as Date).toLocaleString() : ''}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">{renderText(r.client?.name) || renderText(r.client?.email) || '—'}</div>
                <div className="text-xs text-muted-foreground">{r.client?.email || ''}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">{renderText(r.service?.name) || '—'}</div>
                <div className="text-xs text-muted-foreground">{r.service?.category || ''}</div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {r.isBooking ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Appointment</Badge>
                    <span className="text-xs text-muted-foreground">{r.bookingType || 'STANDARD'}</span>
                  </div>
                ) : (
                  <span className="text-sm text-foreground">Request</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="text-sm text-foreground">{safeDate((r as any).scheduledAt) ? (safeDate((r as any).scheduledAt) as Date).toLocaleDateString() : '—'}</div>
                <div className="text-xs text-muted-foreground">{safeDate((r as any).scheduledAt) ? (safeDate((r as any).scheduledAt) as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </TableCell>
              <TableCell>
                <Badge className={statusColor(r.status)}>{r.status.replace('_',' ')}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {(() => {
                  const s = (r as any).paymentStatus as ServiceRequestItem['paymentStatus']
                  const amt = (r as any).paymentAmountCents as number | undefined
                  const cur = ((r as any).paymentCurrency as string | undefined) || 'USD'
                  const format = (cents?: number, curr?: string) => {
                    if (typeof cents !== 'number') return ''
                    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr || 'USD' }).format(cents / 100) } catch { return `$${(cents/100).toFixed(2)}` }
                  }
                  const label = s || 'UNPAID'
                  const cls = s === 'PAID'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : s === 'FAILED'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : s === 'REFUNDED'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-muted text-muted-foreground border-gray-200'
                  return (
                    <div className="flex items-center gap-2">
                      <Badge className={cls}>{label}</Badge>
                      {typeof amt === 'number' && (
                        <span className="text-xs text-muted-foreground">{format(amt, cur)}</span>
                      )}
                    </div>
                  )
                })()}
              </TableCell>
              <TableCell>
                <div className="text-sm text-foreground">{renderText(r.assignedTeamMember?.name) || 'Unassigned'}</div>
                <div className="text-xs text-muted-foreground">{renderText(r.assignedTeamMember?.email) || ''}</div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="text-sm text-foreground">{safeDate(r.deadline) ? (safeDate(r.deadline) as Date).toLocaleDateString() : '—'}</div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onOpen(r.id)} className="flex items-center gap-1">
                  View <ArrowRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-8">No service requests found.</div>
      )}
    </div>
  )
}
