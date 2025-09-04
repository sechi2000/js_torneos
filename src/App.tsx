import React from "react"

/* ─────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────── */
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header"
const IG_URL = "https://www.instagram.com/js_torneos/"
const SHOW_IG = false
const HERO_POSTER = `${import.meta.env.BASE_URL}carteles/pozo1.png`
const GALLERY: { src: string; alt: string }[] = [
  { src: `${import.meta.env.BASE_URL}carteles/pozo1.png`, alt: "Pozo 1" },
]

/* ─────────────────────────────────────────────────────────
   Tipos
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
  date?: string
  p1: string
  p2: string
  score?: string
  winner?: string
  round?: string
}

type IgItem = { img: string; href?: string; alt?: string }

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */
const safeUUID = () =>
  (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function')
    ? (crypto as any).randomUUID()
    : ('id_' + Math.random().toString(36).slice(2))

function resolvePhoto(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  const clean = url.startsWith("/") ? url.slice(1) : url
  return `${import.meta.env.BASE_URL}${clean}`
}

async function fetchCSV(url: string) {
  const r = await fetch(url, { cache: "no-store" })
  if (!r.ok) throw new Error("CSV no disponible")
  const txt = await r.text()
  const clean = txt.replace(/^\uFEFF/, "")
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== "")
  if (!lines.length) return []
  const headers = lines[0].split(",").map(h => h.trim())
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim())
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => rec[h] = cols[i] ?? "")
    return rec
  })
}

/* ─────────────────────────────────────────────────────────
   Data hooks
   ───────────────────────────────────────────────────────── */
function usePlayers() {
  const [players, setPlayers] = React.useState<Player[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const rows = await fetchCSV(`${import.meta.env.BASE_URL}players.csv`)
        const mapped: Player[] = rows.map((r, i) => ({
          id: r.id || String(i + 1),
          name: r.name || "Jugador",
          level: r.level || "",
          club: r.club || "",
          ig: r.ig || "",
          photo: r.photo || "",
          rating: r.rating ? Number(r.rating) : undefined,
        }))
        setPlayers(mapped)
      } catch (e) {
        console.error("players.csv error", e)
        setPlayers([])
      }
    })()
  }, [])
  return players
}

/** Lee leaderboard.csv detectando esquema:
 * - Esquema A (matches): id,date,p1,p2,score,winner,round
 * - Esquema B (tabla):   id,name,points,wins,losses,ig,photo
 */
function useLeaderboard() {
  const [matches, setMatches] = React.useState<Match[]>([])
  const [table, setTable] = React.useState<{id:string; name?:string; points?:number; wins?:number; losses?:number; ig?:string; photo?:string}[]>([])

  React.useEffect(() => {
    ;(async () => {
      try {
        const rows = await fetchCSV(`${import.meta.env.BASE_URL}leaderboard.csv`)
        if (!rows.length) { setMatches([]); setTable([]); return }
        const keys = Object.keys(rows[0]).map(k => k.toLowerCase())

        const isMatches = keys.includes('p1') && keys.includes('p2')
        if (isMatches) {
          const data: Match[] = rows.map((r, i) => ({
            id: r.id || safeUUID(),
            date: r.date || "",
            p1: r.p1 || "",
            p2: r.p2 || "",
            score: r.score || "",
            winner: r.winner || "",
            round: r.round || "",
          }))
          data.sort((a,b) => (new Date(b.date||'').getTime()||0)-(new Date(a.date||'').getTime()||0))
          setMatches(data); setTable([])
        } else {
          // Tabla directa
          const data = rows.map((r, i) => ({
            id: r.id || safeUUID(),
            name: r.name || "",
            points: r.points ? Number(r.points) : undefined,
            wins: r.wins ? Number(r.wins) : undefined,
            losses: r.losses ? Number(r.losses) : undefined,
            ig: r.ig || "",
            photo: r.photo || "",
          }))
          // orden por points desc si hay, si no por wins desc
          data.sort((a,b) => (b.points ?? 0) - (a.points ?? 0) || (b.wins ?? 0) - (a.wins ?? 0))
          setTable(data); setMatches([])
        }
      } catch (e) {
        console.warn("leaderboard.csv error", e)
        setMatches([]); setTable([])
      }
    })()
  }, [])

  return { matches, table }
}

