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

Variables reservadas para futuras integraciones (el modo actual no requiere configurarlas):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (o `VITE_SUPABASE_ANON_KEY` si el proyecto usa la clave legacy)
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PRIVATE_ACCESS_CODE`
- `VITE_APP_NAME`

## Datos y cuentas

Supabase todavía no está configurado. El álbum, las misiones y NEXORA COINS funcionan en modo local con `localStorage`; sus datos existen solo en este navegador, no son cuentas autenticadas y no se sincronizan con otros dispositivos. Los perfiles Persona 1–10 y `manchi` son datos iniciales de muestra. El propietario no recibe privilegios administrativos mientras no exista autenticación segura. No guardes datos sensibles en este modo.

`.env.example` deja en blanco las variables futuras de Supabase; no contiene credenciales. No se necesitan para compilar o desplegar la web estática. `supabase/migrations/20261115_nexora_market.sql` es una propuesta para revisar cuando exista un proyecto; no se aplica ni se usa actualmente. Debe cotejarse con el esquema real antes de ejecutarla.

El código de acceso del álbum es una pantalla de conveniencia del lado del navegador, no una medida de privacidad: el sitio se publica como contenido estático y cualquier visitante puede inspeccionar el código cliente. No uses este modo para datos privados.

Las imágenes del mercader son opcionales. Coloca tus propios archivos en `public/images/merchant/`; si faltan, se muestra el espacio de retrato de cristal de NEXORA.

## GitHub Pages

Vite usa `base: '/viajemelgar/'` para este repositorio. El workflow `.github/workflows/deploy.yml` construye `dist` y lo publica cuando hay un push a `main`. En GitHub, configura **Settings → Pages → Build and deployment → Source: GitHub Actions**. La web no está confirmada como publicada hasta que la ejecución del workflow termine correctamente.

La app actual es JavaScript y Vite, no React. Su navegación interna usa anchors `#...`, por lo que no requiere un fallback de rutas SPA.

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
