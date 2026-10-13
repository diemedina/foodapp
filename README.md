# Organizador de comidas

App mobile para planificar las comidas de la semana (desayuno, almuerzo, merienda y cena), guardar recetas y armar la lista del súper. Pensada para 2 personas que comparten los mismos datos, sin cuentas: se entra con un código de acceso compartido.

**Stack:** Next.js 16 (App Router, Cache Components, Server Actions, View Transitions) · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL (Neon en producción).

## Empezar

Requisitos: Node 20.9 o superior.

```bash
npm install
neon deploy                  # trae DATABASE_URL de Neon a .env.local (ver abajo)
# agregá ACCESS_CODE=<tu código> en .env.local
npm run db:push              # crea las tablas
npm run db:seed              # recetas de ejemplo, orden del súper y 2 planes favoritos
npm run dev
```

Abrí http://localhost:3000 e ingresá el código que pusiste en `ACCESS_CODE`.

### Base de datos (Neon)

El repo ya está vinculado al proyecto de Neon (archivo `.neon`, rama `production`) y declara los servicios en `neon.ts` (solo Postgres).

```bash
npm i -g neon        # o usá npx neon
neon login           # una vez, abre el navegador
neon deploy          # aplica neon.ts y escribe DATABASE_URL y DATABASE_URL_UNPOOLED en .env.local
```

- La app usa `DATABASE_URL` (pooled) con `node-postgres` y `attachDatabasePool` de `@vercel/functions`, como recomienda Neon para Vercel.
- `drizzle-kit` (push y migraciones) usa `DATABASE_URL_UNPOOLED` (conexión directa).
- Para trabajar sin tocar producción: `neon checkout dev --create` crea una rama y actualiza `.env.local`.
- También funciona con cualquier Postgres (por ejemplo un Docker local) poniendo la misma URL en las dos variables.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm run db:push` | Aplica el esquema de `src/db/schema.ts` a la base |
| `npm run db:generate` / `npm run db:migrate` | Migraciones versionadas (cuando haya datos reales que cuidar) |
| `npm run db:seed` | Datos de ejemplo (solo si no hay recetas) |
| `npm run db:studio` | Explorador visual de la base |

## Estructura

```
src/
  app/
    (app)/             pantallas con la barra inferior
      page.tsx         Hoy (la comida según la hora)
      semana/          planificador semanal, sobras, planes favoritos
      recetas/         listado, detalle, nueva y editar
      compras/         lista de compras, "ya tengo en casa", cosas de la casa
    acceso/            pantalla del código de acceso
  components/          UI compartida (Sheet, Toast, BottomNav, PickerSheet…)
  db/                  esquema de Drizzle y conexión
  lib/                 lógica pura: fechas, unidades, lista de compras, sugerencias
  server/              consultas, Server Actions y control de acceso
  proxy.ts             pide el código antes de cualquier pantalla
scripts/seed.ts        datos iniciales
```

## Cómo funciona

- **Renderizado:** cada pantalla se arma en el servidor con los datos (Cache Components: el esqueleto se muestra al instante y el contenido llega por streaming). La interacción va en componentes cliente chicos.
- **Cambios:** todo pasa por Server Actions en `src/server/actions.ts`, que validan con Zod, verifican el código de acceso y refrescan la pantalla con `refresh()`. Tachar en la lista es optimista (`useOptimistic`).
- **Lista de compras:** no se guarda; se calcula desde el plan de la semana, menos lo que ya hay en casa. Solo se guarda lo tachado.
- **Semanas:** empiezan el lunes y se calculan con la zona horaria de `APP_TIME_ZONE` (Buenos Aires por defecto). De viernes a domingo la app abre la semana que viene.
- **Animaciones:** View Transitions de React para navegar entre pantallas y para la tarjeta de receta que se expande al detalle; paneles, avisos y tildes con CSS. Se desactivan con "reducir movimiento".

## Despliegue

Pensado para Vercel (plan Hobby) + Neon (plan Free). Variables necesarias en Vercel: `DATABASE_URL` y `ACCESS_CODE` (y opcionalmente `APP_TIME_ZONE`). La fuente Nunito Sans se descarga de Google Fonts al compilar, así que el build necesita internet.
