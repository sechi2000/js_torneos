import React, { useEffect, useRef, useState } from 'react'

const BALL_COUNT = 16
const BALL_MIN_R = 8
const BALL_MAX_R = 16
const SPEED = 1.0

function rand(min: number, max: number) { return Math.random() * (max - min) + min }

const POP_BASE64 =
  'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAAACAAAC4AAAClbW1tcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

type Ball = { x: number; y: number; r: number; vx: number; vy: number }

export default function Splash({ onEnter }: { onEnter: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [hoverBtn, setHoverBtn] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const mouse = useRef({ x: -9999, y: -9999 })
  const balls = useRef<Ball[]>([])
  const popRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = '/paddle.svg'
    img.onload = () => setLoadedImg(img)
    const a = new Audio(POP_BASE64)
    a.preload = 'auto'
    popRef.current = a
  }, [])

  const playPop = () => {
    try {
      const base = popRef.current
      if (!base) return
      const a = base.cloneNode(true) as HTMLAudioElement
      a.volume = 0.35
      void a.play()
    } catch {}
  }

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

    // bolas iniciales
    balls.current = Array.from({ length: BALL_COUNT }).map(() => ({
      x: rand(60, cvs.clientWidth - 60),
      y: rand(60, cvs.clientHeight - 60),
      r: rand(BALL_MIN_R, BALL_MAX_R),
      vx: rand(-SPEED, SPEED),
      vy: rand(-SPEED, SPEED),
    }))

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = cvs.getBoundingClientRect()
      mouse.current.x = (clientX - rect.left)
      mouse.current.y = (clientY - rect.top)
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
      // set transform
      ;(ctx as any).resetTransform?.()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // ===== Fondo: pista de pádel =====
      ctx.clearRect(0, 0, cvs.clientWidth, cvs.clientHeight)
      ctx.fillStyle = '#15803d' // verde césped
      ctx.fillRect(0, 0, cvs.clientWidth, cvs.clientHeight)

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.strokeRect(40, 40, cvs.clientWidth - 80, cvs.clientHeight - 80)
      ctx.beginPath()
      ctx.moveTo(cvs.clientWidth / 2, 40)
      ctx.lineTo(cvs.clientWidth / 2, cvs.clientHeight - 40)
      ctx.stroke()
      // =================================

      const paddleR = 30
      const { x: mx, y: my } = mouse.current

      // físicas
      for (const b of balls.current) {
        b.x += b.vx
        b.y += b.vy
        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -1 }
        if (b.x + b.r > cvs.clientWidth) { b.x = cvs.clientWidth - b.r; b.vx *= -1 }
        if (b.y - b.r < 0) { b.y = b.r; b.vy *= -1 }
        if (b.y + b.r > cvs.clientHeight) { b.y = cvs.clientHeight - b.r; b.vy *= -1 }

        // colisión con pala
        const dx = b.x - mx
        const dy = b.y - my
        const dist = Math.hypot(dx, dy)
        if (dist < b.r + paddleR) {
          const nx = dx / (dist || 1)
          const ny = dy / (dist || 1)
          const push = 2.6
          b.vx = nx * push + rand(-0.25, 0.25)
          b.vy = ny * push + rand(-0.25, 0.25)
          const overlap = (b.r + paddleR) - dist
          if (overlap > 0) { b.x += nx * overlap; b.y += ny * overlap }
          playPop()
          try { (navigator as any).vibrate?.(8) } catch {}
        }
        b.vx *= 0.995; b.vy *= 0.995
      }

      // pelotas
      for (const b of balls.current) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = '#fde047'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = '#facc15'
        ctx.stroke()
      }

      // pala
      if (loadedImg && (mx > 0 && my > 0)) {
        const w = 64, h = 64
        ctx.save()
        const scale = hoverBtn ? 1.08 : 1
        ctx.translate(mx, my)
        ctx.scale(scale, scale)
        ctx.drawImage(loadedImg, -w/2, -h/2, w, h)
        ctx.restore()
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('resize', resize)
      cvs.removeEventListener('mousemove', onMove)
      cvs.removeEventListener('mouseleave', onLeave)
      cvs.removeEventListener('touchstart', onTouchStart as any)
      cvs.removeEventListener('touchmove', onTouchMove as any)
      cancelAnimationFrame(raf)
    }
  }, [loadedImg, hoverBtn])

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ cursor: isTouch ? 'default' : 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block"/>
      <div className="relative z-10 pointer-events-none select-none flex flex-col items-center justify-center text-center min-h-screen p-6">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          J & S Padel
        </h1>
        <p className="mt-3 text-white/90 max-w-xl">Mueve la pala (ratón o dedo) y juega con las pelotas. ¡Luego entra a la web!</p>
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <button
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            onTouchStart={() => setHoverBtn(true)}
            onTouchEnd={() => setHoverBtn(false)}
            onClick={onEnter}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-white bg-white/90 backdrop-blur px-7 py-3 text-sm shadow transition"
            style={{ transform: hoverBtn ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)' }}
          >
            Entrar a la web
          </button>
        </div>
      </div>
    </div>
  )
}
