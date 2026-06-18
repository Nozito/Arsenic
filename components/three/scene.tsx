'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function useIsLowEnd() {
  const [lowEnd, setLowEnd] = useState(true)
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection
    const slow = conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g'
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    setLowEnd(cores <= 2 || slow || isMobile)
  }, [])
  return lowEnd
}

/*
 * Icosaèdre ivoire très discret — rotation ultra lente, flottement minimal.
 * Ton ivoire neutre pour s'intégrer dans le fond clair.
 */
function FloatingMesh({ paused }: { paused: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    if (paused || !meshRef.current) return
    t.current += delta * 0.15  // plus lent
    meshRef.current.rotation.y = t.current * 0.10
    meshRef.current.rotation.x = Math.sin(t.current * 0.08) * 0.05
    meshRef.current.position.y = Math.sin(t.current * 0.25) * 0.06
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#d4cfc6"   /* ivoire/stone neutre, presque invisible */
        roughness={0.85}
        metalness={0.02}
        flatShading
        transparent
        opacity={0.55}
      />
    </mesh>
  )
}

interface SceneProps {
  className?: string
}

export function AmbientScene({ className }: SceneProps) {
  const reducedMotion = useReducedMotion()
  const lowEnd = useIsLowEnd()

  if (lowEnd) return null

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1]}
        gl={{
          antialias: false,
          powerPreference: 'low-power',
          alpha: true,
        }}
        camera={{ position: [0, 0, 3.5], fov: 42 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 2]} intensity={0.6} color="#f6f4ef" />
        <directionalLight position={[-2, -1, -1]} intensity={0.15} color="#e8f0eb" />
        <FloatingMesh paused={reducedMotion} />
      </Canvas>
    </div>
  )
}
