import React, { useEffect, useMemo, useState } from 'react'

type Player = {
  id: string
  name: string
  photo?: string
  level: string
  club?: string
  ig?: string
  stats: {
    pozosJugados: number
    victorias: number
    juegosGanados: number
    juegosPerdidos: number
  }
}

const IG_HANDLE = 'https://instagram.com/j_and_s_padel' // ⬅️ cambia por tu IG real
const INSCRIPCION_LINK = 'https://forms.gle/tu-formulario' // ⬅️ pega aquí tu Google Form

const GALLERY: { url: string; title: string; date?: string }[] = [
  { url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b', title: 'Finales Pozo 01', date: '2025-08-20' },
  { url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2', title: 'Partidos Mixtos', date: '2025-08-20' },
  { url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b', title: 'Entrega de Premios', date: '2025-08-20' },
]

const PLAYERS_SAMPLE: Player[] = [
  {
    id: 'p1',
    name: 'Alejandro Sechi',
    photo: 'https://i.pravatar.cc/200?img=5',
    level: '3.5',
    club: 'Municipal Centro',
    ig: 'https://instagram.com/ale_sechi',
    stats: { pozosJugados: 6, victorias: 3, juegosGanados: 46, juegosPerdidos: 39 },
  },
  {
    id: 'p2',
    name: 'Julia',
    photo: 'https://i.pravatar.cc/200?img=15',
    level: '3.0',
    club: 'Municipal Norte',
    ig: 'https://instagram.com/julia',
    stats: { pozosJugados: 5, victorias: 2, juegosGanados: 40, juegosPerdidos: 35 },
  },
  {
    id: 'p3',
    name: 'María',
    photo: 'https://i.pravatar.cc/200?img=31',
    level: '3.0',
    club: 'Municipal Centro',
    ig: 'https://instagram.com/maria',
    stats: { pozosJugados: 4, victorias: 2, juegosGanados: 32, juegosPerdidos: 28 },
  },
]

function downloadImage(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = url.split('/').pop() || 'foto.jpg'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function formatPct(a: number, b: number) {
  if (a + b === 0) return '—'
  return `${Math.round((a / (a + b)) * 100)}%`
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>(PLAYERS_SAMPLE)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.club && p.club.toLowerCase().includes(q)) ||
      p.level.toLowerCase().includes(q) ||
      (p.ig && p.ig.toLowerCase().includes(q))
    )
  }, [players, query])

  async function onImport(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const text = await file.text()
    try {
      if (ext === 'json') {
        const arr = JSON.parse(text)
        if (Array.isArray(arr)) setPlayers(arr)
      } else if (ext === 'csv') {
        // CSV: id,name,photo,level,club,ig,pozosJugados,victorias,juegosGanados,juegosPerdidos
        const rows = text.split(/\r?\n/).filter(Boolean)
        const out: Player[] = []
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',')
          if (cols.length < 10) continue
          out.push({
            id: cols[0],
            name: cols[1],
            photo: cols[2] || undefined,
            level: cols[3],
            club: cols[4] || undefined,
            ig: cols[5] || undefined,
            stats: {
              pozosJugados: Number(cols[6] || 0),
              victorias: Number(cols[7] || 0),
              juegosGanados: Number(cols[8] || 0),
              juegosPerdidos: Number(cols[9] || 0),
            },
          })
        }
        if (out.length) setPlayers(out)
      }
    } catch {
      alert('Archivo no válido. Asegúrate de usar el esquema indicado.')
    }
  }

  useEffect(() => {
    document.title = 'J & S Padel — Pozo'
  }, [])

  return (
    <div className="min-h-screen text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="container h-16 flex items-center justify-between">
          <a href="#hero" className="font-semibold tracking-tight">J &amp; S Padel</a>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#inscripcion" className="hover:underline">Inscripción</a>
            <a href="#redes" className="hover:underline">Redes</a>
            <a href="#galeria" className="hover:underline">Galería</a>
            <a href="#jugadores" className="hover:underline">Jugadores</a>
          </nav>
          <a className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 text-white px-4 py-2 text-sm"
             href={INSCRIPCION_LINK} target="_blank" rel="noreferrer">Inscríbete</a>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" className="py-16 md:py-24">
        <div className="container grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Torneos tipo <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">POZO</span> — rápidos, justos y divertidos
            </h1>
            <p className="mt-4 text-slate-600 max-w-prose">
              Organizamos pozos de ~2h en instalaciones deportivas municipales. Inscríbete, ve fotos y consulta perfiles de jugadores.
            </p>
            <div className="mt-6 flex gap-3">
              <a className="rounded-2xl bg-cyan-500 text-white px-5 py-3 text-sm" href={INSCRIPCION_LINK} target="_blank" rel="noreferrer">Formulario</a>
              <a className="rounded-2xl border border-slate-300 px-5 py-3 text-sm" href="#jugadores">Ver jugadores</a>
            </div>
            <div className="mt-4 inline-block rounded-full border px-3 py-1 text-xs text-slate-600">Próximo pozo: Fecha por confirmar</div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-cyan-100 via-violet-100 to-blue-100 border flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V8a2 2 0 0 0-2-2h-2.6a2 2 0 0 0-1.8 1.1L12 10H7a2 2 0 0 0-2 2v3h16z" stroke="currentColor"/>
                <path d="M3 15h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z" stroke="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* INSCRIPCION */}
      <section id="inscripcion" className="py-14 md:py-20 bg-white">
        <div className="container">
          <div className="rounded-2xl border p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Inscripción</h2>
                <p className="text-slate-600 text-sm">Completa el formulario para confirmar tu plaza.</p>
              </div>
              <a className="rounded-2xl bg-cyan-500 text-white px-4 py-2 text-sm" href={INSCRIPCION_LINK} target="_blank" rel="noreferrer">Abrir formulario</a>
            </div>
          </div>
        </div>
      </section>

      {/* REDES */}
      <section id="redes" className="py-14 md:py-20">
        <div className="container grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border p-6">
            <h3 className="text-xl font-medium">Instagram</h3>
            <p className="text-slate-600 text-sm">@j_and_s_padel</p>
            <a className="mt-4 inline-block rounded-2xl border px-4 py-2 text-sm" href={IG_HANDLE} target="_blank" rel="noreferrer">Ir a Instagram</a>
          </div>
          <div className="rounded-2xl border p-6">
            <h3 className="text-xl font-medium">WhatsApp</h3>
            <p className="text-slate-600 text-sm">Escríbenos para cualquier duda</p>
            <a className="mt-4 inline-block rounded-2xl border px-4 py-2 text-sm" href="https://wa.me/0000000000" target="_blank" rel="noreferrer">Abrir WhatsApp</a>
          </div>
        </div>
      </section>

      {/* GALERIA */}
      <section id="galeria" className="py-14 md:py-20 bg-white">
        <div className="container">
          <h2 className="text-2xl font-semibold mb-6">Galería</h2>
          {GALLERY.length === 0 ? (
            <div className="text-sm text-slate-600">Aún no hay imágenes. Añádelas en la constante GALLERY.</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {GALLERY.map((g, i) => (
                <div key={i} className="overflow-hidden rounded-xl border bg-slate-50">
                  <img src={g.url} alt={g.title} className="h-48 w-full object-cover" />
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{g.title}</div>
                      {g.date && <div className="text-xs text-slate-600">{g.date}</div>}
                    </div>
                    <button className="rounded-full border px-3 py-1 text-xs" onClick={() => downloadImage(g.url)}>Descargar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* JUGADORES */}
      <section id="jugadores" className="py-14 md:py-20">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                     placeholder="Buscar por nombre, club, nivel o IG…"
                     className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            <label className="text-sm">
              <input type="file" accept=".json,.csv" className="hidden" onChange={(e) => e.target.files && onImport(e.target.files[0])} />
              <span className="inline-block rounded-2xl border px-4 py-2 cursor-pointer">Importar CSV/JSON</span>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-slate-600">Sin resultados para “{query}”.</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-2xl border">
                  <div className="flex items-center gap-3 p-4">
                    <img src={p.photo || 'https://i.pravatar.cc/200?img=8'} alt={p.name} className="w-14 h-14 rounded-xl object-cover border"/>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-600">{p.club || ''}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4 pt-0 text-sm">
                    <div className="rounded-xl border p-3">
                      <div className="text-xs text-slate-500">Nivel</div>
                      <div className="font-medium">{p.level}</div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <div className="text-xs text-slate-500">Pozos</div>
                      <div className="font-medium">{p.stats.pozosJugados}</div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <div className="text-xs text-slate-500">Victorias</div>
                      <div className="font-medium">{p.stats.victorias}</div>
                    </div>
                    <div className="rounded-xl border p-3">
                      <div className="text-xs text-slate-500">Winrate juegos</div>
                      <div className="font-medium">{formatPct(p.stats.juegosGanados, p.stats.juegosPerdidos)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 pt-0">
                    <a className="rounded-2xl border px-3 py-1 text-xs" href={p.ig || IG_HANDLE} target="_blank" rel="noreferrer">Instagram</a>
                    <span className="rounded-full border px-2 py-0.5 text-xs">{p.level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-xs text-slate-600">
            <p><strong>CSV esperado:</strong> id,name,photo,level,club,ig,pozosJugados,victorias,juegosGanados,juegosPerdidos</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div>© {new Date().getFullYear()} J &amp; S Padel</div>
          <div className="flex items-center gap-4">
            <a className="hover:underline" href="#inscripcion">Inscripción</a>
            <a className="hover:underline" href="#redes">Redes</a>
            <a className="hover:underline" href="#galeria">Galería</a>
            <a className="hover:underline" href="#jugadores">Jugadores</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
