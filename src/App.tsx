import React from 'react'

/* ─────────────────────────────────────────────────────────
   Utils
   ───────────────────────────────────────────────────────── */
type Player = { id: string; name: string; level: string; club?: string; ig?: string; photo?: string; rating?: number }

// Rutas seguras (admite http/https o rutas dentro de /public)
function resolvePublic(pathOrUrl?: string) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const clean = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl
  return `${import.meta.env.BASE_URL}${clean}`
}

// Cuenta atrás simple
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
   Config básica
   ───────────────────────────────────────────────────────── */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header'
const IG_URL = 'https://www.instagram.com/js_torneos/'

// Galería (puedes añadir más)
const GALLERY: { src: string; alt: string }[] = [
  { src: `${import.meta.env.BASE_URL}carteles/pozo1.png`, alt: 'Pozo 1' },
]

/* ─────────────────────────────────────────────────────────
   Datos: CSV + IG JSON
   ───────────────────────────────────────────────────────── */
// Lee /public/players.csv (id,name,level,club,ig,photo,rating)
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
          // CSV simple (no comillas escapadas). Si necesitas comillas, avísame y lo pasamos a un parser robusto.
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

// Lee /public/ig.json (array de objetos {img, alt, href})
type IGItem = { img: string; alt?: string; href?: string }
function useIGFeed() {
  const [items, setItems] = React.useState<IGItem[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const url = `${import.meta.env.BASE_URL}ig.json`
        const data = await (await fetch(url)).json()
        // normaliza rutas locales
        setItems(
          (Array.isArray(data) ? data : []).map((it: IGItem) => ({
            img: resolvePublic(it.img),
            alt: it.alt || 'Instagram',
            href: it.href,
          }))
        )
      } catch (e) {
        console.warn('Sin ig.json o con formato inválido. Ocultando feed.', e)
        setItems([])
      }
    })()
  }, [])
  return items
}

/* ─────────────────────────────────────────────────────────
   UI
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
        <a
          href={FORM_URL}
          target="_blank"
          className="rounded-xl bg-cyan-500 text-white text-sm px-3 py-2 hover:bg-cyan-600 transition"
        >
          Inscríbete
        </a>
      </div>
    </header>
  )
}

/** Partículas suaves que se desvanecen (no quedan pegadas) */
function Particles({ count = 60 }) {
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
          0% { transform: translateY(-10px); opacity: .8; }
          90% { opacity: .05; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// Tarjeta “Próximo pozo” (con imagen y countdown)
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
      {/* Wings de luz */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-400/30 blur-3xl rounded-full animate-ping" />
      {/* Imagen cartel */}
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
          <div className="mt-1 text-lg font-semibold text-slate-900 drop-shadow-[0_0_10px_rgba(59,130,246,0.35)]">
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
            {props.precio && <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">{props.precio}</span>}
            {props.plazas && <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">{props.plazas}</span>}
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

function Hero() {
  return (
    <section className="relative">
      <Particles count={70} />
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 drop-shadow-[0_0_10px_rgba(59,130,246,0.35)]">
              Torneos tipo <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">POZO</span>
              <br /> rápidos, justos y divertidos
            </h1>
            <p className="mt-4 text-slate-600">
              Organizamos pozos de ~2h en instalaciones municipales. Inscríbete, ve fotos y consulta perfiles de jugadores.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={FORM_URL}
                target="_blank"
                className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm hover:-translate-y-0.5 transition"
              >
                Abrir formulario
              </a>
              <a
                href="#jugadores"
                className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition"
              >
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
            <a key={i} href={resolvePublic(g.src)} target="_blank" className="group block rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={resolvePublic(g.src)}
                alt={g.alt}
                loading="lazy"
                className="w-full h-40 md:h-48 object-cover group-hover:scale-[1.02] transition"
              />
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
        <p className="text-slate-600 mt-2">Top 10 (ordenado por rating).</p>

        <ol className="mt-6 space-y-3">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className={`rounded-2xl border p-4 flex items-center gap-3 ${
                i < 3 ? 'border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.45)]' : 'border-slate-200'
              }`}
            >
              <span className="w-8 text-center text-slate-500">{i + 1}</span>
              <img
                src={resolvePublic(p.photo) || 'https://i.pravatar.cc/100'}
                className="w-10 h-10 rounded-full object-cover"
              />
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
            <div
              key={p.id}
              className="relative rounded-2xl border border-yellow-400 p-4 overflow-hidden group
                         shadow-[0_0_25px_rgba(255,215,0,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                <img
                  src={resolvePublic(p.photo) || 'https://i.pravatar.cc/100'}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-yellow-400"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {p.level}{p.club ? ` · ${p.club}` : ''} · Rating {p.rating?.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* dorado animado en hover */}
              <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition pointer-events-none
                              bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.25),transparent_60%)]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Jugadores({ players }: { players: Player[] }) {
  const [q, setQ] = React.useState('')
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

  return (
    <section id="jugadores" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Jugadores</h2>
            <p className="text-slate-600 mt-2">Busca por nombre, nivel o club.</p>
          </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="w-48 md:w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400"
        />
        </div>

        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {list.map((p) => {
            const top = (p.rating ?? 0) >= 90 || p.level?.toLowerCase() === 'avanzado'
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 flex gap-3 items-center border relative overflow-hidden
                  ${top ? 'border-yellow-400 shadow-[0_0_18px_rgba(255,215,0,0.45)]' : 'border-slate-200'}`}
              >
                <img
                  src={resolvePublic(p.photo) || 'https://i.pravatar.cc/100'}
                  alt={p.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {p.level}{p.club ? ` · ${p.club}` : ''}{typeof p.rating === 'number' ? ` · ${p.rating.toFixed(0)}` : ''}
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
            )
          })}
        </div>
      </div>
    </section>
  )
}

function InstagramFeed() {
  const items = useIGFeed()
  if (!items.length) return null
  return (
    <section id="ig" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Menciónanos en Instagram</h2>
        <p className="text-slate-600 mt-2">Comparte la publicación con nosotros para aparecer aquí.</p>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it, i) => {
            const card = (
              <div className="group block rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={it.img}
                  alt={it.alt || 'Instagram'}
                  className="w-full h-56 object-cover group-hover:scale-[1.02] transition"
                  loading="lazy"
                />
              </div>
            )
            return it.href ? (
              <a key={i} href={it.href} target="_blank" rel="noreferrer">{card}</a>
            ) : (
              <div key={i}>{card}</div>
            )
          })}
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
  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <Ranking players={players} />
      <HallOfFame players={players} />
      <Jugadores players={players} />
      <InstagramFeed />
      <Footer />
    </div>
  )
}