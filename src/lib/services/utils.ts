import { Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import type { ServiceFormData } from '@/types/services'

export function generateSlug(name: string): string {
  const slug = String(name)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')

  return slug || 'service'
}

export function getDemoServices() {
  const now = new Date().toISOString()
  return [
    {
      id: '1',
      name: 'Bookkeeping',
      slug: 'bookkeeping',
      description: 'Monthly bookkeeping and reconciliations',
      shortDesc: 'Monthly bookkeeping and reconciliations',
      features: [],
      price: 299,
      duration: 60,
      category: 'Accounting',
      featured: true,
      active: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      name: 'Tax Preparation',
      slug: 'tax-preparation',
      description: 'Personal and business tax filings',
      shortDesc: 'Personal and business tax filings',
      features: [],
      price: 450,
      duration: 90,
      category: 'Tax',
      featured: true,
      active: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '3',
      name: 'Payroll Management',
      slug: 'payroll',
      description: 'Payroll processing and compliance',
      shortDesc: 'Payroll processing and compliance',
      features: [],
      price: 199,
      duration: 45,
      category: 'Payroll',
      featured: false,
      active: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '4',
      name: 'CFO Advisory Services',
      slug: 'cfo-advisory',
      description: 'Strategic financial guidance',
      shortDesc: 'Strategic financial guidance',
      features: [],
      price: 1200,
      duration: 120,
      category: 'Advisory',
      featured: true,
      active: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export function getDemoServicesList(filters: {
  search?: string
  category?: string
  featured?: string
  status?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const list = getDemoServices()
  let items = filterServices(list, filters)
  const safeSortBy = ['name', 'createdAt', 'updatedAt', 'price'].includes(filters.sortBy || '')
    ? (filters.sortBy as string)
    : 'updatedAt'
  items = sortServices(items as any, safeSortBy, (filters.sortOrder || 'desc') as any) as any
  const limit = Math.max(1, Math.min(200, Number(filters.limit ?? items.length)))
  const offset = Math.max(0, Number(filters.offset ?? 0))
  const total = items.length
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return { services: items.slice(offset, offset + limit), total, page, limit, totalPages }
}

export async function validateSlugUniqueness(
  slug: string,
  tenantId: string | null,
  excludeServiceId?: string
): Promise<void> {
  const where: Prisma.ServiceWhereInput = { slug }
  if (tenantId) {
    where.tenantId = tenantId
  }
  if (excludeServiceId) {
    where.id = { not: excludeServiceId }
  }
  const existing = await prisma.service.findFirst({ where })
  if (existing) {
    throw new Error('A service with this slug already exists')
  }
}

export function sanitizeServiceData(data: Partial<ServiceFormData>): Partial<ServiceFormData> {
  const out: Partial<ServiceFormData> = {}

  if (data.name !== undefined) out.name = String(data.name).trim()

  if (data.slug !== undefined) {
    const s = String(data.slug).trim().toLowerCase()
    out.slug = s
  }

  if (data.description !== undefined) out.description = String(data.description).trim()

  if (data.shortDesc !== undefined) {
    const v = String(data.shortDesc ?? '').trim()
    out.shortDesc = v || undefined
  }

  if (data.category !== undefined) {
    const v = String(data.category ?? '').trim()
    out.category = v || undefined
  }

  if (data.price !== undefined) {
    out.price = data.price === null ? null : Number(data.price)
  }

  if (data.basePrice !== undefined) {
    out.basePrice = data.basePrice === null ? null : Number(data.basePrice)
  }

  if (data.duration !== undefined) {
    out.duration = data.duration === null ? null : Math.floor(Number(data.duration))
  }

  if (data.estimatedDurationHours !== undefined) {
    out.estimatedDurationHours = data.estimatedDurationHours === null ? null : Number(data.estimatedDurationHours)
  }

  if (data.features !== undefined) {
    const arr = Array.isArray(data.features) ? data.features : []
    out.features = arr.map((f) => String(f).trim()).filter(Boolean).slice(0, 50)
  }

  if (data.requiredSkills !== undefined) {
    const arr = Array.isArray(data.requiredSkills) ? data.requiredSkills : []
    out.requiredSkills = arr.map((f) => String(f).trim()).filter(Boolean)
  }

  if (data.featured !== undefined) out.featured = Boolean(data.featured)
  if (data.active !== undefined) out.active = Boolean(data.active)

  if (data.image !== undefined) {
    const v = data.image ? String(data.image).trim() : ''
    out.image = v || undefined
  }

  if (data.bookingEnabled !== undefined) out.bookingEnabled = Boolean(data.bookingEnabled)
  if (data.advanceBookingDays !== undefined) {
    out.advanceBookingDays = data.advanceBookingDays === null ? null : Math.max(0, Number(data.advanceBookingDays))
  }
  if (data.minAdvanceHours !== undefined) {
    out.minAdvanceHours = data.minAdvanceHours === null ? null : Math.max(0, Number(data.minAdvanceHours))
  }
  if (data.maxDailyBookings !== undefined) {
    out.maxDailyBookings = data.maxDailyBookings === null ? null : Math.max(0, Number(data.maxDailyBookings))
  }
  if (data.bufferTime !== undefined) {
    out.bufferTime = data.bufferTime === null ? null : Math.max(0, Number(data.bufferTime))
  }
  if (data.businessHours !== undefined) {
    out.businessHours = data.businessHours ?? null
  }
  if (data.blackoutDates !== undefined) {
    out.blackoutDates = Array.isArray(data.blackoutDates) ? data.blackoutDates : []
  }

  if (data.serviceSettings !== undefined) {
    out.serviceSettings = data.serviceSettings ?? null
  }

  return out
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return 'Not specified'
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  return h ? `${d}d ${h}h` : `${d}d`
}

export function formatPrice(price: number | null, currency = 'USD'): string {
  if (price == null) return 'Contact for pricing'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price)
}

export function extractCategories(services: any[]): string[] {
  const set = new Set<string>()
  services.forEach((s) => {
    if (s.category && String(s.category).trim()) set.add(String(s.category).trim())
  })
  return Array.from(set).sort()
}

export function sortServices<T extends any[]>(services: T, sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): T {
  const sorted = [...services].sort((a: any, b: any) => {
    const order = sortOrder === 'asc' ? 1 : -1
    const by = sortBy
    let av: any
    let bv: any

    if (by === 'name') {
      av = a.name?.toLowerCase() || ''
      bv = b.name?.toLowerCase() || ''
    } else if (by === 'price') {
      av = a.price ?? 0
      bv = b.price ?? 0
    } else if (by === 'createdAt' || by === 'updatedAt') {
      av = new Date(a[by]).getTime()
      bv = new Date(b[by]).getTime()
    } else if (by === 'bookings') {
      av = a._count?.bookings ?? 0
      bv = b._count?.bookings ?? 0
    } else {
      return 0
    }

    if (av < bv) return -1 * order
    if (av > bv) return 1 * order
    return 0
  })

  return sorted as T
}

export function filterServices(services: any[], filters: any) {
  return services.filter((s) => {
    if (filters.search) {
      const q = String(filters.search).toLowerCase()
      const text = [s.name, s.slug, s.shortDesc, s.description, s.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!text.includes(q)) return false
    }

    const status = String(s.status ?? '').toLowerCase()
    const isActive = s.active ?? status === 'active'

    if (filters.status === 'active' && !isActive) return false
    if (filters.status === 'inactive' && isActive) return false
    if (filters.status === 'draft' && status !== 'draft') return false

    if (filters.featured === 'featured' && !s.featured) return false
    if (filters.featured === 'non-featured' && s.featured) return false

    if (filters.category && filters.category !== 'all' && s.category !== filters.category) return false

    if (filters.minPrice != null || filters.maxPrice != null) {
      const p = Number(s.price ?? 0)
      if (filters.minPrice != null && p < Number(filters.minPrice)) return false
      if (filters.maxPrice != null && p > Number(filters.maxPrice)) return false
    }

    return true
  })
}

export function validateBulkAction(action: string, ids: string[], value?: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!ids || ids.length === 0) errors.push('At least one service must be selected')

  if (action === 'category' && !(typeof value === 'string' && value.trim())) {
    errors.push('Category name is required')
  }

  if (action === 'price-update') {
    const v = Number(value)
    if (!Number.isFinite(v) || v < 0) errors.push('Valid price is required')
  }

  return { isValid: errors.length === 0, errors }
}
