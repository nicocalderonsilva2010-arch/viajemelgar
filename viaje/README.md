# NEXORA ESTUDIO & SAUSALITOZ Z9

Álbum digital privado para documentar el viaje a Melgar, Colombia.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Producción

```bash
npm run build
npm run preview
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores del proyecto.

```bash
cp .env.example .env
```

Variables esperadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PRIVATE_ACCESS_CODE`
- `VITE_APP_NAME`

## Supabase

El proyecto está preparado para conectarse con Supabase. Si no configuras las variables, la app funciona en modo local con persistencia en `localStorage` para pruebas y visualización.

## Estructura

```text
/
├─ index.html
├─ src/
│  ├─ main.js
│  └─ styles.css
├─ public/
│  └─ images/
│     ├─ logo-nexora/       # Logo oficial de Nexora
│     ├─ nosotros/
│     │  └─ foto/           # Foto para la sección Nosotros
│     └─ team/
│        └─ elmanxy.png
├─ .env.example
├─ .env
├─ package.json
├─ vite.config.js
└─ README.md
```
