# Consideraciones técnicas — SigMed

Registro de decisiones, desvíos conscientes y pendientes detectados durante la
implementación asistida por IA. Sirve para que el criterio quede escrito y no
dependa de la memoria de una conversación.

- [Prompts de trabajo](prompts.md)
- [Plan de Sprint 1](plan-sprint-1.md)

---

## 1. Roles: de la base de datos a Clerk

**Decisión.** El rol del usuario vive únicamente en Clerk
(`publicMetadata.role`). Se eliminó el enum `Role` y la columna
`user_profile.role`.

**Qué se conserva.** `user_profile.clerk_id` sigue en la base. La **identidad**
permanece en el sistema; lo que se mudó a Clerk es el **rol**. Ese campo es el
puente entre un usuario de Clerk y su perfil, sus fichas de `doctor` o
`patient`, y su firma en `stock_movement.actor_id`.

**Consecuencia asumida.** RF-24 dice que el administrador crea las cuentas del
personal. Con el rol fuera de la base, esa asignación deja de ser un `INSERT`/`UPDATE`
y pasa a ser una operación del Backend API de Clerk o del Dashboard. La base ya
no registra **quién** asignó cada rol ni **cuándo**. Si más adelante se necesita
esa auditoría, hay que resolverla en el lado de Clerk o guardar un log de eventos.

**Alternativa considerada y descartada.** Base de datos como fuente de verdad del
rol, con Clerk manejando solo la autenticación. Se descartó porque duplicaba el
dato y obligaba a mantenerlo sincronizado. Volver atrás es posible, pero implica
revertir la migración `20261004135801_drop_user_profile_role`.

---

## 2. Desvío consciente: administrador sin herencia de funciones

**Decisión.** `/medico` y `/paciente` quedan restringidos a sus propios roles. El
administrador tiene su propia área `/admin` y no accede a las de médico ni
paciente.

**Desvío documentado.** RF-26 establece que el administrador puede ejercer las
funciones de médico y de paciente. La implementación actual **no** implementa esa
herencia. Es una decisión consciente para mantener el control de acceso simple
durante la primera entrega.

**Pendiente.** Si el cliente valida RF-26 contra la aplicación, esto falla. La
corrección sería una matriz de permisos explícita en la capa de autorización, no
un `if` suelto por ruta. Anotado en el README para que no se pierda de vista.

---

## 3. Rutas sin protección en esta etapa

**Estado.** No hay autenticación implementada. No existen guards, y
`proxy.ts` de Clerk no fue creado todavía.

**Riesgo.** `/medico`, `/enfermera`, `/admin` y `/paciente` responden sin
verificar nada. **No desplegar a producción en este estado.**

**Mitigación prevista.** Un interruptor `SIGMED_DEV_ACTOR` habilita el actor de
desarrollo solo si `NODE_ENV !== "production"`. Las Server Actions que necesitan
`actor_id` hoy no bloquean sin sesión: resuelven un actor por defecto (ver §4).
Eso limita el engorro de la demo, pero **las páginas seguirían siendo accesibles**:
para un despliegue real hace falta además un gate de acceso.

---

## 4. Actor de desarrollo

**Problema.** US-3.2 CA2 exige trazabilidad inmutable del usuario responsable en
cada movimiento de stock. Sin Clerk no hay identidad real, y `stock_movement.actor_id`
es obligatorio.

**Solución.** `src/lib/dev-actor.ts` expone `getCurrentActor()`, que hoy resuelve
un `user_profile` desde una cookie de desarrollo. Cuando se integre Clerk, cambia
solo el interior de esa función para resolver por `clerk_id`. **La interfaz no
cambia y los Server Actions no se tocan.**

**Server Actions en lugar de un endpoint HTTP.** La primera implementación usó
`/api/dev/actor` con GET, POST y DELETE. Se eliminó y se rehízo con Server
Actions (`setDevActor` / `clearDevActor`). Un route handler que escribe una cookie
de identidad es una superficie de escalamiento de privilegios: cualquiera que lo
alcance se elige a sí mismo. La Server Action no es intrínsecamente más segura,
pero mantiene el control en el servidor y evita exponer el mecanismo.

