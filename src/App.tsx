import React from 'react'
import { fetchCSV } from './utils/csv'

/* ─────────────────────────────────────────────────────────
   Helpers visuales (scroll bar, reveal, etc.)
   ───────────────────────────────────────────────────────── */
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
    return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f) }
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-[width]" style={{ width: `${p*100}%` }}/>
    </div>
  )
}

function Reveal({ children, delay=0 }:{children:React.ReactNode;delay?:number}) {
  const ref=React.useRef<HTMLDivElement>(null)
  const [show,setShow]=React.useState(false)
  React.useEffect(()=>{
    const io=new IntersectionObserver(e=>e.forEach(v=>v.isIntersecting&&setShow(true)),{threshold:0.12})
    if(ref.current) io.observe(ref.current)
    return()=>io.disconnect()
  },[])
  return (
    <div ref={ref} style={{transitionDelay:`${delay}ms`}}
      className={`transition duration-700 ease-out will-change-transform will-change-opacity ${show?'opacity-100 translate-y-0':'opacity-0 translate-y-6'}`}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Efectos extra: partículas, botones magnéticos, confetti
   ───────────────────────────────────────────────────────── */
function ParticleField(){
  const ref=React.useRef<HTMLCanvasElement>(null)
  React.useEffect(()=>{
    const c=ref.current!,ctx=c.getContext('2d')!
    let w=c.width=c.offsetWidth,h=c.height=c.offsetHeight
    const P=Array.from({length:80},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5,r:Math.random()*2+1}))
    const loop=()=>{
      ctx.clearRect(0,0,w,h)
      for(const p of P){
        p.x+=p.vx;p.y+=p.vy
        if(p.x<0||p.x>w) p.vx*=-1
        if(p.y<0||p.y>h) p.vy*=-1
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(14,165,233,0.6)';ctx.fill()
      }
      requestAnimationFrame(loop)
    }
    loop()
  },[])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full opacity-40"/>
}

function MagneticButton({href,children}:{href:string;children:React.ReactNode}){
  const ref=React.useRef<HTMLAnchorElement>(null)
  React.useEffect(()=>{
    const el=ref.current!
    const move=(e:MouseEvent)=>{
      const r=el.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2)
      el.style.transform=`translate(${x*0.05}px,${y*0.05}px)`
    }
    const leave=()=>el.style.transform='translate(0,0)'
    el.addEventListener('mousemove',move);el.addEventListener('mouseleave',leave)
    return()=>{el.removeEventListener('mousemove',move);el.removeEventListener('mouseleave',leave)}
  },[])
  return <a ref={ref} href={href} target="_blank" className="rounded-2xl bg-cyan-500 px-4 py-2 text-white hover:bg-cyan-600 transition">{children}</a>
}

function SectionConfetti({targetId='jugadores'}){
  const ref=React.useRef<HTMLCanvasElement>(null)
  React.useEffect(()=>{
    const el=document.getElementById(targetId);if(!el) return
    const c=ref.current!,ctx=c.getContext('2d')!;let w=c.width=window.innerWidth,h=c.height=window.innerHeight
    const parts=Array.from({length:80},()=>({x:Math.random()*w,y:-20,vx:(Math.random()-0.5)*2,vy:2+Math.random()*3,c:`hsl(${Math.random()*360},80%,60%)`}))
    const io=new IntersectionObserver(e=>{
      if(e[0].isIntersecting){
        const t0=Date.now(),loop=()=>{
          ctx.clearRect(0,0,w,h)
          for(const p of parts){p.x+=p.vx;p.y+=p.vy;if(p.y>h)p.y=-20;ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,5,5)}
          if(Date.now()-t0<2500) requestAnimationFrame(loop)
        };loop()
      }
    },{threshold:0.3})
    io.observe(el)
  },[targetId])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-50"/>
}

/* ─────────────────────────────────────────────────────────
   Tipos y datos
   ───────────────────────────────────────────────────────── */
type Player={id:string;name:string;level:string;club?:string;ig?:string;photo?:string}
type LBRow={id:string;name:string;points:number;wins:number;ig?:string;photo?:string}

const FORM_URL='https://docs.google.com/forms/d/e/1FAIpQLSepjrGlEfJqq8Tg4vFsqw7Twh_TbAvApchG89qXU4UktgYihw/viewform?usp=header'
const IG_URL='https://www.instagram.com/js_torneos/'
const GALLERY=[{src:`${import.meta.env.BASE_URL}carteles/pozo1.png`,alt:'Pozo 1'}]

function resolvePhoto(url?:string){if(!url)return'';if(/^https?:/.test(url))return url;return `${import.meta.env.BASE_URL}${url}`}

function usePlayers(){
  const[p,setP]=React.useState<Player[]>([])
  React.useEffect(()=>{(async()=>{
    try{const d=await fetchCSV(`${import.meta.env.BASE_URL}players.csv`)
      setP(d.map((r:any,i:number)=>({id:r.id||String(i),name:r.name||'Jugador',level:r.level||'',club:r.club||'',ig:r.ig||'',photo:r.photo||''})))
    }catch(e){setP([])}})()},[])
  return p
}

function useLeaderboard(){
  const[r,setR]=React.useState<LBRow[]>([])
  React.useEffect(()=>{(async()=>{
    try{const d=await fetchCSV(`${import.meta.env.BASE_URL}leaderboard.csv`)
      const m=d.map((r:any,i:number)=>({id:r.id||String(i),name:r.name||'Jugador',points:+r.points||0,wins:+r.wins||0,ig:r.ig||'',photo:r.photo||''}))
      m.sort((a,b)=>b.points-a.points);setR(m)
    }catch(e){setR([])}})()},[])
  return r
}

