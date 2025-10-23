import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = tenantFilter()

    const formats = await prisma.regionalFormat.findMany({
      where: { tenantId },
      orderBy: { languageCode: 'asc' },
    })

    return Response.json({
      success: true,
      data: formats.map(f => ({
        language: f.languageCode,
        dateFormat: f.dateFormat,
        timeFormat: f.timeFormat,
        currencyCode: f.currencyCode,
        currencySymbol: f.currencySymbol,
        numberFormat: f.numberFormat,
        decimalSeparator: f.decimalSeparator,
        thousandsSeparator: f.thousandsSeparator,
      })),
    })
  } catch (error: any) {
    console.error('Failed to get regional formats:', error)
    return Response.json({ error: error.message || 'Failed to get regional formats' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = tenantFilter()
    const body = await req.json()
    const { language, dateFormat, timeFormat, currencyCode, currencySymbol, numberFormat, decimalSeparator, thousandsSeparator } = body

    if (!language) {
      return Response.json({ error: 'Language code is required' }, { status: 400 })
    }

    const format = await prisma.regionalFormat.upsert({
      where: {
        tenantId_languageCode: {
          tenantId,
          languageCode: language,
        },
      },
      create: {
        tenantId,
        languageCode: language,
        dateFormat: dateFormat || 'MM/DD/YYYY',
        timeFormat: timeFormat || 'HH:MM',
        currencyCode: currencyCode || 'USD',
        currencySymbol: currencySymbol || '$',
        numberFormat: numberFormat || '#,##0.00',
        decimalSeparator: decimalSeparator || '.',
        thousandsSeparator: thousandsSeparator || ',',
      },
      update: {
        dateFormat: dateFormat || undefined,
        timeFormat: timeFormat || undefined,
        currencyCode: currencyCode || undefined,
        currencySymbol: currencySymbol || undefined,
        numberFormat: numberFormat || undefined,
        decimalSeparator: decimalSeparator || undefined,
        thousandsSeparator: thousandsSeparator || undefined,
      },
    })

    return Response.json({ success: true, data: format })
  } catch (error: any) {
    console.error('Failed to save regional format:', error)
    return Response.json({ error: error.message || 'Failed to save regional format' }, { status: 500 })
  }
}
