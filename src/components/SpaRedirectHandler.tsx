'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SpaRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('spa-redirect-path')
    if (redirectPath && redirectPath !== '/') {
      sessionStorage.removeItem('spa-redirect-path')
      router.replace(redirectPath)
    }
  }, [router])

  return null
}
