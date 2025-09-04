import React from 'react'

/* ─────────────────────────────────────────────────────────
   Config / flags
   ───────────────────────────────────────────────────────── */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header'
const IG_URL = 'https://www.instagram.com/js_torneos/'
const SHOW_IG = false // ← déjalo en false para evitar “roturas”. Si quieres probar el feed, pon true.

/* ─────────────────────────────────────────────────────────
   Tipos + utilidades
   ───────────────────────────────────────────────────────── */
type Player = {
  id: string
  name: string
  level: string
  club?: string
  ig?: string
  photo?: string
  rating?: number
}

type Match = {
  id: string
  date: string   // ISO o texto corto
  p1: string     // player id
  p2: string     // player id
  score?: string // “6-4, 3-6, 10-8”
  winner?: string // player id
}

function resolvePublic(pathOrUrl?: string) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const clean = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl
  return `${import.meta.env.BASE_URL}${clean}`
}

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

/* ─────────────────────────────────────────────────────────
   Datos (CSV en /public)
   ───────────────────────────────────────────────────────── */
// players.csv  -> id,name,level,club,ig,photo,rating
function usePlayers() {
  const [players, setPlayers] = React.useState<Player[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const url = `${import.meta.env.BASE_URL}players.csv`
        const txt = await (await fetch(url)).text()
        const rows = txt.trim().split(/\r?\n/)
        const headers = rows[0].split(',').map((h) => h.trim())
        const data = rows.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim())
          const rec: Record<string, string> = {}
          headers.forEach((h, i) => (rec[h] = cols[i] ?? ''))
          const rating = rec.rating ? Number(rec.rating) : undefined
          return {
            id: rec.id || crypto.randomUUID(),
            name: rec.name || 'Jugador',
            level: rec.level || '',
            club: rec.club || '',
            ig: rec.ig || '',
            photo: rec.photo || '',
            rating,
          } as Player
        })
        setPlayers(data)
      } catch (e) {
        console.error('Error leyendo players.csv', e)
        setPlayers([])
      }
    })()
  }, [])
  return players
}

// matches.csv -> id,date,p1,p2,score,winner
function useMatches() {
  const [matches, setMatches] = React.useState<Match[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const url = `${import.meta.env.BASE_URL}matches.csv`
        const resp = await fetch(url)
        if (!resp.ok) return setMatches([]) // si no existe, seguimos sin fallar
        const txt = await resp.text()
        const rows = txt.trim().split(/\r?\n/)
        const headers = rows[0].split(',').map((h) => h.trim())
        const data = rows.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim())
          const rec: Record<string, string> = {}
          headers.forEach((h, i) => (rec[h] = cols[i] ?? ''))
          return {
            id: rec.id || crypto.randomUUID(),
            date: rec.date || '',
            p1: rec.p1 || '',
            p2: rec.p2 || '',
            score: rec.score || '',
            winner: rec.winner || '',
          } as Match
        })
        // ordena por fecha descendente si hay ISO
        data.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
        setMatches(data)
      } catch (e) {
        console.warn('matches.csv no encontrado (opcional).', e)
        setMatches([])
      }
    })()
  }, [])
  return matches
}

