import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const roles = await prisma.customRole.findMany({
      where: {
        tenantId: ctx.tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(roles)
  } catch (err) {
    console.error('GET /api/admin/roles error', err)
    return NextResponse.json({ error: 'Failed to list roles' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { name, description, permissions } = body || {}

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: 'At least one permission must be assigned' }, { status: 400 })
    }

    // Check if role name already exists for this tenant
    const existing = await prisma.customRole.findFirst({
      where: {
        name,
        tenantId: ctx.tenantId,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
    }

    const newRole = await prisma.customRole.create({
      data: {
        name,
        description,
        permissions,
        tenantId: ctx.tenantId,
        createdBy: ctx.userId ?? undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
      },
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/roles error', err)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
})
