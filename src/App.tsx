import React from "react"

/* ─────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────── */
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header"
const IG_URL = "https://www.instagram.com/js_torneos/"

// Activa/Desactiva el grid de Instagram (lee public/ig.json + miniaturas en /public/ig)
const SHOW_IG = true

// Imagen cartel del héroe (local)
const HERO_POSTER = `${import.meta.env.BASE_URL}carteles/pozo1.png`

// Galería (puedes mezclar locales y remotas)
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
  rating?: number // opcional en players.csv (si no, arranca en 1000)
}

type Match = {
  id: string
  date: string // ISO o YYYY-MM-DD
  p1: string   // id de players.csv
  p2: string
  score: string
  winner: string // id ganador
  round?: string // opcional
}

type IgItem = { img: string; href?: string; alt?: string }

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */
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
  const rows = txt.trim().split(/\r?\n/)
  const headers = rows[0].split(",").map((h) => h.trim())
  return rows.slice(1).map((line) => {
    // ojo: CSV simple (sin comillas internas). Para casos complejos usa PapaParse
    const cols = line.split(",").map((c) => c.trim())
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => (rec[h] = cols[i] ?? ""))
    return rec
  })
}

/* ─────────────────────────────────────────────────────────
   Data hooks (LOCAL /public/*.csv y /public/ig.json)
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
        console.error("Error players.csv", e)
        setPlayers([])
      }
    })()
  }, [])
  return players
}

function useMatchesFromLeaderboard() {
  const [matches, setMatches] = React.useState<Match[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const rows = await fetchCSV(`${import.meta.env.BASE_URL}leaderboard.csv`)
        const mapped: Match[] = rows.map((r, i) => ({
          id: r.id || `m${i + 1}`,
          date: r.date || "",
          p1: r.p1 || "",
          p2: r.p2 || "",
          score: r.score || "",
          winner: r.winner || "",
          round: r.round || "",
        }))
        // más recientes primero
        mapped.sort(
          (a, b) =>
            (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0),
        )
        setMatches(mapped)
      } catch (e) {
        console.warn("No se pudo cargar leaderboard.csv", e)
        setMatches([])
      }
    })()
  }, [])
  return matches
}

function useInstagram() {
  const [items, setItems] = React.useState<IgItem[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}ig.json`, {
          cache: "no-store",
        })
        if (!r.ok) throw new Error("ig.json no disponible")
        const data = (await r.json()) as IgItem[]
        setItems(data)
      } catch (e) {
        console.warn("No ig.json / feed vacío", e)
        setItems([])
      }
    })()
  }, [])
  return items
}

/* ─────────────────────────────────────────────────────────
   Ranking calculado a partir de leaderboard.csv
   Reglas simples (puedes cambiarlas):
   - Rating base = players.csv.rating || 1000
   - Ganador +15, Perdedor -10 (no baja de 500)
   - Wins/Losses acumulados
   ───────────────────────────────────────────────────────── */
function computeRanking(players: Player[], matches: Match[]) {
  // mapa id -> stats
  const base: Record<
    string,
    { player: Player; rating: number; wins: number; losses: number }
  > = {}
  players.forEach((p) => {
    base[p.id] = {
      player: p,
      rating: p.rating ?? 1000,
      wins: 0,
      losses: 0,
    }
  })

  matches
    .slice()
    .reverse() // cronológico
    .forEach((m) => {
      const a = base[m.p1]
      const b = base[m.p2]
      if (!a || !b) return
      const win = m.winner
      if (win === m.p1) {
        a.wins += 1
        b.losses += 1
        a.rating += 15
        b.rating = Math.max(500, b.rating - 10)
      } else if (win === m.p2) {
        b.wins += 1
        a.losses += 1
        b.rating += 15
        a.rating = Math.max(500, a.rating - 10)
      }
    })

  const rows = Object.values(base)
  rows.sort((r1, r2) => r2.rating - r1.rating)
  return rows
}

