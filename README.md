# J & S Padel — Pozo (Vite + React + Tailwind)

Sitio minimalista y tecnológico para publicar torneos tipo **pozo**, con:
- CTA de **Inscripción** (enlace a Google Forms)
- **Galería** con descarga de fotos
- **Directorio de jugadores** con buscador e importación CSV/JSON

## 1) Requisitos
- Node.js 18+
- Cuenta de GitHub y un repositorio vacío

## 2) Configura los enlaces
Edita `src/App.tsx` y cambia:
- `IG_HANDLE` por el enlace real a vuestro Instagram
- `INSCRIPCION_LINK` por el enlace a vuestro Google Form
- `GALLERY` si ya tenéis fotos

## 3) Base para GitHub Pages
En `vite.config.ts` cambia:
```ts
base: '/repo-name/'
```
por el **nombre exacto** de tu repositorio, por ejemplo:
```ts
base: '/j-and-s-padel-site/'
```

## 4) Instalar y probar localmente
```bash
npm install
npm run dev
```

## 5) Publicar en GitHub Pages (vía Actions)
1. Sube el contenido de esta carpeta a tu repositorio (root).
2. Ve a **Settings → Pages** y en "Build and deployment" elige **GitHub Actions**.
3. Crea el workflow `.github/workflows/deploy.yml` (ya incluido en este proyecto).
4. Haz un commit en `main`. El workflow construirá y publicará en la rama `gh-pages`.
5. La URL quedará como: `https://<tu-usuario>.github.io/<repo-name>/`

## 6) CSV de ejemplo para jugadores
Guarda como `jugadores.csv` y súbelo desde la web:
```csv
id,name,photo,level,club,ig,pozosJugados,victorias,juegosGanados,juegosPerdidos
p1,Alejandro Sechi,https://i.pravatar.cc/200?img=5,3.5,Municipal Centro,https://instagram.com/ale_sechi,6,3,46,39
p2,Julia,https://i.pravatar.cc/200?img=15,3.0,Municipal Norte,https://instagram.com/julia,5,2,40,35
p3,María,https://i.pravatar.cc/200?img=31,3.0,Municipal Centro,https://instagram.com/maria,4,2,32,28
```

---
Cualquier duda, abre un issue o pregúntame por aquí. ¡A por esos pozos! 💪
