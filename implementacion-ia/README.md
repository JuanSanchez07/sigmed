# Implementación asistida por IA

Documentación del trabajo de implementación de SigMed con asistencia de IA:
decisiones tomadas, desvíos registrados, trampas encontradas y los prompts que
definieron el rumbo.

## Contenido

| Archivo | Qué hay |
| --- | --- |
| [consideraciones-tecnicas.md](consideraciones-tecnicas.md) | Decisiones de arquitectura, desvíos conscientes, trampas y deuda técnica |
| [plan-sprint-1.md](plan-sprint-1.md) | Alcance y fases del Sprint 1, con estado |
| [prompts.md](prompts.md) | Prompts de trabajo normalizados |

## Cómo usar esta carpeta

`consideraciones-tecnicas.md` es la referencia técnica. Cada decisión tiene un
número de sección estable para poder citarla desde el README o desde un commit.
Si más adelante se cambia una decisión, se actualiza la sección correspondiente en
lugar de agregar una entrada nueva: así no quedan dos versiones contradictorias.

`plan-sprint-1.md` lleva el estado de avance. Las fases se marcan como
completadas a medida que se cierran, con los comandos de validación ejecutados.

`prompts.md` deja claro qué se decidió por indicación del cliente y qué por
criterio propio. Es lo que permite revertir una decisión sin tener que reconstruir
la conversación.

## Nota de seguridad

Esta carpeta no contiene secretos. La credencial de Neon que se expuso durante el
trabajo **no se rotó por decisión del propietario**: está registrado como riesgo
aceptado en [consideraciones §10](consideraciones-tecnicas.md), junto con la
exposición residual y el procedimiento por si se decide rotarla más adelante.