**El control vive en el header, no en una banda.** La primera versión era una
banda ámbar con un `<select>` y un botón "Aplicar". Ahora el botón "Sesión sin
autenticar" del header es el login provisional: al presionarlo se despliega un
panel con un botón por usuario y basta con elegir uno. El "Salir" del header
también pasó de `disabled` a funcional.

**La lista no muestra roles.** No puede: en la Fase 1 el rol se sacó de la base
para que la fuente de verdad sea Clerk, y Clerk todavía no está integrado. Se
eligió mostrar nombre y email antes que inventar una etiqueta. Las relaciones
`Doctor` y `Patient` permitirían inferir "Médico" y "Paciente", pero Ana y Lucía
—las dos perfiles que más interesta distinguir— no tienen ninguna de las dos, así
que el resultado habría sido engañoso a medias.

**El panel se renderiza siempre, con `hidden`.** Con render condicional,
`aria-controls` del botón apuntaba a un elemento inexistente mientras el menú
estaba cerrado. Renderizarlo con `hidden` mantiene válida la referencia y saca
los botones del orden de tabulación, porque `display: none` los hace
infocalizables.

**El panel se cierra al hacer click, no cuando termina la acción.** La primera
versión cerraba con un `useEffect` que vigilaba `state.selectedId`, y eslint lo
rechazó con `react-hooks/set-state-in-effect`: setState en el cuerpo de un efecto
causa renders en cascada. Cerrar en el click evita eso, pero deja el error de la
acción oculto detrás del panel cerrado, así que **el error se renderiza fuera**,
en el mismo lugar donde aparecería el panel.

**Interruptor.** `isDevActorEnabled()` devuelve `true` si
`SIGMED_DEV_ACTOR === "1"` o si `NODE_ENV !== "production"`. En producción sin el
flag, `getCurrentActor()` devuelve `null` **sin tocar la base** y el control no se
renderiza: queda el `<span>` estático. Las Server Actions resuelven el actor con
`requireEnfermeraOAdministrador()`; hoy, si no hay sesión, esa función **no
bloquea**: usa como actor por defecto el primer enfermera/administrador de la
base para no cortar la demo. Es transitorio: al integrar Clerk la función debe
volver a exigir sesión.

**Elegir un usuario no da permisos.** El panel deja elegir cualquiera de los
perfiles activos, así que un paciente puede registrar movimientos de stock igual
que una enfermera. Es lo que habilita trabajar sin Clerk; el filtro por rol llega
con la integración.

**Trampa de prerender.** Durante `next build`, `NODE_ENV` es `production`, así que
`isDevActorEnabled()` devuelve `false` y las páginas del portal se prerenderizan
estáticas **sin el selector**. Poner `SIGMED_DEV_ACTOR=1` en un deploy no
alcanzaría: se seguiría sirviendo el HTML horneado. Por eso
`src/app/(portal)/layout.tsx` lleva `export const dynamic = "force-dynamic"`, que
fuerza la evaluación de la cookie y del flag en cada request.

