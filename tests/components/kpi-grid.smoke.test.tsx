// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@/test-mocks/testing-library-react'
import { describe, it, expect, vi } from 'vitest'
import ProfessionalKPIGrid from '@/components/dashboard/analytics/ProfessionalKPIGrid'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }))

describe('ProfessionalKPIGrid smoke', () => {
  it('renders KPI titles and values', () => {
    render(
      <ProfessionalKPIGrid
        stats={{
          revenue: { current: 123456, target: 200000, targetProgress: 61.7, trend: 3.2 },
          bookings: { total: 42, today: 3, pending: 2, conversion: 12.5 },
          clients: { active: 120, new: 5, retention: 85.2, satisfaction: 4.3 },
          tasks: { productivity: 76.5, completed: 12, overdue: 1, dueToday: 0 }
        }}
      />
    )

    const text = document.body.textContent || ''
    expect(text).toContain('Key Performance Indicators')
    expect(text).toMatch(/Revenue Performance|Booking Performance|Client Metrics|Task Management/)
  })
})
