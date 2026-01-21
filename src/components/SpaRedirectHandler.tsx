'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function SpaRedirectHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('spa-redirect-path')

    // Only redirect if: path exists, not root, and we're not already there
    if (redirectPath && redirectPath !== '/' && pathname !== redirectPath) {
      sessionStorage.removeItem('spa-redirect-path')
      router.replace(redirectPath)
    } else if (redirectPath) {
      // Clear stale redirect path
      sessionStorage.removeItem('spa-redirect-path')
    }
  }, [router, pathname])

  return null
}