**Pendiente.** El interruptor protege las escrituras pero **no las páginas**: las
cuatro áreas siguen accesibles sin restricción. Para un despliegue real hace falta
un gate de acceso adicional. Ver [§3](#3-rutas-sin-protección-en-esta-etapa).

---

## 5. Validación sin librería

**Decisión.** No se usa zod ni ninguna librería de validación.

**Implementación.** `src/lib/forms.ts` expone tres primitivas —`text()`, `int()` y
`date()`— sin abstracción de schemas. Cada Server Action accumulates los errores
en un objeto con `if` explícitos y devuelve `{ ok: false, errors }`. El ciclo de
render de errores usa `useActionState` de React 19, que ya está disponible.

**Duplicados.** En vez de cazar el código de error `P2002` de Prisma, se valida con
`findUnique` antes de insertar. `vaccine.name` es único y
`vaccine_lot(vaccineId, lotNumber)` también, así que el chequeo previo cubre el
caso real y devuelve un error de campo legible. La constraint de la base sigue
siendo la garantía final contra carreras. Además, el cliente generado de Prisma
(`src/generated/prisma/client.ts`) **no** re-exporta el namespace `Prisma`, así que
las clases de error solo serían accesibles por una ruta interna del SDK: se evitó.

---

## 6. Movimiento `AJUSTE` y egresos

**Problema.** El enum `MovementType` no tiene un tipo de *egreso libre*: la salida
de dosis ocurre solo por `asignacion_turno` (`-1`, exige turno de vacunación) y
`devolucion_turno` (`+1`, exige turno de vacunación). `docs/BD.md` no prevé ir a
la farmacia a devolver stock.

**Decisión (post-reforma).** El formulario de US-3.2 ofrece `INGRESO` y `AJUSTE`.
El ajuste admite **cantidad con signo** (negativa para descontar, positiva para
rectificar), exige **motivo justificado** (CHECK `movimiento_stock_ajuste_motivado`)
y sirve de baja manual de stock hasta que exista el flujo de turnos de vacunación
(US-3.6). No existe `EGRESO`.

**Signo por tipo.** `docs/BD.md` define el signo de cada asiento: ingreso y
devolución positivos, asignación igual a `-1`, ajuste libre (pero distinto de 0).
El CHECK `movimiento_stock_signo_por_tipo` lo fuerza en la base y
`registerStockMovement` lo replica antes de escribir.

**Validaciones de app además de la base.** `src/lib/stock.ts` rechaza: cantidad 0,
ingreso negativo, ajuste sin motivo, ingreso sobre un lote vencido (los lotes
vencidos quedan inhabilitados para asignación *y* para recibir más unidades) y
alta de un lote cuyo vencimiento ya pasó. `src/lib/stock.ts` es una función
pública que otras pantallas van a llamar —por ejemplo, el consumo de un turno en
US-1.x—, así que el chequeo vive en el servicio, no solo en la Server Action.

**Alerta única.** La regla "a lo sumo una alerta activa por vacuna" de `docs/BD.md`
la sostiene el trigger (`FOR UPDATE` sobre la vacuna) y la blinda un índice único
parcial `alerta_stock_activa_unica` sobre `(id_vacuna) WHERE estado = 'activa'`.

---

## 7. Bug corregido en el seed: lote `LT-FIEB-2402`

**Detectado.** El lote tenía movimientos de `+12` (ingreso) y `+2` (ajuste), pero
`quantity_available` estaba en `10`. Los otros tres lotes reconciliaban bien.

**Impacto.** La pantalla de movimientos de US-3.2 muestra el historial junto al
stock actual, así que la inconsistencia habría quedado visible en la UI.

**Corrección.** `quantity_available` pasó de `10` a `14` en `prisma/seed.ts`.
Verificado: los cuatro lotes ahora reconcilian.

---

## 8. Migración creada a mano

**Detalle operativo.** `prisma migrate dev` es interactivo y no puede ejecutarse en
un entorno no interactivo. La migración se escribió directamente en
`prisma/migrations/20261004135801_drop_user_profile_role/migration.sql` y se aplicó
con `prisma migrate deploy`.

**Orden de las operaciones** (importante si alguna vez hay que revertir):
1. `DROP INDEX` — depende de la columna.
2. `ALTER TABLE ... DROP COLUMN` — la columna.
3. `DROP TYPE` — el enum, ya sin referencias.

Prisma advierte que se descartan 7 valores no nulos de `role`. Es esperado.

**Trampa encontrada.** Tras modificar el schema hay que correr `npm run db:generate`
**antes** de `db:seed`. El cliente generado conservó `role` en el modelo y el seed
falló con `P2022: The column 'role' does not exist`.

---

## 9. Notas de SQL con Prisma y Postgres

Dos cosas que aparecieron y conviene recordar:

- `information_schema.columns.column_name` y `pg_type.typname` son del tipo `name`
  de Postgres, que Prisma no deserializa. Hay que castear: `column_name::text`.
  Sin el cast, falla con `P2010 UnsupportedNativeDataType`.
- Las columnas `name`/`label` de las vistas del catálogo del sistema son el caso
  típico. Para consultas de introspección, castear siempre.
- Lo mismo pasa con `pg_trigger.tgname` y `tgenabled`: castear a `::text`.
- El `name:` de un `@@unique([...], name: "...")` **reemplaza** el nombre del
  campo de la clave compuesta en el cliente generado. En `vaccine_lot` el
  `@@unique` se llama `vaccine_lot_number_unique`, así que el `where` se escribe
  `vaccine_lot_number_unique: { vaccineId, lotNumber }` y **no**
  `vaccineId_lotNumber`, que es lo que genera Prisma cuando no se le da nombre.
  El nombre por defecto no existe en los tipos y el error es un `TS2353` poco
  descriptivo.

---

## 10. Seguridad: exposición de credencial, aceptada

**Situación.** Una contraseña de Neon se expuso en una conversación y fue
versionada brevemente. La historia ya está saneada con
`git push --force-with-lease` y el objeto local se purgó, de modo que **la
credencial no está en la historia de Git del repositorio**. Sigue presente en el
`.env` local y en las variables de Vercel, que es donde corresponde estar.

**Decisión del propietario (2026-10-04).** No rotar la contraseña. El proyecto no
es de uso crítico y se evaluó que el riesgo de exposición no justifies la
rotación. **Riesgo aceptado de forma consciente**, no por omisión.

**Exposición residual que queda asumida:**
- La contraseña circulated en texto plano por un canal de conversación.
- Si ese canal queda accesible para terceros, la base queda accesible para ellos.
- `.env` y las variables de Vercel siguen conteniendo la credencial.

**Si más adelante se decide rotar**, el orden es: rotar en Neon → actualizar
`.env` → actualizar `DATABASE_URL` y `DATABASE_URL_UNPOOLED` en Vercel →
redesplegar. No hay migración pendiente que afecte este cambio.

---

## 11. Un alta de vacuna es irreversible

**Descubierto al probar la Fase 4.** No se puede borrar una vacuna del catálogo:
`vaccine_lot` referencia a `vaccine` con `onDelete: Restrict`, y encima el trigger
`stock_movement_no_delete` rechaza borrar movimientos. Los tres pasos de limpieza
se bloquean en cadena.

**Consecuencia de producto.** Si una enfermera escribe "Vacuna antitetanica" y le
equivoca la grafía, el registro queda permanente. No hay ningún camino de
corrección en la UI.

**Por qué no se agrega un "borrar".** Rompería la trazabilidad que US-3.2 CA2
exige. El movimiento de stock es la evidencia; si se puede borrar la fila que lo
origina, el historial deja de significar algo.

**Qué corresponde.** El schema ya tiene `vaccine.is_active` y `user_profile.is_active`,
que es la vía prevista: desactivar en lugar de borrar. Falta la pantalla que lo
permita, y conviene que el catálogo ofrezca esa opción desde el principio para que
un error de tipeo tenga arreglo.

**Alcance de la prueba.** Durante la validación se creó una vacuna de prueba y
hubo que limpiarla. Se hizo desactivando el trigger dentro de una transacción, de
modo que si algo fallaba el trigger volvía a su estado anterior. El DDL de
Postgres es transaccional y ese es el mecanismo, pero es una operación que solo
debe hacerse con una base descartable: la de este proyecto es una base Neon
compartida y **no** se debe correr `prisma migrate reset` contra ella.

---

## 12. Deuda técnica

- [ ] `npm audit` reporta vulnerabilidades **high** sin resolver. No se corrió
      `npm audit fix --force` para no tocar versiones mayores sin decisión explícita.
- [ ] Prisma 7.10.0 tiene disponible 8.0.0-rc.19. Actualización mayor, no
      prioridad actual.
- [ ] No hay forma de desactivar una vacuna desde la UI, aunque `vaccine.is_active`
      ya exista en el schema. Ver [§11](#11-un-alta-de-vacuna-es-irreversible).

---

## 13. Convenciones observadas

- Tipos generados de Next.js 16 en props: `PageProps<"/enfermera/vacunas">`,
  `LayoutProps<"/">`. No `params: Promise<...>` manuales.
- Rutas en español, siguiendo los RF.
- Route group `(portal)` para el shell compartido, para que los prefijos públicos
  `/medico`, `/enfermera`, `/admin` y `/paciente` no lleven segmento extra.
- Las reglas que Prisma no puede expresar van en SQL manual con su comentario
  explicativo, como ya se hizo en `20261004061200_constraints`.
- Las reglas de negocio que tocan la base van en `src/lib/stock.ts`, sin importar
  `next/headers`, recibiendo el `actorId` como parámetro y lanzando
  `StockRuleError` con errores de campo. Las Server Actions se quedan con el
  `FormData`, el actor y la traducción. Así la lógica se puede probar de verdad
  contra la base, en vez de copiar la transacción en un script y probar la copia.
