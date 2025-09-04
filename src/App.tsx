import React from 'react'
import { fetchCSV } from './utils/csv'

/* ╭─────────────────────────────────────────────────────────────╮
   │  Fondo con gradiente animado                                │
   ╰─────────────────────────────────────────────────────────────╯ */
function AnimatedGradientBackground() {
  return (
    <>
      <style>{`
        @keyframes jellyGradient {
          0%   { transform: translate3d(0,0,0) scale(1);   filter: hue-rotate(0deg); }
          50%  { transform: translate3d(0,-2%,0) scale(1.04); filter: hue-rotate(40deg); }
          100% { transform: translate3d(0,0,0) scale(1);   filter: hue-rotate(0deg); }
        }
      `}</style>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 opacity-[0.45]"
        style={{
          background:
            'radial-gradient(55% 60% at 10% 10%, rgba(59,130,246,.35) 0%, rgba(59,130,246,0) 60%), radial-gradient(60% 55% at 90% 15%, rgba(14,165,233,.35) 0%, rgba(14,165,233,0) 60%), radial-gradient(70% 60% at 50% 85%, rgba(167,139,250,.35) 0%, rgba(167,139,250,0) 60%)',
          animation: 'jellyGradient 16s ease-in-out infinite',
        }}
      />
    </>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Barra de progreso + Reveal                                 │
   ╰─────────────────────────────────────────────────────────────╯ */
function ScrollProgress() {
  const [p, setP] = React.useState(0)
  React.useEffect(() => {
    const f = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setP(max > 0 ? h.scrollTop / max : 0)
    }
    f()
    window.addEventListener('scroll', f, { passive: true })
    window.addEventListener('resize', f)
    return () => {
      window.removeEventListener('scroll', f)
      window.removeEventListener('resize', f)
    }
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width]"
        style={{ width: `${p * 100}%` }}
      />
    </div>
  )
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (e) => e.forEach((v) => v.isIntersecting && setShow(true)),
      { threshold: 0.12 }
    )
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out will-change-transform will-change-opacity ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Partículas suaves + Confetti controlado                    │
   ╰─────────────────────────────────────────────────────────────╯ */
function ParticleField() {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    let w = (c.width = c.offsetWidth)
    let h = (c.height = c.offsetHeight)
    const onResize = () => {
      w = c.width = c.offsetWidth
      h = c.height = c.offsetHeight
    }
    const P = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
    }))
    let raf = 0
    const loop = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of P) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(14,165,233,0.55)'
        ctx.fill()
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full opacity-35" />
}

function SectionConfetti({
  targetId = 'jugadores',
  durationMs = 2200,
}: {
  targetId?: string
  durationMs?: number
}) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const section = document.getElementById(targetId)
    const cvs = ref.current
    if (!section || !cvs) return

    const ctx = cvs.getContext('2d')!
    let w = (cvs.width = window.innerWidth)
    let h = (cvs.height = window.innerHeight)

    const onResize = () => {
      w = (cvs.width = window.innerWidth)
      h = (cvs.height = window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const parts = Array.from({ length: 90 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      c: `hsl(${Math.random() * 360},80%,60%)`,
      s: 5 + Math.random() * 3,
    }))

    let raf = 0
    const clearAll = () => {
      ctx.clearRect(0, 0, w, h)
      cvs.style.opacity = '0'
    }

    const play = () => {
      const t0 = performance.now()
      cvs.style.opacity = '1'
      const loop = (t: number) => {
        const elapsed = t - t0
        ctx.clearRect(0, 0, w, h)
        for (const p of parts) {
          p.x += p.vx
          p.y += p.vy
          if (p.y > h) {
            p.y = -20
            p.x = Math.random() * w
          }
          ctx.fillStyle = p.c
          ctx.fillRect(p.x, p.y, p.s, p.s)
        }
        if (elapsed < durationMs) {
          raf = requestAnimationFrame(loop)
        } else {
          clearAll()
        }
      }
      raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) play()
      },
      { threshold: 0.3 }
    )

    io.observe(section)
    return () => {
      window.removeEventListener('resize', onResize)
      io.disconnect()
      cancelAnimationFrame(raf)
      clearAll()
    }
  }, [targetId, durationMs])

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none z-40 opacity-0 transition-opacity duration-400"
    />
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Tipos / Config                                             │
   ╰─────────────────────────────────────────────────────────────╯ */
