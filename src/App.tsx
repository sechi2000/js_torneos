import React from "react"

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
}

type LeaderRow = {
  id: string
  name: string
  points: number
  wins?: number
  ig?: string
  photo?: string
}

type IgItem = { img: string; href?: string; alt?: string }

/* ─────────────────────────────────────────────────────────
   Utilidades
   ───────────────────────────────────────────────────────── */
const safeUUID = () =>
  typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : "id_" + Math.random().toString(36).slice(2)

/** CSV parser robusto (sin dependencias) */
async function fetchCSV(url: string) {
  const r = await fetch(url, { cache: "no-store" })
  if (!r.ok) throw new Error("CSV no disponible")

  const txt = await r.text()
  const clean = txt.replace(/^\uFEFF/, "") // quita BOM si existe
  const rows = clean.split(/\r?\n/).filter((line) => line.trim() !== "")
  if (rows.length === 0) return []

  const headers = rows[0].split(",").map((h) => h.trim())

  return rows.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim())
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => {
      rec[h] = cols[i] ?? ""
    })
    return rec
  })
}

/** Normaliza paths de fotos locales/remotas */
function resolvePhoto(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  return `${import.meta.env.BASE_URL}${url.replace(/^\/+/, "")}`
}

/* ─────────────────────────────────────────────────────────
   Config
   ───────────────────────────────────────────────────────── */
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header"
const IG_URL = "https://www.instagram.com/js_torneos/"

const GALLERY: { src: string; alt: string }[] = [
  { src: `${import.meta.env.BASE_URL}carteles/pozo1.png`, alt: "Pozo 1" },
]

/* ─────────────────────────────────────────────────────────
   Hooks de datos
   ───────────────────────────────────────────────────────── */
function usePlayers() {
  const [players, setPlayers] = React.useState<Player[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const rows = await fetchCSV(`${import.meta.env.BASE_URL}players.csv`)
        const mapped: Player[] = rows.map((r: any, i: number) => ({
          id: r.id || String(i + 1),
          name: r.name || r.nombre || "Jugador",
          level: r.level || r.nivel || "",
          club: r.club || "",
          ig: r.ig || r.instagram || "",
          photo: r.photo || r.foto || "",
        }))
        setPlayers(mapped)
      } catch (e) {
        console.warn("players.csv no disponible:", e)
        setPlayers([])
      }
    })()
  }, [])
  return players
}

function useLeaderboard() {
  const [rows, setRows] = React.useState<LeaderRow[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const raw = await fetchCSV(`${import.meta.env.BASE_URL}leaderboard.csv`)
        const mapped: LeaderRow[] = raw
          .map((r: any, i: number) => ({
            id: r.id || String(i + 1),
            name: r.name || r.nombre || "Jugador",
            points: Number(r.points ?? r.puntos ?? 0),
            wins: Number(r.wins ?? r.victorias ?? 0),
            ig: r.ig || r.instagram || "",
            photo: r.photo || r.foto || "",
          }))
          .sort((a, b) => b.points - a.points)
        setRows(mapped)
      } catch (e) {
        console.warn("leaderboard.csv no disponible:", e)
        setRows([])
      }
    })()
  }, [])
  return rows
}

/** Carga ig.json. Admite:
 *  - ["https://instagram.com/p/D.../", "ig/foto01.jpg", ...]
 *  - [{img:"ig/foto.jpg", href:"https://instagram.com/...", alt:"texto"}]
 *  Si la imagen apunta a instagram.com, usamos miniatura local placeholder.
 */
function useInstagram() {
  const [items, setItems] = React.useState<IgItem[]>([])
  React.useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch(`${import.meta.env.BASE_URL}ig.json`, { cache: "no-store" })
        if (!r.ok) throw new Error("ig.json no disponible")
        const data = await r.json()
        if (!Array.isArray(data)) throw new Error("ig.json debe ser un array")

        const norm: IgItem[] = data.map((raw: any) => {
          if (typeof raw === "string") {
            const looksInstagram = /https?:\/\/(www\.)?instagram\.com\//i.test(raw)
            return {
              img: looksInstagram
                ? `${import.meta.env.BASE_URL}ig/placeholder.svg`
                : resolvePhoto(raw),
              href: looksInstagram ? raw : undefined,
              alt: "Instagram",
            }
          }
          const href: string | undefined =
            typeof raw.href === "string" ? raw.href : undefined
          let img: string =
            typeof raw.img === "string" ? raw.img : `${import.meta.env.BASE_URL}ig/placeholder.svg`
          const looksInstagram = /https?:\/\/(www\.)?instagram\.com\//i.test(img)
          if (looksInstagram) img = `${import.meta.env.BASE_URL}ig/placeholder.svg`
          img = resolvePhoto(img)
          return { img, href, alt: raw.alt || "Instagram" }
        })
        setItems(norm)
      } catch (e) {
        console.warn("Feed IG desactivado:", e)
        setItems([])
      }
    })()
  }, [])
  return items
}