function useInstagram() {
  const [items, setItems] = React.useState<IgItem[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}ig.json`, { cache: "no-store" })
        if (!r.ok) throw new Error("ig.json no disponible")
        const data = await r.json()
        let out: IgItem[] = []
        if (Array.isArray(data)) {
          // Soporta array de strings o array de objetos
          out = data.map((it: any) => {
            if (typeof it === 'string') {
              return { img: it, href: it }
            } else {
              return {
                img: it.img,
                href: it.href,
                alt: it.alt || 'Instagram'
              }
            }
          }).filter((it: IgItem) => typeof it.img === 'string' && it.img.length > 0)
        }
        setItems(out)
      } catch (e) {
        console.warn("IG feed desactivado:", e)
        setItems([])
      }
    })()
  }, [])
  return items
}

/* ─────────────────────────────────────────────────────────
   Ranking
   ───────────────────────────────────────────────────────── */
function computeRankingFromMatches(players: Player[], matches: Match[]) {
  const base: Record<string, { player: Player; rating: number; wins: number; losses: number }> = {}
  players.forEach(p => base[p.id] = { player: p, rating: p.rating ?? 1000, wins: 0, losses: 0 })

  matches.slice().reverse().forEach(m => {
    const a = base[m.p1]; const b = base[m.p2]
    if (!a || !b) return
    if (m.winner === m.p1) { a.wins++; b.losses++; a.rating += 15; b.rating = Math.max(500, b.rating-10) }
    else if (m.winner === m.p2) { b.wins++; a.losses++; b.rating += 15; a.rating = Math.max(500, a.rating-10) }
  })

  const rows = Object.values(base)
  rows.sort((x,y) => y.rating - x.rating)
  return rows
}

function computeRankingFromTable(players: Player[], table: {id:string; name?:string; points?:number; wins?:number; losses?:number; ig?:string; photo?:string}[]) {
  // Merge por id; si id no está en players, creamos un pseudo-player
  const byId = new Map(players.map(p => [p.id, p]))
  const rows = table.map(row => {
    const p = byId.get(row.id) || {
      id: row.id,
      name: row.name || `Jugador ${row.id}`,
      level: '',
      club: '',
      ig: row.ig || '',
      photo: row.photo || '',
      rating: row.points
    } as Player
    return {
      player: { ...p, photo: row.photo || p.photo, ig: row.ig || p.ig },
      rating: row.points ?? (p.rating ?? 1000),
      wins: row.wins ?? 0,
      losses: row.losses ?? 0
    }
  })
  rows.sort((a,b) => b.rating - a.rating)
  return rows
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
          <a href="#instagram" className="text-slate-600 hover:text-slate-900">Instagram</a>
        </nav>
        <a href={FORM_URL} target="_blank"
           className="rounded-xl bg-cyan-500 text-white text-sm px-3 py-2 hover:bg-cyan-600 transition">
          Inscríbete
        </a>
      </div>
    </header>
  )
}

function NextPozoCard() {
  return (
    <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border border-slate-200 shadow-inner bg-gradient-to-br from-cyan-50 to-violet-50">
      <img src={HERO_POSTER} alt="Cartel pozo" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-transparent" />
      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Próximo pozo</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">Fecha por anunciar</div>
          <div className="mt-1 text-sm text-slate-600">Polideportivo Municipal</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">12€ por jugador</span>
            <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">16 plazas</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-slate-800 text-sm md:text-base">Publicamos la fecha en Instagram</div>
          <a href={FORM_URL} target="_blank" className="rounded-xl bg-cyan-500 text-white text-xs md:text-sm px-3 py-2 hover:bg-cyan-600 transition">Inscribirme</a>
        </div>
      </div>
    </div>
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
              <a href={FORM_URL} target="_blank" className="rounded-2xl bg-slate-900 text-white px-5 py-2.5 text-sm hover:-translate-y-0.5 transition">Abrir formulario</a>
              <a href="#jugadores" className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition">Ver jugadores</a>
            </div>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block size-2 rounded-full bg-amber-400 animate-pulse" /> Próximo pozo: Fecha por confirmar
            </p>
          </div>
          <NextPozoCard />
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
        <a href={FORM_URL} target="_blank" className="mt-4 inline-block rounded-xl bg-cyan-500 text-white px-5 py-2.5 text-sm hover:bg-cyan-600 transition">Abrir formulario</a>
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
        <a href={IG_URL} target="_blank" className="mt-4 inline-block rounded-xl border border-slate-300 px-5 py-2.5 text-sm hover:bg-slate-50 transition">Instagram</a>
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

function RankingTable({ rows }: { rows: {player: Player; rating: number; wins: number; losses: number}[] }) {
  if (!rows.length) return null
  return (
    <section id="ranking" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Ranking</h2>
        <p className="text-slate-600 mt-2">Generado desde <code>leaderboard.csv</code> (auto-detección de esquema).</p>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Pos</th>
                <th className="py-2 pr-4">Jugador</th>
                <th className="py-2 pr-4">Nivel</th>
                <th className="py-2 pr-4">Club</th>
                <th className="py-2 pr-4">Wins</th>
                <th className="py-2 pr-4">Losses</th>
                <th className="py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player.id} className="border-t border-slate-200">
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4">{r.player.name}</td>
                  <td className="py-2 pr-4">{r.player.level}</td>
                  <td className="py-2 pr-4">{r.player.club || "—"}</td>
                  <td className="py-2 pr-4">{r.wins}</td>
                  <td className="py-2 pr-4">{r.losses}</td>
                  <td className="py-2 font-medium">{r.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function HallOfFame({ rows }: { rows: {player: Player; rating: number; wins: number; losses: number}[] }) {
  const top3 = rows.slice(0,3)
  if (!top3.length) return null
  return (
    <section id="hof" className="border-t border-slate-200 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Hall of Fame</h2>
        <p className="text-slate-600 mt-2">Los 3 con mayor rating actual.</p>
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {top3.map((r, i) => (
            <div key={r.player.id} className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-white p-4">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-amber-200/60 blur-2xl" />
              <div className="flex items-center gap-3">
                <img src={resolvePhoto(r.player.photo) || "https://i.pravatar.cc/100"} alt={r.player.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400/70" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">#{i + 1} {r.player.name}</div>
                  <div className="text-xs text-slate-500">{r.player.level} · {r.player.club || "—"}</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <span className="font-medium text-amber-700">Rating:</span> <span className="font-semibold">{r.rating}</span> · <span className="text-slate-600">W{r.wins}/L{r.losses}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Jugadores({ players, matches }: { players: Player[]; matches: Match[] }) {
  const byPlayer: Record<string, Match[]> = React.useMemo(() => {
    const m: Record<string, Match[]> = {}
    matches.forEach(match => {
      ;[match.p1, match.p2].forEach(id => {
        if (!m[id]) m[id] = []
        m[id].push(match)
      })
    })
    return m
  }, [matches])

  const [q, setQ] = React.useState("")
  const list = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return players
    return players.filter(p =>
      p.name.toLowerCase().includes(t) ||
      (p.level || "").toLowerCase().includes(t) ||
      (p.club || "").toLowerCase().includes(t))
  }, [q, players])

  return (
    <section id="jugadores" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Jugadores</h2>
            <p className="text-slate-600 mt-2">Pasa el ratón para ver sus últimos partidos.</p>
          </div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar…"
                 className="w-48 md:w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <style>{`
          .flip { perspective: 1000px; }
          .flip-inner { transform-style: preserve-3d; transition: transform .6s; }
          .flip:hover .flip-inner, .flip:focus-within .flip-inner { transform: rotateY(180deg); }
          .flip-face { backface-visibility: hidden; }
          .flip-back { transform: rotateY(180deg); }
        `}</style>

        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {list.map(p => {
            const recent = (byPlayer[p.id] || []).slice(0,3)
            return (
              <div key={p.id} className="flip rounded-2xl border border-slate-200">
                <div className="flip-inner relative p-4 min-h-[140px]">
                  <div className="flip-face absolute inset-0 p-4 flex gap-3 items-center">
                    <img src={resolvePhoto(p.photo) || "https://i.pravatar.cc/100"} alt={p.name}
                         className="w-14 h-14 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {p.level}{p.club ? ` · ${p.club}` : ''}{typeof p.rating === 'number' ? ` · ${p.rating.toFixed(0)}` : ''}
                      </div>
                      {p.ig && <a href={`https://instagram.com/${p.ig.replace('@','')}`} target="_blank" className="text-xs text-cyan-600 hover:underline">{p.ig}</a>}
                    </div>
                  </div>

                  <div className="flip-face flip-back absolute inset-0 p-4 border border-slate-200 bg-slate-50">
                    <div className="text-sm font-medium text-slate-800 mb-1">Últimos partidos</div>
                    {recent.length ? (
                      <ul className="space-y-1">
                        {recent.map(m => {
                          const youWin = m.winner === p.id
                          const vs = m.p1 === p.id ? m.p2 : m.p1
                          return (
                            <li key={m.id} className="text-xs text-slate-600">
                              <span className={youWin ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                                {youWin ? "W" : "L"}
                              </span>{" "}
                              vs {vs}{m.score ? ` · ${m.score}` : ""}{m.date ? ` · ${new Date(m.date).toLocaleDateString('es-ES')}` : ""}
                            </li>
                          )
                        })}
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

function InstagramFeed() {
  const items = useInstagram()
  if (!SHOW_IG || !items.length) return null
  return (
    <section id="instagram" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Menciónanos en Instagram</h2>
        <p className="text-slate-600 mt-2">Comparte la publicación con nosotros para aparecer aquí.</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it, i) => {
            const img = /^https?:\/\//i.test(it.img)
              ? it.img
              : `${import.meta.env.BASE_URL}${it.img.replace(/^\/+/, "")}`
            const card = (
              <div className="group block rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={img} alt={it.alt || "Instagram"} className="w-full h-48 object-cover group-hover:scale-[1.02] transition" loading="lazy" />
              </div>
            )
            return it.href ? (
              <a key={i} href={it.href} target="_blank" rel="noreferrer">{card}</a>
            ) : (<div key={i}>{card}</div>)
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

export default function App() {
  const players = usePlayers()
  const { matches, table } = useLeaderboard()

  // Decide ranking source
  const ranking = React.useMemo(() => {
    if (matches.length) return computeRankingFromMatches(players, matches)
    if (table.length)    return computeRankingFromTable(players, table)
    // por defecto: ordena por rating existente o nombre
    return players.map(p => ({ player: p, rating: p.rating ?? 1000, wins: 0, losses: 0 }))
                  .sort((a,b) => b.rating - a.rating)
  }, [players, matches, table])

  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <RankingTable rows={ranking} />
      <HallOfFame rows={ranking} />
      <Jugadores players={players} matches={matches} />
      <InstagramFeed />
      <Footer />
    </div>
  )
}