type Player = { id: string; name: string; level: string; club?: string; ig?: string; photo?: string }
type LBRow = { id: string; name: string; points: number; wins: number; matches?: number; ig?: string; photo?: string }

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header'
const IG_URL = 'https://www.instagram.com/js_torneos/'
const GALLERY: { src: string; alt: string }[] = [
  { src: `${import.meta.env.BASE_URL}carteles/pozo1.png`, alt: 'Pozo 1' },
]

/* ╭─────────────────────────────────────────────────────────────╮
   │  Data utils                                                 │
   ╰─────────────────────────────────────────────────────────────╯ */
function resolvePhoto(url?: string) {
  if (!url) return ''
  if (/^https?:/.test(url)) return url
  const clean = url.startsWith('/') ? url.slice(1) : url
  return `${import.meta.env.BASE_URL}${clean}`
}

function usePlayers() {
  const [p, setP] = React.useState<Player[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const d = await fetchCSV(`${import.meta.env.BASE_URL}players.csv`)
        setP(
          d.map((r: any, i: number) => ({
            id: r.id || String(i),
            name: r.name || 'Jugador',
            level: r.level || '',
            club: r.club || '',
            ig: r.ig || '',
            photo: r.photo || '',
          }))
        )
      } catch {
        setP([])
      }
    })()
  }, [])
  return p
}

function useLeaderboard() {
  const [r, setR] = React.useState<LBRow[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const d = await fetchCSV(`${import.meta.env.BASE_URL}leaderboard.csv`)
        const m = d.map((r: any, i: number) => ({
          id: r.id || String(i),
          name: r.name || 'Jugador',
          points: +r.points || 0,
          wins: +r.wins || 0,
          matches: +r.matches || undefined,
          ig: r.ig || '',
          photo: r.photo || '',
        }))
        m.sort((a, b) => b.points - a.points)
        setR(m)
      } catch {
        setR([])
      }
    })()
  }, [])
  return r
}

// mapa nombre→stats para cruzar con jugadores
function useLeaderboardMap() {
  const lb = useLeaderboard()
  return React.useMemo(() => {
    const map = new Map<string, LBRow>()
    for (const r of lb) map.set(r.name.trim().toLowerCase(), r)
    return map
  }, [lb])
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Cuenta atrás + Próximo Pozo                                │
   ╰─────────────────────────────────────────────────────────────╯ */
function useCountdown(targetISO: string) {
  const target = React.useMemo(() => new Date(targetISO).getTime(), [targetISO])
  const [ms, setMs] = React.useState(() => Math.max(0, target - Date.now()))
  React.useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, target - Date.now())), 1000)
    return () => clearInterval(id)
  }, [target])
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { d, h, m, s, done: ms <= 0 }
}

