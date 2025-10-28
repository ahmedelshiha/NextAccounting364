import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'

// GET /api/services/[slug] - Get service by slug
const _api_GET = async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await context.params
    const service = await prisma.service.findFirst({
      where: {
        slug,
        status: 'ACTIVE'
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Increment views counter (best-effort)
    try {
      await prisma.service.update({ where: { id: service.id }, data: { views: { increment: 1 } } })
    } catch (err) {
      // ignore
    }

    return NextResponse.json(service, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

export const GET = withTenantContext(_api_GET, { requireAuth: false })

// PUT /api/services/[slug] - Update service (admin only)
export const PUT = withTenantContext(async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
  const { slug } = await context.params
  try {
    const body = await request.json()

    const {
      name,
      description,
      shortDesc,
      features,
      price,
      duration,
      category,
      featured,
      active,
      image
    } = body

    const existing = await prisma.service.findFirst({ where: { slug } })
    if (!existing) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const updated = await prisma.service.update({
      where: { id: existing.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(features && { features }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(category !== undefined && { category }),
        ...(featured !== undefined && { featured }),
        ...(active !== undefined && { active }),
        ...(image !== undefined && { image })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}, { requireAuth: true })

// DELETE /api/services/[slug] - Delete service (admin only)
export const DELETE = withTenantContext(async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await context.params
    // Soft delete by setting active to false
    const existing = await prisma.service.findFirst({ where: { slug } })
    if (!existing) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    await prisma.service.update({
      where: { id: existing.id },
      data: { active: false }
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}, { requireAuth: true })