/* ─────────────────────────────────────────────────────────
   UI secciones
   ───────────────────────────────────────────────────────── */
function Nav(){
  return(<header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-slate-200">
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 h-14 flex justify-between items-center">
      <a href="#" className="font-bold">J & S Padel</a>
      <nav className="hidden md:flex gap-6 text-sm">
        <a href="#inscripcion">Inscripción</a>
        <a href="#redes">Redes</a>
        <a href="#galeria">Galería</a>
        <a href="#ranking">Ranking</a>
        <a href="#jugadores">Jugadores</a>
      </nav>
      <MagneticButton href={FORM_URL}>Inscríbete</MagneticButton>
    </div>
  </header>)
}

function Hero(){
  return(<section className="relative">
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
      <Reveal>
        <div>
          <h1 className="text-4xl font-bold">Torneos tipo <span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">POZO</span></h1>
          <p className="mt-4 text-slate-600">Organizamos pozos rápidos y divertidos. Inscríbete y consulta perfiles de jugadores.</p>
          <div className="mt-6 flex gap-3">
            <MagneticButton href={FORM_URL}>Abrir formulario</MagneticButton>
            <a href="#jugadores" className="rounded-2xl border px-4 py-2 text-sm">Ver jugadores</a>
          </div>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div className="relative rounded-3xl h-56 md:h-72 overflow-hidden border shadow-inner">
          <ParticleField/>
          <img src={`${import.meta.env.BASE_URL}carteles/pozo1.png`} className="absolute inset-0 w-full h-full object-cover opacity-40"/>
        </div>
      </Reveal>
    </div>
  </section>)
}

function Inscripcion(){return(
  <section id="inscripcion" className="border-t border-slate-200 py-12">
    <div className="max-w-[1100px] mx-auto px-4"><h2 className="text-xl font-semibold">Inscripción</h2>
    <a href={FORM_URL} target="_blank" className="mt-4 inline-block bg-cyan-500 text-white px-4 py-2 rounded-xl">Abrir formulario</a></div>
  </section>)}

function Redes(){return(
  <section id="redes" className="border-t border-slate-200 py-12">
    <div className="max-w-[1100px] mx-auto px-4"><h2 className="text-xl font-semibold">Redes</h2>
    <a href={IG_URL} target="_blank" className="mt-4 inline-block border px-4 py-2 rounded-xl">Instagram</a></div>
  </section>)}

function Galeria(){return(
  <section id="galeria" className="border-t border-slate-200 py-12">
    <div className="max-w-[1100px] mx-auto px-4"><h2 className="text-xl font-semibold">Galería</h2>
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
      {GALLERY.map((g,i)=><a key={i} href={g.src} target="_blank" className="block rounded-2xl overflow-hidden border">
        <img src={g.src} alt={g.alt} className="w-full h-40 object-cover"/></a>)}
    </div></div>
  </section>)}

function Leaderboard(){
  const rows=useLeaderboard(),max=Math.max(1,...rows.map(r=>r.points))
  return(<section id="ranking" className="border-t border-slate-200 py-12">
    <div className="max-w-[1100px] mx-auto px-4">
      <h2 className="text-xl font-semibold">Ranking</h2>
      <div className="mt-6 space-y-3">{rows.map((r,i)=>
        <div key={r.id} className="p-3 border rounded-xl flex items-center gap-3">
          <div className="w-6 text-slate-500">#{i+1}</div>
          <img src={resolvePhoto(r.photo)||'https://i.pravatar.cc/100'} className="w-9 h-9 rounded-full"/>
          <div className="flex-1">
            <div className="flex justify-between text-sm"><span>{r.name}</span><span>{r.points} pts</span></div>
            <div className="h-2 bg-slate-100 rounded-full mt-1"><div className="h-full bg-cyan-500 rounded-full" style={{width:`${(r.points/max)*100}%`}}/></div>
          </div>
        </div>)}
      {!rows.length&&<p className="text-sm text-slate-500">Cargando ranking…</p>}
      </div>
    </div>
  </section>)
}

function Jugadores({players}:{players:Player[]}){
  const[q,setQ]=React.useState('')
  const list=React.useMemo(()=>{const t=q.toLowerCase();return!t?players:players.filter(p=>p.name.toLowerCase().includes(t)||(p.level||'').toLowerCase().includes(t))},[q,players])
  return(<section id="jugadores" className="border-t border-slate-200 py-12">
    <div className="max-w-[1100px] mx-auto px-4">
      <div className="flex justify-between items-end">
        <h2 className="text-xl font-semibold">Jugadores</h2>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar…" className="border px-2 py-1 rounded"/>
      </div>
      <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">{list.map(p=>
        <div key={p.id} className="p-4 border rounded-2xl flex gap-3 items-center hover:shadow-lg transition">
          <img src={resolvePhoto(p.photo)||'https://i.pravatar.cc/100'} className="w-14 h-14 rounded-full"/>
          <div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.level}</div></div>
        </div>)}</div>
    </div>
  </section>)
}

function Footer(){return(<footer className="border-t border-slate-200 py-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} J & S Padel</footer>)}

/* ─────────────────────────────────────────────────────────
   App
   ───────────────────────────────────────────────────────── */
export default function App(){
  const players=usePlayers()
  return(<div className="bg-white text-slate-900">
    <ScrollProgress/>
    <SectionConfetti targetId="jugadores"/>
    <Nav/>
    <Hero/>
    <Inscripcion/>
    <Redes/>
    <Galeria/>
    <Leaderboard/>
    <Jugadores players={players}/>
    <Footer/>
  </div>)
}
