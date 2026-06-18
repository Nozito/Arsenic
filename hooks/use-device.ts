'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

export function useIsLowPerformance() {
  const [isLow, setIsLow] = useState(false)

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4
    setIsLow(cores <= 2 || mem <= 2)
  }, [])

  return isLow
}