function NextPozoCard(props: {
  dateISO: string
  lugar: string
  precio?: string
  plazas?: string
  formUrl: string
  bgImageUrl?: string
}) {
  const c = useCountdown(props.dateISO)
  return (
    <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border border-slate-200 shadow-inner bg-gradient-to-br from-white/70 to-white/30">
      {props.bgImageUrl && (
        <img
          src={props.bgImageUrl}
          alt="Cartel pozo"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-transparent" />
      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Próximo pozo</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {new Date(props.dateISO).toLocaleString('es-ES', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="mt-1 text-sm text-slate-600">{props.lugar}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {props.precio && (
              <span className="rounded-full bg-white/80 px-2 py-1 border border-slate-200">💶 {props.precio}</span>
            )}
            {props.plazas && (
              <span className="rounded-full bg-white/80 px-2 py-1 border border-slate-200">👥 {props.plazas}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-slate-800 text-sm md:text-base">
            {c.done ? (
              <span className="text-emerald-600">¡En juego!</span>
            ) : (
              <span>
                {String(c.d).padStart(2, '0')}d:{String(c.h).padStart(2, '0')}h:
                {String(c.m).padStart(2, '0')}m:{String(c.s).padStart(2, '0')}s
              </span>
            )}
          </div>
          <a
            href={props.formUrl}
            target="_blank"
            className="rounded-xl bg-cyan-500 text-white text-xs md:text-sm px-3 py-2 hover:bg-cyan-600 transition"
          >
            Inscribirme
          </a>
        </div>
      </div>
    </div>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  UI base: Nav / Hero / Secciones                            │
   ╰─────────────────────────────────────────────────────────────╯ */
function MagneticButton({ href, children }: { href: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLAnchorElement>(null)
  React.useEffect(() => {
    const el = ref.current!
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`
    }
    const leave = () => (el.style.transform = 'translate(0,0)')
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
    }
  }, [])
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      className="rounded-2xl bg-cyan-500 px-4 py-2 text-white hover:bg-cyan-600 transition will-change-transform"
    >
      {children}
    </a>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 h-14 flex justify-between items-center">
        <a href="#" className="font-bold">J &amp; S Padel</a>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#inscripcion">Inscripción</a>
          <a href="#redes">Redes</a>
          <a href="#galeria">Galería</a>
          <a href="#ranking">Ranking</a>
          <a href="#hall">Hall of Fame</a>
          <a href="#jugadores">Jugadores</a>
        </nav>
        <MagneticButton href={FORM_URL}>Inscríbete</MagneticButton>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <Reveal>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Torneos tipo{' '}
              <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                POZO
              </span>
              <br /> rápidos, justos y divertidos
            </h1>
            <p className="mt-4 text-slate-600">
              Organizamos pozos rápidos y divertidos. Inscríbete y consulta perfiles de jugadores.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MagneticButton href={FORM_URL}>Abrir formulario</MagneticButton>
              <a
                href="#jugadores"
                className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition"
              >
                Ver jugadores
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border border-slate-200 shadow-inner">
            <ParticleField />
            <NextPozoCard
              dateISO="2025-09-15T10:00:00"
              lugar="Polideportivo Municipal"
              precio="12€ por jugador"
              plazas="16 plazas"
              formUrl={FORM_URL}
              bgImageUrl={`${import.meta.env.BASE_URL}carteles/pozo1.png`}
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Inscripcion() {
  return (
    <section id="inscripcion" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Inscripción</h2>
        <p className="text-slate-600 mt-2">Completa el formulario para confirmar tu plaza.</p>
        <a
          href={FORM_URL}
          target="_blank"
          className="mt-4 inline-block rounded-xl bg-cyan-500 text-white px-5 py-2.5 text-sm hover:bg-cyan-600 transition"
        >
          Abrir formulario
        </a>
      </div>
    </section>
  )
}

function Redes() {
  return (
    <section id="redes" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Redes</h2>
        <p className="text-slate-600 mt-2">Síguenos y etiqueta tus fotos del pozo 😊</p>
        <a
          href={IG_URL}
          target="_blank"
          className="mt-4 inline-block rounded-xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition"
        >
          Instagram
        </a>
      </div>
    </section>
  )
}

function Galeria() {
  return (
    <section id="galeria" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Galería</h2>
        <p className="text-slate-600 mt-2">Las mejores fotos de torneos anteriores.</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {GALLERY.map((g, i) => (
            <a key={i} href={g.src} target="_blank" className="group block rounded-2xl overflow-hidden border border-slate-200">
              <img src={g.src} alt={g.alt} loading="lazy" className="w-full h-40 md:h-48 object-cover group-hover:scale-[1.02] transition" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Feed de Instagram (estático por URLs en /public/ig.json)   │
   ╰─────────────────────────────────────────────────────────────╯ */
function IGFeedStatic() {
  const [urls, setUrls] = React.useState<string[]>([])
  React.useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}ig.json`)
      .then(r => r.json())
      .then((arr) => Array.isArray(arr) ? setUrls(arr.slice(0, 9)) : setUrls([]))
      .catch(() => setUrls([]))
  }, [])

  if (!urls.length) return null

  return (
    <section id="ig" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Mencionanos en Instagram</h2>
        <p className="text-slate-600 mt-2">Comparte la publicación con nosotros para aparecer aquí</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {urls.map((u, i) => (
            <iframe
              key={i}
              src={`https://www.instagram.com/embed?url=${encodeURIComponent(u)}`}
              className="w-full h-[520px] rounded-xl border border-slate-200 bg-white"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Ranking con medallas                                       │
   ╰─────────────────────────────────────────────────────────────╯ */
function Medal({ place }: { place: number }) {
  if (place === 1) return <span className="text-2xl drop-shadow-sm">🥇</span>
  if (place === 2) return <span className="text-2xl drop-shadow-sm">🥈</span>
  if (place === 3) return <span className="text-2xl drop-shadow-sm">🥉</span>
  return null
}

function Leaderboard() {
  const rows = useLeaderboard()
  const max = Math.max(1, ...rows.map((r) => r.points))
  return (
    <section id="ranking" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Ranking</h2>
        <div className="mt-6 space-y-3">
          {rows.map((r, i) => {
            const top = i < 3
            return (
              <div
                key={r.id}
                className={`p-3 border rounded-xl flex items-center gap-3 ${
                  top ? 'border-amber-300/60 bg-amber-50/30' : ''
                }`}
                style={top ? { boxShadow: '0 0 0 2px rgba(251,191,36,.25) inset' } : undefined}
              >
                <div className="w-7 text-slate-500 flex items-center justify-center">
                  <Medal place={i + 1} />
                </div>
                <img
                  src={resolvePhoto(r.photo) || 'https://i.pravatar.cc/100'}
                  className={`w-10 h-10 rounded-full ${top ? 'ring-2 ring-amber-300' : ''}`}
                />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="tabular-nums">{r.points} pts</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full ${top ? 'bg-amber-400' : 'bg-cyan-500'} rounded-full`}
                      style={{ width: `${(r.points / max) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {!rows.length && <p className="text-sm text-slate-500">Cargando ranking…</p>}
        </div>
      </div>
    </section>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  Hall of Fame (ligado al ranking)                           │
   ╰─────────────────────────────────────────────────────────────╯ */
function HallOfFame() {
  const rows = useLeaderboard()
  const top = rows.slice(0, 3)
  if (!top.length) return null

  return (
    <section id="hall" className="border-t border-slate-200">
      <style>{`
        .shine { position: relative; overflow: hidden; }
        .shine::after {
          content: ""; position: absolute; inset: -50%;
          background: linear-gradient(120deg, transparent 40%, rgba(255,255,255,.35), transparent 60%);
          transform: rotate(25deg) translateX(-100%);
          animation: shineMove 3.5s linear infinite;
        }
        @keyframes shineMove {
          0% { transform: rotate(25deg) translateX(-120%); }
          100% { transform: rotate(25deg) translateX(120%); }
        }
      `}</style>
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Hall of Fame</h2>
        <p className="text-slate-600 mt-2">Los más grandes del pozo 🏆</p>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {top.map((r, i) => (
            <div
              key={r.id}
              className="rounded-3xl p-5 border bg-white relative shine"
              style={{ boxShadow: '0 0 0 3px rgba(251,191,36,.25) inset' }}
            >
              <div className="absolute -top-3 -left-3 text-3xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="flex items-center gap-4">
                <img
                  src={resolvePhoto(r.photo) || 'https://i.pravatar.cc/120'}
                  className="w-16 h-16 rounded-full ring-2 ring-amber-300 object-cover"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{r.name}</div>
                  <div className="text-xs text-slate-500">Puntos: <b>{r.points}</b> · Victorias: <b>{r.wins}</b></div>
                  {r.ig && (
                    <a
                      href={`https://instagram.com/${r.ig.replace('@','')}`}
                      target="_blank"
                      className="text-xs text-amber-600 hover:underline"
                    >
                      {r.ig}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  FlipCard para jugadores (frontal + stats detrás)           │
   ╰─────────────────────────────────────────────────────────────╯ */
function FlipCard({ front, back }: { front: React.ReactNode; back: React.ReactNode }) {
  return (
    <div className="group perspective">
      <style>{`
        .perspective { perspective: 1000px; }
        .card3d { transform-style: preserve-3d; transition: transform .5s; }
        .group:hover .card3d { transform: rotateY(180deg); }
        .face { backface-visibility: hidden; }
        .back { transform: rotateY(180deg); }
      `}</style>
      <div className="card3d relative">
        <div className="face">
          {front}
        </div>
        <div className="face back absolute inset-0">
          {back}
        </div>
      </div>
    </div>
  )
}

function Jugadores({ players }: { players: Player[] }) {
  const [q, setQ] = React.useState('')
  const lbMap = useLeaderboardMap()

  const list = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = players.map((p) => {
      const stats = lbMap.get(p.name.trim().toLowerCase())
      return { ...p, stats }
    })
    if (!t) return base
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        (p.level || '').toLowerCase().includes(t) ||
        (p.club || '').toLowerCase().includes(t)
    )
  }, [q, players, lbMap])

  return (
    <section id="jugadores" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Jugadores</h2>
            <p className="text-slate-600 mt-2">Pasa el ratón por encima para ver estadísticas ✨</p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-48 md:w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {list.map((p) => (
            <FlipCard
              key={p.id}
              front={
                <div className="rounded-2xl border border-slate-200 p-4 flex gap-3 items-center bg-white">
                  <img
                    src={resolvePhoto(p.photo) || 'https://i.pravatar.cc/100'}
                    alt={p.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {p.level}{p.club ? ` · ${p.club}` : ''}
                    </div>
                    {p.ig && (
                      <a
                        href={`https://instagram.com/${p.ig.replace('@', '')}`}
                        target="_blank"
                        className="text-xs text-cyan-600 hover:underline"
                      >
                        {p.ig}
                      </a>
                    )}
                  </div>
                </div>
              }
              back={
                <div className="rounded-2xl border border-slate-200 p-4 bg-white h-full flex items-center">
                  {p.stats ? (
                    <div className="w-full">
                      <div className="text-sm font-semibold text-slate-900 mb-2">{p.name}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <div className="text-slate-400">Puntos</div>
                          <div className="font-bold text-slate-800">{p.stats.points}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <div className="text-slate-400">Victorias</div>
                          <div className="font-bold text-slate-800">{p.stats.wins}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2 text-center">
                          <div className="text-slate-400">Partidos</div>
                          <div className="font-bold text-slate-800">{p.stats.matches ?? '—'}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">Sin estadísticas aún</div>
                  )}
                </div>
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-10 text-xs text-slate-500">
        © {new Date().getFullYear()} J &amp; S Padel — Pozo.
      </div>
    </footer>
  )
}

/* ╭─────────────────────────────────────────────────────────────╮
   │  App                                                        │
   ╰─────────────────────────────────────────────────────────────╯ */
export default function App() {
  const players = usePlayers()
  return (
    <div className="bg-white text-slate-900">
      <AnimatedGradientBackground />
      <ScrollProgress />
      <SectionConfetti targetId="jugadores" />
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <IGFeedStatic />   {/* usa /public/ig.json */}
      <Leaderboard />
      <HallOfFame />
      <Jugadores players={players} />
      <Footer />
    </div>
  )
}
