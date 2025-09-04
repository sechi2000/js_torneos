import React from 'react'
import { fetchCSV } from './utils/csv'

/* ─────────────────────────────────────────────────────────
   Tipos y configuración
   ───────────────────────────────────────────────────────── */
type Player = { id: string; name: string; level: string; club?: string; ig?: string; photo?: string }

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header'
const IG_URL   = 'https://www.instagram.com/js_torneos/'

const GALLERY: { src: string; alt: string }[] = [
  { src: `${import.meta.env.BASE_URL}public/carteles/pozo1.png`, alt: 'Pozo 1' },
  { src: 'https://images.unsplash.com/photo-1520975922192-24cd97bca3d5?q=80&auto=format&fit=crop', alt: 'Pozo 2' },
  { src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&auto=format&fit=crop', alt: 'Pozo 3' },
  { src: 'https://images.unsplash.com/photo-1552074280-9d5c3b0a3f6a?q=80&auto=format&fit=crop', alt: 'Pozo 4' },
  { src: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&auto=format&fit=crop', alt: 'Pozo 5' },
  { src: 'https://images.unsplash.com/photo-1530023367847-a683933f417f?q=80&auto=format&fit=crop', alt: 'Pozo 6' },
]


/* ─────────────────────────────────────────────────────────
   Hook: carga jugadores desde /public/players.csv
   ───────────────────────────────────────────────────────── */
function usePlayers() {
  const [players, setPlayers] = React.useState<Player[]>([])

  React.useEffect(() => {
    const load = async () => {
      try {
        // Lee el CSV empaquetado en /public
        const url = `${import.meta.env.BASE_URL}players.csv`
        const data = await fetchCSV(url)
        const mapped = data.map((r: any, idx: number): Player => ({
          id: r.id || String(idx),
          name: r.name || r.nombre || 'Jugador',
          level: r.level || r.nivel || '',
          club: r.club || '',
          ig: r.ig || r.instagram || '',
          photo: r.photo || r.foto || '',
        }))
        setPlayers(mapped)
      } catch (err) {
        console.error('Error cargando CSV', err)
        setPlayers([])
      }
    }
    load()
  }, [])

  return players
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

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
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
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block size-2 rounded-full bg-amber-400 animate-pulse" /> Próximo pozo: Fecha por confirmar
            </p>
          </div>
          <div className="rounded-3xl h-56 md:h-72 bg-gradient-to-br from-cyan-100 to-violet-100 border border-slate-200 shadow-inner" />
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
            <a key={i} href={g.src} target="_blank" className="group block rounded-2xl overflow-hidden border border-slate-200">
              <img src={g.src} alt={g.alt} className="w-full h-40 md:h-48 object-cover group-hover:scale-[1.02] transition" loading="lazy" />
            </a>
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
    return players.filter(p =>
      p.name.toLowerCase().includes(t) ||
      (p.level?.toLowerCase().includes(t)) ||
      (p.club?.toLowerCase().includes(t))
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
          {list.map(p => (
            <div key={p.id} className="rounded-2xl border border-slate-200 p-4 flex gap-3 items-center">
              <img src={p.photo || 'https://i.pravatar.cc/100'} alt={p.name} className="w-14 h-14 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{p.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {p.level}{p.club ? ` · ${p.club}` : ''}
                </div>
                {p.ig && (
                  <a href={`https://instagram.com/${p.ig.replace('@','')}`} target="_blank" className="text-xs text-cyan-600 hover:underline">
                    {p.ig}
                  </a>
                )}
              </div>
            </div>
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

  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <Jugadores players={players} />
      <Footer />
    </div>
  )
}
