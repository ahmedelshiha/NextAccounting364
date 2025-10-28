import { NextRequest, NextResponse } from 'next/server'
let sql: any = null

export type PostRow = {
  id: string
  slug: string
  title: string
  content: string | null
  excerpt: string | null
  published: boolean
  featured: boolean
  tags: string[] | null
  readTime: number | null
  coverImage: string | null
  views: number | null
  authorId: string | null
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | Date | null
  createdAt: string | Date
  updatedAt?: string | Date
}

const _api_GET = async (request: NextRequest) => {
  try {
    if (!sql) {
      try {
        const mod = await import('@netlify/neon')
        sql = mod.neon()
      } catch (e) {
        console.warn('Neon client not initialized (NETLIFY_DATABASE_URL missing?):', e)
        // return empty array rather than failing the build in preview contexts
        return NextResponse.json([], { status: 200 })
      }
    }

    const { searchParams } = new URL(request.url)
    const publishedParam = searchParams.get('published')
    const featuredParam = searchParams.get('featured')
    const limitParam = searchParams.get('limit')

    const limit = Math.max(1, Math.min(parseInt(limitParam || '20', 10) || 20, 100))
    const published = publishedParam === null ? null : publishedParam === 'true'
    const featured = featuredParam === null ? null : featuredParam === 'true'

    let rows: PostRow[] = [] as PostRow[]
    if (published !== null && featured !== null) {
      rows = (await sql`SELECT * FROM "Post" WHERE published = ${published} AND featured = ${featured} ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`) as unknown as PostRow[]
    } else if (published !== null) {
      rows = (await sql`SELECT * FROM "Post" WHERE published = ${published} ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`) as unknown as PostRow[]
    } else if (featured !== null) {
      rows = (await sql`SELECT * FROM "Post" WHERE featured = ${featured} ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`) as unknown as PostRow[]
    } else {
      rows = (await sql`SELECT * FROM "Post" ORDER BY "publishedAt" DESC NULLS LAST LIMIT ${limit}`) as unknown as PostRow[]
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Neon GET /api/neon/posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

import { withTenantContext } from '@/lib/api-wrapper'
export const GET = withTenantContext(_api_GET, { requireAuth: false })