/* ─────────────────────────────────────────────────────────
   Cuenta atrás
   ───────────────────────────────────────────────────────── */
function useCountdown(targetISO: string) {
  const target = React.useMemo(() => new Date(targetISO).getTime(), [targetISO])
  const [ms, setMs] = React.useState(Math.max(0, target - Date.now()))
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
    <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border border-slate-200 shadow-inner bg-gradient-to-br from-cyan-50 to-violet-50">
      {props.bgImageUrl && (
        <img
          src={props.bgImageUrl}
          alt="Cartel pozo"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-transparent" />
      <div className="relative h-full p-4 md:p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Próximo pozo</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {new Date(props.dateISO).toLocaleString("es-ES", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="mt-1 text-sm text-slate-600">{props.lugar}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {props.precio && (
              <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">
                {props.precio}
              </span>
            )}
            {props.plazas && (
              <span className="rounded-full bg-white/70 px-2 py-1 border border-slate-200">
                {props.plazas}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-slate-800 text-sm md:text-base">
            {c.done ? (
              <span className="text-emerald-600">¡En juego!</span>
            ) : (
              <span>
                {String(c.d).padStart(2, "0")}d:{String(c.h).padStart(2, "0")}h:
                {String(c.m).padStart(2, "0")}m:{String(c.s).padStart(2, "0")}s
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
              Organizamos pozos de ~2h en instalaciones municipales. Inscríbete, ve fotos y consulta
              perfiles de jugadores.
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
            bgImageUrl={`${import.meta.env.BASE_URL}carteles/pozo1.png`}
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

function Ranking() {
  const rows = useLeaderboard()
  if (!rows.length) return null
  const top = rows.slice(0, 10)
  return (
    <section id="ranking" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Ranking</h2>
          <span className="text-xs text-slate-500">Fuente: leaderboard.csv</span>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Jugador</th>
                <th className="py-2 pr-4">Puntos</th>
                <th className="py-2 pr-4">Victorias</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4 flex items-center gap-2">
                    <img
                      src={resolvePhoto(r.photo) || "https://i.pravatar.cc/80"}
                      alt={r.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="font-medium text-slate-800">{r.name}</span>
                    {r.ig && (
                      <a
                        href={`https://instagram.com/${r.ig.replace("@", "")}`}
                        target="_blank"
                        className="text-xs text-cyan-600 hover:underline"
                      >
                        {r.ig}
                      </a>
                    )}
                  </td>
                  <td className="py-2 pr-4">{r.points}</td>
                  <td className="py-2 pr-4">{r.wins ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function HallOfFame() {
  const rows = useLeaderboard()
  const hof = rows.slice(0, 3)
  if (!hof.length) return null
  return (
    <section className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Hall of Fame</h2>
        <p className="text-slate-600 mt-2">Top 3 histórico por puntos.</p>
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {hof.map((p, idx) => (
            <div
              key={p.id || idx}
              className="rounded-2xl p-4 border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/60 shadow-[0_0_0_2px_rgba(251,191,36,.35)]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={resolvePhoto(p.photo) || "https://i.pravatar.cc/100"}
                  alt={p.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-300"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-amber-700">Puntos: {p.points}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Jugadores() {
  const players = usePlayers()
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

  if (!players.length) return null

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
          {list.map((p) => (
            <div key={p.id || safeUUID()} className="rounded-2xl border border-slate-200 p-4 flex gap-3 items-center">
              <img
                src={resolvePhoto(p.photo) || "https://i.pravatar.cc/100"}
                alt={p.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{p.name}</div>
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
          ))}
        </div>
      </div>
    </section>
  )
}

function InstagramGrid() {
  const items = useInstagram()
  if (!items.length) return null
  return (
    <section id="instagram" className="border-t border-slate-200">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-12">
        <h2 className="text-xl font-semibold text-slate-900">Menciónanos en Instagram</h2>
        <p className="text-slate-600 mt-2">
          Comparte la publicación con nosotros para aparecer aquí.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it, i) => {
            const card = (
              <div className="group block rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={it.img}
                  alt={it.alt || "Instagram"}
                  className="w-full h-44 md:h-52 object-cover group-hover:scale-[1.01] transition"
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
  return (
    <div className="bg-white text-slate-900">
      <Nav />
      <Hero />
      <Inscripcion />
      <Redes />
      <Galeria />
      <Ranking />
      <HallOfFame />
      <Jugadores />
      <InstagramGrid />
      <Footer />
    </div>
  )
}