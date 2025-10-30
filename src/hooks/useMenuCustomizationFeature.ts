/**
 * Menu Customization Feature Hook
 *
 * Hook to check if menu customization feature is enabled
 * for the current user/session
 */

import { useSession } from 'next-auth/react'
import {
  isMenuCustomizationEnabled,
  isMenuCustomizationEnabledForUser,
} from '@/lib/menu/featureFlag'

export const useMenuCustomizationFeature = () => {
  const { data: session } = useSession()

  const isEnabled = isMenuCustomizationEnabled()
  const userId = (session?.user as any)?.id
  const role = (session?.user as any)?.role as string | undefined

  // If session isn't fully hydrated on first render, allow admin/staff roles to access the modal
  const isEnabledForCurrentUser = (() => {
    if (!isEnabled) return false
    if (userId) return isMenuCustomizationEnabledForUser(userId)
    // Fallback to role-based check for better UX during session loading
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'TEAM_LEAD', 'STAFF']
    try {
      const { hasRole } = await import('@/lib/permissions')
      return Boolean(role && hasRole(role, adminRoles))
    } catch {
      return Boolean(role && adminRoles.includes(role))
    }
  })()

  return {
    isEnabled,
    isEnabledForCurrentUser,
    userId,
  }
}
