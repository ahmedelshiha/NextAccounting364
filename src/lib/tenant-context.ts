/* eslint-disable @typescript-eslint/no-require-imports */
// Use AsyncLocalStorage only on Node.js server. Avoid static import of 'async_hooks' which breaks Turbopack/browser builds.
let AsyncLocalStorageClass: any = undefined
if (typeof window === 'undefined') {
  try {
     
    // Allow runtime require here because async_hooks is Node-only and static import breaks Turbopack
    AsyncLocalStorageClass = require('async_hooks').AsyncLocalStorage
  } catch (err) {
    AsyncLocalStorageClass = undefined
  }
}

// Fallback polyfill when AsyncLocalStorage is not available (client or build environments).
if (!AsyncLocalStorageClass) {
  AsyncLocalStorageClass = class<T> {
    private _store: T | undefined = undefined

    run(store: T, callback: () => any) {
      // Support both synchronous and asynchronous callbacks. If the callback
      // returns a promise, ensure the store remains available until the promise
      // settles so async code can access the tenant context.
      this._store = store
      const clear = () => { this._store = undefined }
      try {
        const result = callback()
        if (result && typeof (result as any).then === 'function') {
          return (result as Promise<any>).then(
            (v) => { clear(); return v },
            (err) => { clear(); throw err }
          )
        }
        clear()
        return result
      } catch (err) {
        clear()
        throw err
      }
    }

    getStore() {
      return this._store
    }
  }
}

export interface TenantContext {
  tenantId: string | null
  tenantSlug?: string | null
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  role?: string | null
  tenantRole?: string | null
  isSuperAdmin?: boolean
  requestId?: string | null
  timestamp: Date
}

class TenantContextManager {
  private storage: any = new AsyncLocalStorageClass()

  run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback)
  }

  getContext(): TenantContext {
    const context = this.storage.getStore()
    if (!context) {
      throw new Error('Tenant context is not available on the current execution path')
    }
    return context
  }

  getContextOrNull(): TenantContext | null {
    return this.storage.getStore() ?? null
  }

  hasContext(): boolean {
    return this.storage.getStore() !== undefined
  }

  requireTenantId(): string {
    const { tenantId } = this.getContext()
    if (!tenantId) {
      throw new Error('Tenant context is missing tenant identifier')
    }
    return tenantId
  }

  getTenantId(): string | null {
    return this.storage.getStore()?.tenantId ?? null
  }

  isSuperAdmin(): boolean {
    return Boolean(this.storage.getStore()?.isSuperAdmin)
  }
}

export const tenantContext = new TenantContextManager()
