import { useEffect, useRef } from 'react'
import { animate, createScope, stagger } from 'animejs'

interface AmbientMotionProps {
  variant?: 'visitor' | 'admin' | 'login'
}

const PARTICLES = Array.from({ length: 7 }, (_, index) => index)

export default function AmbientMotion({ variant = 'visitor' }: AmbientMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const scope = createScope({ root }).add(() => {
      animate('.ambient-orb-a', {
        translateX: ['-7%', '9%'],
        translateY: ['-4%', '11%'],
        scale: [0.96, 1.08],
        duration: 9200,
        loop: true,
        alternate: true,
        ease: 'inOutSine',
      })
      animate('.ambient-orb-b', {
        translateX: ['8%', '-10%'],
        translateY: ['5%', '-7%'],
        scale: [1.04, 0.92],
        duration: 11400,
        loop: true,
        alternate: true,
        ease: 'inOutSine',
      })
      animate('.ambient-particle', {
        translateY: [0, -18, 0],
        opacity: [0.18, 0.55, 0.18],
        scale: [0.88, 1.06, 0.88],
        delay: stagger(210),
        duration: 4800,
        loop: true,
        ease: 'inOutSine',
      })
    })

    return () => scope.revert()
  }, [])

  return (
    <div ref={rootRef} className={`ambient-motion ambient-${variant}`} aria-hidden="true">
      <span className="ambient-grid" />
      <span className="ambient-orb ambient-orb-a" />
      <span className="ambient-orb ambient-orb-b" />
      {PARTICLES.map((particle) => (
        <span key={particle} className={`ambient-particle particle-${particle + 1}`} />
      ))}
    </div>
  )
}
