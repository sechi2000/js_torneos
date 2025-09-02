import React, { useEffect, useRef, useState } from 'react'

type Node = { x: number; y: number; vx: number; vy: number }

const NODES = 80
const SPEED = 0.35
const LINK_DIST = 130
const MOUSE_PULL = 0.04
const HUE_SPEED = 0.12

function rand(min: number, max: number) { return Math.random() * (max - min) + min }

export default function Splash({ onEnter }: { onEnter: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const nodes = useRef<Node[]>([])
  const mouse = useRef({ x: -9999, y: -9999 })
  const hue = useRef(210)

  const [hoverBtn, setHoverBtn] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const dpr = Math.max(1, (window.devicePixelRatio || 1))
    const resize = () => {
      cvs.width = Math.floor(cvs.clientWidth * dpr)
      cvs.height = Math.floor(cvs.clientHeight * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    nodes.current = Array.from({ length: NODES }).map(() => ({
      x: rand(0, cvs.clientWidth),
      y: rand(0, cvs.clientHeight),
      vx: rand(-SPEED, SPEED),
      vy: rand(-SPEED, SPEED),
    }))

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = cvs.getBoundingClientRect()
      mouse.current.x = (clientX - rect.left) * dpr
      mouse.current.y = (clientY - rect.top) * dpr
    }
    const onMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY)
    const onLeave = () => { mouse.current.x = -9999; mouse.current.y = -9999 }
    const onTouchStart = (e: any) => {
      setIsTouch(true)
      const t = e.touches?.[0]
      if (t) updateMouse(t.clientX, t.clientY)
    }
    const onTouchMove = (e: any) => {
      const t = e.touches?.[0]
      if (t) updateMouse(t.clientX, t.clientY)
    }

    cvs.addEventListener('mousemove', onMove)
    cvs.addEventListener('mouseleave', onLeave)
    cvs.addEventListener('touchstart', onTouchStart, { passive: true } as any)
    cvs.addEventListener('touchmove', onTouchMove, { passive: true } as any)

    let raf = 0
    const tick = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      hue.current = (hue.current + HUE_SPEED) % 360
      const w = cvs.width, h = cvs.height
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, `hsl(${hue.current}, 75%, 9%)`)
      g.addColorStop(1, `hsl(${(hue.current + 70) % 360}, 75%, 12%)`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      const mx = mouse.current.x, my = mouse.current.y
      for (const n of nodes.current) {
        const dx = mx - n.x, dy = my - n.y
        const dist = Math.hypot(dx, dy)
        if (dist < 500) {
          n.vx += (dx / (dist || 1)) * MOUSE_PULL
          n.vy += (dy / (dist || 1)) * MOUSE_PULL
        }
        n.x += n.vx
        n.y += n.vy
        n.vx *= 0.995; n.vy *= 0.995
        if (n.x < 0) { n.x = 0; n.vx *= -1 }
        if (n.y < 0) { n.y = 0; n.vy *= -1 }
        if (n.x > w) { n.x = w; n.vx *= -1 }
        if (n.y > h) { n.y = h; n.vy *= -1 }
      }

      for (let i = 0; i < nodes.current.length; i++) {
        const a = nodes.current[i]
        ctx.beginPath()
        ctx.arc(a.x, a.y, 2.2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fill()

        for (let j = i + 1; j < nodes.current.length; j++) {
          const b = nodes.current[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d2 = dx*dx + dy*dy
          if (d2 < LINK_DIST * LINK_DIST) {
            const alpha = 1 - Math.sqrt(d2) / LINK_DIST
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.6})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      if (mx > 0 && my > 0) {
        const r = 70
        const radial = ctx.createRadialGradient(mx, my, 0, mx, my, r)
        radial.addColorStop(0, 'rgba(34,211,238,0.35)')
        radial.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.fillStyle = radial
        ctx.beginPath()
        ctx.arc(mx, my, r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ cursor: isTouch ? 'default' : 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="relative z-10 pointer-events-none select-none flex flex-col items-center justify-center text-center min-h-screen p-6">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          J & S Padel
        </h1>
        <p className="mt-3 text-white/80 max-w-xl">
          Conexiones, energía y ritmo. Entra y juega nuestros pozos.
        </p>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <button
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            onTouchStart={() => setHoverBtn(true)}
            onTouchEnd={() => setHoverBtn(false)}
            onClick={onEnter}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 text-white backdrop-blur px-7 py-3 text-sm shadow-lg transition"
            style={{ transform: hoverBtn ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)' }}
          >
            Entrar a la web
          </button>
        </div>
      </div>
    </div>
  )
}
