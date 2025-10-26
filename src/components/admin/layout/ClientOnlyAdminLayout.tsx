/**
 * Client-Only Admin Layout
 * 
 * This component handles the client-side layout logic including:
 * - Provider initialization (realtime, permissions, etc.)
 * - Mobile responsive layout management
 * - Sidebar collapse/expand state
 * - Error boundaries and performance monitoring
 */

'use client'

import { useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import AdminProviders from '@/components/admin/providers/AdminProviders'
import AdminHeader from '@/components/admin/layout/AdminHeader'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminFooter from '@/components/admin/layout/AdminFooter'
import { useSidebarCollapsed, useSidebarActions } from '@/stores/admin/layout.store.selectors'

interface ClientOnlyAdminLayoutProps {
  children: React.ReactNode
  session: any
}

export default function ClientOnlyAdminLayout({ children, session }: ClientOnlyAdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const sidebarCollapsed = useSidebarCollapsed()
  const { setCollapsed } = useSidebarActions()

  // Ensure client-side rendering to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Close mobile menu on initial mount or route changes (handled elsewhere)
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleSidebarToggle = () => {
    setCollapsed(!sidebarCollapsed)
  }

  if (!isClient) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <SessionProvider session={session}>
      <AdminProviders>
        <div className="min-h-screen bg-background relative">
          <a
            href="#admin-main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-card focus:text-blue-600 focus:ring-2 focus:ring-blue-600 focus:px-3 focus:py-2 focus:z-[60] rounded"
          >
            Skip to main content
          </a>

          {/* Desktop Sidebar - fixed, always rendered */}
          <AdminSidebar
            isCollapsed={sidebarCollapsed}
            isMobile={false}
          />

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden">
              <AdminSidebar
                isMobile={true}
                isOpen={isMobileMenuOpen}
                onClose={handleMobileMenuClose}
              />
            </div>
          )}

          {/* Main Content Area - bind spacing to unified sidebar state */}
          <div
            className={`hidden lg:flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            {/* Header */}
            <AdminHeader
              onMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
              onSidebarToggle={handleSidebarToggle}
            />

            {/* Main Content */}
            <main id="admin-main-content" tabIndex={-1} className="flex-1 relative overflow-hidden" role="main" aria-label="Admin dashboard content">
              <div className="h-full overflow-auto">
                {children}
              </div>
            </main>

            {/* Footer */}
            <AdminFooter sidebarCollapsed={sidebarCollapsed} />
          </div>

          {/* Mobile Main Content Area */}
          <div className="flex flex-col min-h-screen lg:hidden">
            {/* Header */}
            <AdminHeader
              onMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
              onSidebarToggle={handleSidebarToggle}
            />

            {/* Main Content */}
            <main id="admin-main-content" tabIndex={-1} className="flex-1 relative overflow-hidden" role="main" aria-label="Admin dashboard content">
              <div className="h-full overflow-auto">
                {children}
              </div>
            </main>

            {/* Footer */}
            <AdminFooter sidebarCollapsed={sidebarCollapsed} />
          </div>
        </div>
      </AdminProviders>
    </SessionProvider>
  )
}
