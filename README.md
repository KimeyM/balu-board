# Balu Board

Corcho digital personal. Notas tipo post-it con texto enriquecido, imágenes y listas — arrastrables y redimensionables sobre un canvas infinito.

## Stack

- **Next.js 16** (App Router)
- **Supabase** — PostgreSQL + Auth (Magic Link) + Storage
- **Tiptap v3** — editor de texto enriquecido
- **react-rnd** — drag & resize en el canvas
- **Tailwind CSS v4**
- **Playfair Display + Inter** via `next/font`

## Primeros pasos

### 1. Variables de entorno

Crear `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
BOARD_PASSWORD=<contraseña-de-acceso>
# Opcional — panel "Agenda" (Google Calendar, solo lectura)
GOOGLE_CALENDAR_ICS_URL=
```

`BOARD_PASSWORD` es la contraseña única de acceso: se valida en `/api/auth` y el proxy bloquea cualquier sesión sin la cookie correspondiente.

`GOOGLE_CALENDAR_ICS_URL` es opcional y habilita el panel **Agenda**, que muestra tus eventos de los próximos 7 días (solo lectura). Obtenela en Google Calendar → Configuración del calendario → **Integrar calendario** → **Dirección secreta en formato iCal** (termina en `/basic.ics`). Sin esta variable, el panel muestra "no configurada".

### 2. Base de datos

En el **SQL Editor** de Supabase, ejecutar `supabase/schema.sql`. Incluye:
- Tablas `boards` e `items`
- RLS habilitado con política para usuarios autenticados
- Trigger de `updated_at` automático

### 3. Auth — URL de redirección

En **Supabase Dashboard → Authentication → URL Configuration**, agregar a "Redirect URLs":

```
http://localhost:3000/auth/callback
```

Para producción, agregar también la URL del deploy (ej. `https://balu-board.vercel.app/auth/callback`).

### 4. Storage (opcional, para imágenes)

Crear un bucket público llamado `board-images` en **Supabase Storage**. Si no existe, las imágenes se guardan en base64 dentro de la nota.

### 5. Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. El proxy redirige a `/login` si no hay sesión activa.

## Estructura

```
src/
  app/
    page.tsx                  # Canvas principal
    login/page.tsx            # Login con Magic Link
    auth/callback/route.ts    # Intercambio de código OAuth
    globals.css               # Estilos ProseMirror + fuentes
    layout.tsx
  components/
    Board.tsx                 # Estado global de notas, carga desde DB
    BoardItem.tsx             # Card glassmorphism con preview de contenido
    ItemModal.tsx             # Editor expandido (Tiptap + selector de color)
    TiptapEditor.tsx          # Toolbar completo de texto enriquecido
    AddItemButton.tsx         # Botón flotante "Nueva nota"
    TopNav.tsx                # Header con logout
  lib/
    supabase/
      client.ts               # Browser client (@supabase/ssr)
    supabase.ts               # Tipos BoardItem
    db.ts                     # fetchItems / insertItem / patchItem / deleteItem / uploadImage
  proxy.ts                    # Auth guard (Next.js 16 — reemplaza middleware.ts)
supabase/
  schema.sql                  # DDL completo + RLS
```

## Flujo de autenticación

```
GET / → proxy → sin sesión → redirect /login
          ↓
   ingresa email → signInWithOtp()
          ↓
   Supabase envía magic link al email
          ↓
   clic en el link → /auth/callback?code=xxx
          ↓
   exchangeCodeForSession() → sesión en cookie
          ↓
   redirect → / (board accesible)
```

El proxy verifica en cada request que la sesión pertenece a `OWNER_EMAIL`.

## Despliegue en Vercel

1. Importar el repositorio en Vercel
2. Agregar las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_EMAIL`)
3. Agregar la URL de producción a "Redirect URLs" en Supabase
4. Deploy automático en cada push a `main`
