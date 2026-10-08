# SigMed

Sistema de agenda medica, gestion de vacunas e historial clinico para una sala
medica. App web en Next.js con Clerk (autenticacion), Neon (PostgreSQL) y Prisma.

Estado actual: **Fase 1** - base de datos creada, integrada con la aplicacion y
desplegada en Vercel. El rol se movio a Clerk. Todavia no hay autenticacion ni
pantallas por rol.

La documentacion de decisiones, desvios y pendientes esta en
[`implementacion-ia/`](implementacion-ia/README.md).

## Stack

| Capa | Tecnologia |
| :--- | :--- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 |
| Base de datos | Neon (PostgreSQL) |
| ORM | Prisma 7 con `@prisma/adapter-neon` |
| Autenticacion | Clerk (proximas fases) |
| Deploy | Vercel |

## Puesta en marcha

### 1. Crear el proyecto en Neon

1. Crear una cuenta en [neon.tech](https://neon.tech) y un proyecto llamado `sigmed`.
2. Elegir la region disponible mas cercana. El proyecto actual quedo en
   `AWS us-east-1`; las connection strings de abajo son de ejemplo y hay que
   copiar las reales desde **Connect**.
3. En **Connect**, copiar las dos connection strings:
   - **Pooled connection**: es la que usa la aplicacion en runtime.
   - **Direct connection**: es la que usa la CLI de Prisma (migraciones, studio).

### 2. Variables de entorno

```bash
cp .env.example .env
```

Descomentar y completar con los valores de Neon:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"
```

### 3. Instalar dependencias y crear las tablas

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run db:studio
```

Las migraciones ya estan en el repo, asi que esto alcanza para crear la base desde
cero. Para reconstruirla desde el cero de una vez: `npm run db:reset`.

El repo tiene tres migraciones:

| Migracion | Que hace |
| :--- | :--- |
| `20261004060848_init` | Las 9 tablas, enums, claves foraneas e indices que genera Prisma |
| `20261004061200_constraints` | Las reglas que Prisma no puede modelar (origen: `prisma/constraints.sql`) |
| `20261004135801_drop_user_profile_role` | Saca el enum `Role` y la columna `user_profile.role`; el rol pasa a Clerk |

Van separadas a proposito: editar una migracion ya aplicada cambia su checksum y
`prisma migrate deploy` deja de funcionar en Vercel.

Si `migrate dev` falla al crear la shadow database, crear una branch en Neon y
apuntar `SHADOW_DATABASE_URL` a esa branch en el `.env`.

## Comandos

| Comando | Que hace |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Crea y aplica una migracion |
| `npm run db:deploy` | Aplica migraciones pendientes (Vercel / produccion) |
| `npm run db:seed` | Carga los datos de demo |
| `npm run db:reset` | Borra todo, reaplica migraciones y vuelve a sembrar |
| `npm run db:verify` | Comprueba que la base hace cumplir las constraints |
| `npm run db:studio` | GUI de la base de datos |

## Modelo de datos

Nueve tablas que cubren las seis user stories del Sprint 1.

```
user_profile    1──1 doctor          personas del sistema (rol en Clerk)
                 1──1 patient
                       │
                       ├──< doctor_schedule     franjas de atención (RF-01/27)
                       ├──< appointment >── doctor
                       │        │
                       │        ├── vaccine ──< vaccine_lot ──< stock_movement
                       │        └── clinical_record
                       └──> stock_movement      (actor del movimiento)
```

| Tabla | Que modela | RF / US |
| :--- | :--- | :--- |
| `user_profile` | Personas del sistema. `clerk_id` queda NULL hasta integrar Clerk | RF-22, RF-23, RF-24, RF-25 |
| `doctor` | Perfil profesional (matricula) | RF-01, RF-27 |
| `patient` | Perfil de paciente | RF-18 |
| `doctor_schedule` | Franjas horarias con vigencia, versionables sin pisar turnos publicados | RF-01, RF-27 / US-1.5 |
| `appointment` | Turnos de consulta y de vacunacion, con su maquina de estados | RF-04, RF-12, RF-29 / US-1.4, US-3.6 |
| `vaccine` | Catalogo de biologicos y nivel de stock critico | RF-32, RF-33 / US-3.1 |
| `vaccine_lot` | Lotes con vencimiento y saldo disponible | RF-11 / US-3.2 |
| `stock_movement` | Libro de movimientos inmutable: quien, cuando, que lote | RF-11 CA2 / US-3.2 |
| `clinical_record` | Diagnostico, tratamiento e indicaciones por turno atendido | RF-17, RF-18 / US-5.2 |

### Decisiones de modelado

- **Estados del turno** (`appointment.status`): `DISPONIBLE`, `RESERVADO`,
  `CONFIRMADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`, `BLOQUEADO`, `NO_DISPONIBLE`.
  Un turno `DISPONIBLE` todavia no tiene `patient_id`, que es lo que representa la
  agenda publicada de RF-02.
- **`doctor_schedule` versionable**: `valid_from` / `valid_to` permiten que el
  administrador cambie un horario (US-1.5.2) cerrando la fila vieja y abriendo una
  nueva, sin romper los turnos ya publicados.
- **`quantity_available` es un saldo cacheado**, la verdad historica es
  `stock_movement`. El seed deja los dos consistentes.
- **Inmutabilidad garantizada por la base**: `stock_movement` no tiene `updated_at`
  y tiene triggers que rechazan `UPDATE` y `DELETE`.
- **Sin tabla `nurse`**: la enfermera es un `user_profile` sin ficha propia; su rol
  vive en Clerk.
- **El rol no esta en la base.** Vive en Clerk como `publicMetadata.role`.
  `user_profile` conserva la identidad y el vinculo `clerk_id`. Ver
  [`implementacion-ia/consideraciones-tecnicas.md`](implementacion-ia/consideraciones-tecnicas.md)
  seccion 1.
- **`/admin` no hereda las areas de medico ni paciente.** Es una desviacion
  consciente respecto de RF-26, registrada en la seccion 2 del mismo documento.

### Reglas que viven en la base (no solo en la aplicacion)

En `prisma/migrations/20261004061200_constraints/migration.sql`:

- `stock >= 0` en `vaccine_lot` (tarea 3.2.3).
- `quantity > 0` en `stock_movement`.
- Coherencia entre `appointment.type`, `doctor_id` y `vaccine_id`.
- Indice unico parcial para que dos turnos de vacunacion no ocupen el mismo horario.
- Exclusion constraint para que un paciente no tenga dos turnos superpuestos.
- Triggers de inmutabilidad sobre `stock_movement`.

`npm run db:verify` intenta violar cada una contra la base real y muestra el error
que devuelve PostgreSQL, asi que se puede demostrar que las reglas se cumplen a
nivel de motor y no de aplicacion.

## Deploy en Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com).
2. En **Settings > Environment Variables** cargar las dos variables para Production,
   Preview y Development:

   | Variable | Valor de Neon | Para que se usa |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | Pooled connection | La app en runtime |
   | `DATABASE_URL_UNPOOLED` | Direct connection | `prisma migrate deploy` |

   Marcar las dos como **Sensitive** si el proyecto es publico.
3. Build command: `prisma migrate deploy && next build`.

`postinstall` ya corre `prisma generate`, asi que el cliente se compila solo.
`prisma generate` es codegen puro y no necesita credenciales, por eso
`prisma.config.ts` omite el `datasource` si no encuentra ninguna variable: asi
`npm install` y `next build` funcionan aunque falten las variables. Lo que si
exige `DATABASE_URL_UNPOOLED` es `migrate`, `db push`, `db seed` y `db studio`.

Cuidado con los deploys de preview: si apuntan a la misma base que produccion,
cada preview aplica las migraciones pendientes. Para evitarlo, usar una branch
distinta de Neon en los previews o deployar la base con un job aparte en vez de
incluir `migrate deploy` en el build.

Verificacion post-deploy:

- `/` muestra el estado de la conexion y la cantidad de filas de cada tabla.
- `/api/health` devuelve el mismo chequeo en JSON.

## Fuera de alcance en esta fase

`consultation_fee` (RF-34), obra social (RF-14), `audit_log` (RNF-04), pagos y
facturas (RF-15/16), notificaciones por mail (RF-07/10) y la API para la app
movil (RNF-05). Se resuelven en sus respectivos sprints.

## Seguridad: exposicion de credencial aceptada

Una contrasena de Neon quedo brevemente versionada durante el trabajo. La historia de
Git ya esta saneada con `--force-with-lease`, asi que **no esta en el repositorio**;
vive en `.env` y en las variables de Vercel.

El propietario decidio **no rotarla**: el proyecto no es de uso critico y el riesgo
se evaluo como aceptable. Queda registrado como decision consciente, no como
omision, junto con la exposicion residual, en
[`implementacion-ia/consideraciones-tecnicas.md`](implementacion-ia/consideraciones-tecnicas.md)
seccion 10. Ahi tambien esta el procedimiento de rotacion por si se decide despues.