# Prompts de trabajo

Prompts ordenados por el momento en que definieron el rumbo del trabajo. Se dejan
documentados por dos motivos: para poder reproducir el resultado, y para dejar
visible **qué decisiones se tomaron por indicación explícita** y cuáles por
criterio propio de la implementación.

---

## 1. Punto de partida

> Sabés si se puede cambiar el approach y usar web app en lugar de mobile app?
>
> Assistants are limited to 16 GB of storage

Contexto: se evaluó Arrangi y se decidió descartarlo por el límite de
almacenamiento del dispositivo. Se pasa a una web app con Next.js, Neon y Vercel.

---

## 2. Arranque de la base

> Generame el README con las instrucciones para conectar la base de datos en Neon
>
> Dale, ahí me habilité la cuenta, prosigamos con el setup

Contexto: se crea el README con el flujo de Neon, la base real queda conectada y
el health check `/api/health` pasa a responder `200`.

---

## 3. Documentación de requisitos

> Revisa la documentación de "docs" y definamos el alcance del MVP

Contexto: aparecen los tres documentos de `docs/` y se extraen las seis historias
de Sprint 1, los roles y las dependencias entre RF.

---

## 4. Definición del alcance de rutas

> ¿Podrías hacer un plan para generar las rutas de los roles y empezar a
> implementar las US relacionadas con las vacunas?

Acá se define el objetivo de la primera entrega: esqueleto de las cuatro áreas de
rol más US-3.1 y US-3.2.

---

## 5. Decisiones de arquitectura

Cuatro preguntas cerradas sobre Clerk, la fuente del rol, la semántica del
administrador y el alcance de la entrega:

| Decisión | Respuesta |
| --- | --- |
| Auth en esta entrega | Solo estructura, sin auth todavía |
| Fuente del rol | Solo Clerk; eliminar los roles de la base |
| Alcance del admin | Área propia; `/medico` y `/paciente` solo para sus roles |
| Alcance de la entrega | Rutas + US-3.1 y US-3.2 |

### Consecuencia no prevista

La combinación de las dos primeras respuestas es contradictoria: si el rol vive
solo en Clerk y Clerk no está integrado, no hay forma de conocer el rol ni el
actor real. Se detectó y se resolvió con una pregunta específica:

> Elegiste roles solo en Clerk pero sin auth todavía. Sin Clerk no hay forma de
> saber el rol ni el actor real, y US-3.2 CA2 exige trazabilidad del
> responsable. ¿Cómo lo resolvemos?

**Respuesta:** quitar `role` ahora de la base y agregar un actor de desarrollo
temporal.

Se acordó además que las cuatro áreas se levanten con placeholders, no solo
`/enfermera`.

---

## 6. Validación sin librerías

> no quiero que uses zod por ahora para no agregar complejidad a la app

Decisión explícita del cliente: cero dependencias de validación. Se implementa
`src/lib/forms.ts` con tres primitivas y checks explícitos por acción. Ver
[consideraciones §5](consideraciones-tecnicas.md).

---

## 7. Arranque de la implementación

> arranca con la fase 1 y quiero que documentes todas las consideraciones en un
> archivo .md en una nueva carpeta que se llame /implementacion-ia dentro de la
> carpeta del proyecto, quiero que tambien ahi agregues los prompts que estuvimos
> utilizando en limpio

Define el contenido de esta carpeta: decisiones, desvíos, pendientes y los
prompts usados.

---

## Nota sobre la transcripción

Estos prompts están **reconstruidos y normalizados** a partir de la conversación;
no son una copia literal. Se limpiaron mayúsculas, tildes y errores de tipeo, y
se reconstruyeron los fragmentos que habían llegado truncados por longitud del
mensaje. El sentido y las decisiones que se derivan de ellos se conservan.
