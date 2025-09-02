import React, { useEffect, useRef, useState } from 'react'

const BALL_COUNT = 16
const BALL_MIN_R = 8
const BALL_MAX_R = 16
const SPEED = 1.0

function rand(min: number, max: number) { return Math.random() * (max - min) + min }

const POP_BASE64 =
  'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAAACAAAC4AAAClbW1tcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export default function Splash({ onEnter }: { onEnter: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null)
  const [hoverBtn, setHoverBtn] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const mouse = useRef({ x: -9999, y: -9999 })
  const balls = useRef<{ x: number; y: number; r: number; vx: number; vy: number }[]>([])
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
    const base = popRef.current
    if (!base) return
    const a = base.cloneNode(true) as HTMLAudioElement
    a.volume = 0.35
    void a.play().catch(() => {})
  }

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const resize = () => {
      cvs.width = Math.floor(cvs.clientWidth * dpr)
      cvs.height = Math.floor(cvs.clientHeight * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

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

    const onTouchStart = (e: TouchEvent) => {
      setIsTouch(true)
      const t = e.touches[0]
      if (t) updateMouse(t.clientX, t.clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) updateMouse(t.clientX, t.clientY)
    }

    cvs.addEventListener('mousemove', onMove)
    cvs.addEventListener('mouseleave', onLeave)
    cvs.addEventListener('touchstart', onTouchStart, { passive: true })
    cvs.addEventListener('touchmove', onTouchMove, { passive: true })

    let raf = 0
    const ctx = cvs.getContext('2d')!

    const tick = () => {
      ctx.resetTransform()
      ctx.scale(dpr, dpr)

      // ==== FONDO PISTA DE PÁDEL ====
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
      // ==============================

      const paddleR = 30
      const { x: mx, y: my } = mouse.current