/* ─────────────────────────────────────────────────────────
   UI
   ───────────────────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur bg-white/70 border-b border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="#" className="font-semibold text-slate-800">
          J &amp; S Padel
        </a>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#inscripcion" className="text-slate-600 hover:text-slate-900">
            Inscripción
          </a>
          <a href="#redes" className="text-slate-600 hover:text-slate-900">
            Redes
          </a>
          <a href="#galeria" className="text-slate-600 hover:text-slate-900">
            Galería
          </a>
          <a href="#ranking" className="text-slate-600 hover:text-slate-900">
            Ranking
          </a>
          <a href="#hof" className="text-slate-600 hover:text-slate-900">
            Hall of Fame
          </a>
          <a href="#jugadores" className="text-slate-600 hover:text-slate-900">
            Jugadores
          </a>
          <a href="#instagram" className="text-slate-600 hover:text-slate-900">
            Instagram
          </a>
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

function NextPozoCard() {
  return (
    <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border border-slate-200 shadow-inner bg-gradient-to-br from-cyan-50 to-violet-50">
      <img
        src={HERO_POSTER}
        alt="Cartel pozo"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-transparent" />
      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Próximo pozo
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            Fecha por anunciar
          </div>
          <div className="mt-1 text-sm text-slate-600">Polideportivo Municipal</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">
              12€ por jugador
            </span>
            <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">
              16 plazas
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-slate-800 text-sm md:text-base">
            Publicamos la fecha en Instagram
          </div>
          <a
            href={FORM_URL}
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
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Torneos tipo{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                POZO
              </span>
              <br /> rápidos, justos y divertidos
            </h1>
            <p className="mt-4 text-slate-600">
              Organizamos pozos de ~2h en instalaciones municipales. Inscríbete,
              ve fotos y consulta perfiles de jugadores.
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
              <span className="inline-block size-2 rounded-full bg-amber-400 animate-pulse" />{" "}
              Próximo pozo: Fecha por confirmar
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
            <a
              key={i}
              href={g.src}
              target="_blank"
              className="group block rounded-2xl overflow-hidden border border-slate-200"
            >
              <img
                src={g.src}
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

function Ranking({ rows }: { rows: ReturnType<typeof computeRanking> }) {
  return (
    <section id="ranking" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Ranking</h2>
        <p className="text-slate-600 mt-2">
          Puntuación en vivo calculada desde <code>public/leaderboard.csv</code>.
        </p>

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
                  <td className="py-2 pr-4">{r.player.club}</td>
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

function HallOfFame({ rows }: { rows: ReturnType<typeof computeRanking> }) {
  const top3 = rows.slice(0, 3)
  return (
    <section id="hof" className="border-t border-slate-200 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Hall of Fame</h2>
        <p className="text-slate-600 mt-2">Los 3 con mayor rating actual.</p>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {top3.map((r, i) => (
            <div
              key={r.player.id}
              className="relative overflow-hidden rounded-2xl border border-amber-300/60 bg-white p-4"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,249,219,0.6) 100%)",
              }}
            >
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-amber-200/60 blur-2xl" />
              <div className="flex items-center gap-3">
                <img
                  src={resolvePhoto(r.player.photo) || "https://i.pravatar.cc/100"}
                  alt={r.player.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400/70"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    #{i + 1} {r.player.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.player.level} · {r.player.club || "—"}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <span className="font-medium text-amber-700">Rating:</span>{" "}
                <span className="font-semibold">{r.rating}</span> ·{" "}
                <span className="text-slate-600">
                  W{r.wins}/L{r.losses}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Jugadores({
  players,
  matches,
}: {
  players: Player[]
  matches: Match[]
}) {
  // índice de partidos por jugador
  const byPlayer: Record<string, Match[]> = React.useMemo(() => {
    const m: Record<string, Match[]> = {}
    matches.forEach((match) => {
      ;[match.p1, match.p2].forEach((id) => {
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
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        (p.level || "").toLowerCase().includes(t) ||
        (p.club || "").toLowerCase().includes(t),
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
            const recent = (byPlayer[p.id] || []).slice(0, 3)
            return (
              <div
                key={p.id}
                className="group [perspective:1000px]"
              >
                {/* Frente */}
                <div className="relative rounded-2xl border border-slate-200 p-4 flex gap-3 items-center transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  <div className="absolute inset-0 rounded-2xl bg-white [backface-visibility:hidden]" />
                  <div className="relative z-10 flex gap-3 items-center">
                    <img
                      src={resolvePhoto(p.photo) || "https://i.pravatar.cc/100"}
                      alt={p.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {p.level}
                        {p.club ? ` · ${p.club}` : ""}
                      </div>
                      {p.ig && (
                        <a
                          href={`https://instagram.com/${p.ig.replace("@", "")}`}
                          target="_blank"
                          className="text-xs text-cyan-600 hover:underline"
                        >
                          {p.ig}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Dorso (stats) */}
                  <div className="absolute inset-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 rotate-y-180 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="text-sm font-medium text-slate-800">
                      Últimos partidos
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {recent.length === 0 && (
                        <li className="text-slate-400">Sin registros</li>
                      )}
                      {recent.map((m) => {
                        const vs = m.p1 === p.id ? m.p2 : m.p1
                        const youWin = m.winner === p.id
                        return (
                          <li key={m.id} className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                                youWin ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                              title={youWin ? "Victoria" : "Derrota"}
                            />
                            vs {vs} · {m.score}
                          </li>
                        )
                      })}
                    </ul>
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
  if (!items.length) return null
  return (
    <section id="instagram" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">
          Menciónanos en Instagram
        </h2>
        <p className="text-slate-600 mt-2">
          Comparte la publicación con nosotros para aparecer aquí.
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it, i) => {
            const img = /^https?:\/\//i.test(it.img)
              ? it.img
              : `${import.meta.env.BASE_URL}${it.img.startsWith("/")
                  ? it.img.slice(1)
                  : it.img
                }`
            const card = (
              <div className="group block rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={img}
                  alt={it.alt || "Instagram"}
                  className="w-full h-48 object-cover group-hover:scale-[1.02] transition"
                  loading="lazy"
                />
              </div>
            )
            return it.href ? (
              <a key={i} href={it.href} target="_blank" rel="noreferrer">
                {card}
              </a>
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
  const matches = useMatchesFromLeaderboard()
  const ranking = React.useMemo(
    () => computeRanking(players, matches),
    [players, matches],
  )

  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <Ranking rows={ranking} />
      <HallOfFame rows={ranking} />
      <Jugadores players={players} matches={matches} />
      {SHOW_IG && <InstagramFeed />}
      <Footer />
    </div>
  )
}