/* ─────────────────────────────────────────────────────────
   UI base
   ───────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur bg-white/70 border-b border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="#" className="font-semibold text-slate-800">J &amp; S Padel</a>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#inscripcion" className="text-slate-600 hover:text-slate-900">Inscripción</a>
          <a href="#redes" className="text-slate-600 hover:text-slate-900">Redes</a>
          <a href="#galeria" className="text-slate-600 hover:text-slate-900">Galería</a>
          <a href="#ranking" className="text-slate-600 hover:text-slate-900">Ranking</a>
          <a href="#hof" className="text-slate-600 hover:text-slate-900">Hall of Fame</a>
          <a href="#jugadores" className="text-slate-600 hover:text-slate-900">Jugadores</a>
        </nav>
        <a href={FORM_URL} target="_blank"
           className="rounded-xl bg-cyan-500 text-white text-sm px-3 py-2 hover:bg-cyan-600 transition">
          Inscríbete
        </a>
      </div>
    </header>
  )
}

/** Partículas que caen y se desvanecen (no se quedan fijas) */
function Particles({ count = 70 }) {
  const arr = React.useMemo(() => Array.from({ length: count }, (_, i) => i), [count])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {arr.map((i) => {
        const left = Math.random() * 100
        const duration = 8 + Math.random() * 10
        const size = 2 + Math.random() * 4
        const delay = Math.random() * 6
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              animation: `fall ${duration}s linear ${delay}s infinite`,
              width: size,
              height: size,
            }}
            className="absolute top-[-10px] rounded-full bg-cyan-500/60"
          />
        )
      })}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10px); opacity:.8 }
          90% { opacity:.05 }
          100% { transform: translateY(110vh); opacity:0 }
        }
      `}</style>
    </div>
  )
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
    <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border border-slate-200 shadow-inner">
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-400/30 blur-3xl rounded-full animate-ping" />
      {props.bgImageUrl && (
        <img
          src={resolvePublic(props.bgImageUrl)}
          alt="Cartel pozo"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-transparent" />
      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Próximo pozo</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {new Date(props.dateISO).toLocaleString('es-ES', {
              weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </div>
          <div className="mt-1 text-sm text-slate-600">{props.lugar}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {props.precio && <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">{props.precio}</span>}
            {props.plazas && <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">{props.plazas}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-slate-800 text-sm md:text-base">
            {c.done ? '¡En juego!' : `${String(c.d).padStart(2,'0')}d:${String(c.h).padStart(2,'0')}h:${String(c.m).padStart(2,'0')}m:${String(c.s).padStart(2,'0')}s`}
          </div>
          <a href={props.formUrl} target="_blank"
             className="rounded-xl bg-cyan-500 text-white text-xs md:text-sm px-3 py-2 hover:bg-cyan-600 transition">
            Inscribirme
          </a>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative">
      <Particles count={70} />
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Torneos tipo <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">POZO</span>
              <br /> rápidos, justos y divertidos
            </h1>
            <p className="mt-4 text-slate-600">
              Pozos de ~2h en instalaciones municipales. Inscríbete, ve fotos y consulta perfiles de jugadores.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={FORM_URL} target="_blank"
                 className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm hover:-translate-y-0.5 transition">
                Abrir formulario
              </a>
              <a href="#jugadores"
                 className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition">
                Ver jugadores
              </a>
            </div>
          </div>

          <NextPozoCard
            dateISO="2025-09-15T10:00:00"
            lugar="Polideportivo Municipal"
            precio="12€ por jugador"
            plazas="16 plazas"
            formUrl={FORM_URL}
            bgImageUrl={`carteles/pozo1.png`}
          />
        </div>
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
        <a href={FORM_URL} target="_blank"
           className="mt-4 inline-block rounded-xl bg-cyan-500 text-white px-5 py-2.5 text-sm hover:bg-cyan-600 transition">
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
        <a href={IG_URL} target="_blank"
           className="mt-4 inline-block rounded-xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition">
          Instagram
        </a>
      </div>
    </section>
  )
}

const GALLERY = [
  { src: `carteles/pozo1.png`, alt: 'Pozo 1' },
]

function Galeria() {
  return (
    <section id="galeria" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Galería</h2>
        <p className="text-slate-600 mt-2">Las mejores fotos de torneos anteriores.</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {GALLERY.map((g, i) => (
            <a key={i} href={resolvePublic(g.src)} target="_blank"
               className="group block rounded-2xl overflow-hidden border border-slate-200">
              <img src={resolvePublic(g.src)} alt={g.alt}
                   className="w-full h-40 md:h-48 object-cover group-hover:scale-[1.02] transition"
                   loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Ranking({ players }: { players: Player[] }) {
  const ranked = React.useMemo(
    () =>
      [...players]
        .filter((p) => typeof p.rating === 'number')
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 10),
    [players]
  )
  if (!ranked.length) return null
  return (
    <section id="ranking" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Ranking</h2>
        <p className="text-slate-600 mt-2">Top 10 por rating.</p>
        <ol className="mt-6 space-y-3">
          {ranked.map((p, i) => (
            <li key={p.id}
                className={`rounded-2xl border p-4 flex items-center gap-3 ${
                  i < 3 ? 'border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.45)]' : 'border-slate-200'
                }`}>
              <span className="w-8 text-center text-slate-500">{i + 1}</span>
              <img src={resolvePublic(p.photo) || 'https://i.pravatar.cc/100'}
                   className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{p.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {p.level}{p.club ? ` · ${p.club}` : ''}
                </div>
              </div>
              <div className="font-mono text-sm">{p.rating?.toFixed(0) ?? '-'}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function HallOfFame({ players }: { players: Player[] }) {
  const hof = React.useMemo(
    () => [...players].filter((p) => (p.rating ?? 0) >= 90).slice(0, 8),
    [players]
  )
  if (!hof.length) return null
  return (
    <section id="hof" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Hall of Fame</h2>
        <p className="text-slate-600 mt-2">Jugadores legendarios del pozo.</p>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {hof.map((p) => (
            <div key={p.id}
                 className="relative rounded-2xl border border-yellow-400 p-4 overflow-hidden group
                            shadow-[0_0_25px_rgba(255,215,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                <img src={resolvePublic(p.photo) || 'https://i.pravatar.cc/100'}
                     className="w-12 h-12 rounded-full object-cover ring-2 ring-yellow-400" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {p.level}{p.club ? ` · ${p.club}` : ''} · Rating {p.rating?.toFixed(0)}
                  </div>
                </div>
              </div>
              <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition pointer-events-none
                              bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.25),transparent_60%)]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Tarjeta con flip (frontal datos; reverso últimos 3 partidos) */
function Jugadores({ players, matches }: { players: Player[]; matches: Match[] }) {
  const [q, setQ] = React.useState('')
  const byId = React.useMemo(() => new Map(players.map(p => [p.id, p])), [players])

  const list = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return players
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        (p.level || '').toLowerCase().includes(t) ||
        (p.club || '').toLowerCase().includes(t)
    )
  }, [q, players])

  const lastMatchesFor = React.useCallback((pid: string) => {
    const ms = matches.filter(m => m.p1 === pid || m.p2 === pid).slice(0, 3)
    return ms.map(m => {
      const oppId = m.p1 === pid ? m.p2 : m.p1
      const opp = byId.get(oppId)?.name || '—'
      const res = m.winner ? (m.winner === pid ? 'W' : 'L') : ''
      return { ...m, opp, res }
    })
  }, [matches, byId])

  return (
    <section id="jugadores" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Jugadores</h2>
            <p className="text-slate-600 mt-2">Pasa el ratón (o toca) para ver sus últimos partidos.</p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="w-48 md:w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* CSS del flip */}
        <style>{`
          .flip {
            perspective: 1000px;
          }
          .flip-inner {
            transform-style: preserve-3d;
            transition: transform .6s;
          }
          .flip:hover .flip-inner,
          .flip:focus-within .flip-inner {
            transform: rotateY(180deg);
          }
          .flip-face {
            backface-visibility: hidden;
          }
          .flip-back {
            transform: rotateY(180deg);
          }
        `}</style>

        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {list.map((p) => {
            const top = (p.rating ?? 0) >= 90 || p.level?.toLowerCase() === 'avanzado'
            const last3 = lastMatchesFor(p.id)
            return (
              <div key={p.id} className={`flip rounded-2xl border ${top ? 'border-yellow-400 shadow-[0_0_18px_rgba(255,215,0,0.45)]' : 'border-slate-200'}`}>
                <div className="flip-inner relative p-4 min-h-[140px]">
                  {/* Front */}
                  <div className="flip-face absolute inset-0 p-4 flex gap-3 items-center">
                    <img src={resolvePublic(p.photo) || 'https://i.pravatar.cc/100'}
                         alt={p.name}
                         className="w-14 h-14 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {p.level}{p.club ? ` · ${p.club}` : ''}{typeof p.rating === 'number' ? ` · ${p.rating.toFixed(0)}` : ''}
                      </div>
                      {p.ig && (
                        <a href={`https://instagram.com/${p.ig.replace('@','')}`} target="_blank"
                           className="text-xs text-cyan-600 hover:underline">{p.ig}</a>
                      )}
                    </div>
                  </div>
                  {/* Back */}
                  <div className="flip-face flip-back absolute inset-0 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Partidos recientes</div>
                    {last3.length ? (
                      <ul className="space-y-1">
                        {last3.map(m => (
                          <li key={m.id} className="text-xs text-slate-600">
                            <span className={m.res === 'W' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                              {m.res || '·'}
                            </span>{' '}
                            vs {m.opp} {m.score ? `· ${m.score}` : ''}{m.date ? ` · ${new Date(m.date).toLocaleDateString('es-ES')}` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-slate-500">Sin registros aún.</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* (Opcional) Feed IG – desactivado por defecto */
function InstagramFeed() {
  const [items, setItems] = React.useState<{img:string; alt?:string; href?:string}[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const url = `${import.meta.env.BASE_URL}ig.json`
        const resp = await fetch(url)
        if (!resp.ok) return
        const data = await resp.json()
        setItems((Array.isArray(data) ? data : []).map(it => ({
          img: resolvePublic(it.img), alt: it.alt || 'Instagram', href: it.href
        })))
      } catch {}
    })()
  }, [])
  if (!items.length) return null
  return (
    <section id="ig" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Menciónanos en Instagram</h2>
        <p className="text-slate-600 mt-2">Comparte con el hashtag y/o menciona la cuenta.</p>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it, i) => (
            it.href ? (
              <a key={i} href={it.href} target="_blank" rel="noreferrer"
                 className="group block rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={it.img} alt={it.alt} className="w-full h-56 object-cover group-hover:scale-[1.02] transition" />
              </a>
            ) : (
              <div key={i} className="group block rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={it.img} alt={it.alt} className="w-full h-56 object-cover group-hover:scale-[1.02] transition" />
              </div>
            )
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

/* ─────────────────────────────────────────────────────────
   App
   ───────────────────────────────────────────────────────── */
export default function App() {
  const players = usePlayers()
  const matches = useMatches()

  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <Ranking players={players} />
      <HallOfFame players={players} />
      <Jugadores players={players} matches={matches} />
      {SHOW_IG && <InstagramFeed />}
      <Footer />
    </div>
  )
}