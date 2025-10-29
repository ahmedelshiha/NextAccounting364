'use client'

import React from 'react'
import Link from 'next/link'
import type { ActionItem, IconType } from '@/types/dashboard'
import { validateActionItem, devValidateProps } from '@/utils/actionItemValidator'

const ICON_CLASS = 'w-4 h-4'
const REACT_FORWARD_REF = typeof Symbol === 'function' ? Symbol.for('react.forward_ref') : null
const REACT_MEMO = typeof Symbol === 'function' ? Symbol.for('react.memo') : null

const mergeIconClass = (existing?: string) => [ICON_CLASS, existing].filter(Boolean).join(' ')

// Sanitize icon to a component reference if a React element was passed
const sanitizeIcon = (icon?: any) => {
  if (!icon) return icon
  if (React.isValidElement(icon) && (icon as any).type) return (icon as any).type
  return icon
}

// Helper to render icon (handles both IconType and ReactNode)
const renderIcon = (icon?: IconType | React.ReactNode) => {
  if (!icon) return null

  try {
    // If it's a function (IconType), render it as a component
    if (typeof icon === 'function') {
      const Icon = icon as IconType
      if (Icon && typeof Icon === 'function') {
        return <Icon className={ICON_CLASS} />
      }
    }

    // If it's a valid React element, clone to ensure we apply sizing styles consistently
    if (React.isValidElement(icon)) {
      const element = icon as React.ReactElement<{ className?: string }>
      return React.cloneElement(element, { className: mergeIconClass(element.props.className) })
    }

    // Handle forwardRef/memo exotic component wrappers
    if (icon && typeof icon === 'object' && '$$typeof' in (icon as any)) {
      const marker = (icon as any).$$typeof
      if ((marker === REACT_FORWARD_REF || marker === REACT_MEMO) && typeof (icon as any).render === 'function') {
        const ExoticIcon = icon as unknown as React.ComponentType<{ className?: string }>
        return React.createElement(ExoticIcon, { className: ICON_CLASS })
      }
    }

    // If it's a string or number, don't render it as an icon
    if (typeof icon === 'string' || typeof icon === 'number') {
      console.warn('PageHeader: String/number passed as icon, expected component or element:', icon)
      return null
    }

    // Log unexpected icon types for debugging and do NOT render invalid objects
    console.warn('PageHeader: Unexpected icon type:', {
      iconType: typeof icon,
      iconConstructor: (icon as any)?.constructor?.name,
      icon
    })

    // Fallback: do not render unrecognized icon types to avoid React error #31
    return null
  } catch (error) {
    console.error('PageHeader: Error rendering icon:', {
      error: error instanceof Error ? error.message : String(error),
      iconType: typeof icon,
      icon: icon
    })
    return null
  }
}

// Helper to render action button
const renderActionButton = (action: ActionItem, isPrimary: boolean = false) => {
  const baseClasses = "px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
  const primaryClasses = "text-white bg-green-600 hover:bg-green-700"
  const secondaryClasses = "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
  const classes = `${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses}`

  const content = (
    <>
      {renderIcon(action.icon)}
      {action.label}
    </>
  )

  // If href is provided, render as Link
  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {content}
      </Link>
    )
  }

  // Otherwise render as button with onClick
  return (
    <button onClick={action.onClick} className={classes} disabled={action.disabled}>
      {content}
    </button>
  )
}

export default function PageHeader({ title, subtitle, primaryAction, secondaryActions = [] }: { title: string; subtitle?: string; primaryAction?: ActionItem | ActionItem[]; secondaryActions?: ActionItem[] }) {
  // Normalize actions and sanitize icons
  const safePrimaryArray = Array.isArray(primaryAction) ? (primaryAction as ActionItem[]) : undefined
  const normalizedPrimary = (safePrimaryArray ? safePrimaryArray[0] : (primaryAction as ActionItem | undefined))
    ? { ...(safePrimaryArray ? safePrimaryArray[0] : (primaryAction as ActionItem)), icon: sanitizeIcon((safePrimaryArray ? safePrimaryArray[0] : (primaryAction as any))?.icon) }
    : undefined

  const normalizedSecondary = (Array.isArray(secondaryActions) ? secondaryActions : [])
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({ ...(a as ActionItem), icon: sanitizeIcon((a as any).icon) }))

  // Development-only validation (run against normalized values)
  React.useEffect(() => {
    devValidateProps({ primaryAction: normalizedPrimary, secondaryActions: normalizedSecondary }, 'PageHeader')

    if (normalizedPrimary) {
      const validation = validateActionItem(normalizedPrimary, 'PageHeader.primaryAction')
      if (!validation.isValid) {
        console.error('🚨 PageHeader: Invalid primaryAction:', validation.errors)
      }
    }

    normalizedSecondary.forEach((action, index) => {
      const validation = validateActionItem(action, `PageHeader.secondaryActions[${index}]`)
      if (!validation.isValid) {
        console.error(`🚨 PageHeader: Invalid secondaryAction[${index}]:`, validation.errors)
      }
    })
  }, [normalizedPrimary, normalizedSecondary])

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6 -mx-6 -mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {normalizedSecondary.map((action, i) => (
            <React.Fragment key={i}>
              {renderActionButton(action, false)}
            </React.Fragment>
          ))}
          {normalizedPrimary && renderActionButton(normalizedPrimary, true)}
        </div>
      </div>
    </div>
  )
}
