# Requerimientos Funcionales

## 1. Gestión de agenda médica
* **RF-01:** Definir disponibilidad horaria mensual del médico (días, horarios y duración de consulta).
* **RF-02:** Apertura automática de agenda pública según la configuración del médico.
* **RF-03:** Bloqueo de agenda por licencias, feriados o imprevistos del profesional.
* **RF-04:** Consulta de agenda y hoja de trabajo diaria del médico.
* **RF-27:** Modificación de los horarios de atención por el administrador.
* **RF-28:** Marcación de un turno como no disponible por el médico.

## 2. Reserva de turnos
* **RF-05:** Búsqueda y filtrado de turnos disponibles por especialidad, médico o fecha.
* **RF-06:** Confirmación de reserva de turno por parte del paciente.
* **RF-07:** Envío automatizado de correos electrónicos de confirmación y recordatorios de cita.
* **RF-08:** Cancelación y reprogramación de turnos por parte del paciente.
* **RF-09:** Permitir al médico o al personal administrativo cancelar un turno o suspender un periodo de tiempo por motivos imprevistos o de fuerza mayor.
* **RF-10:** Notificación automática al paciente por cancelación de turno.
* **RF-29:** Registro de la asistencia del paciente al turno.
* **RF-30:** Reserva de turno por el administrador a solicitud presencial.

## 3. Gestión de vacunas
* **RF-11:** Registro y actualización del inventario/stock de vacunas disponibles por parte de las enfermeras.
* **RF-12:** Asignación y reserva de turnos específicos para vacunación.
* **RF-13:** Generación de alertas automáticas por bajo stock de vacunas críticas.
* **RF-31:** Aprobación de la solicitud de turno de vacunación por la enfermera.
* **RF-32:** Definición del nivel de stock crítico de cada vacuna.
* **RF-33:** Alta de nuevas vacunas en el inventario por la enfermera.

## 4. Gestión de pagos y coberturas
* **RF-14:** Registro de cobertura médica/obra social del paciente y validación.
* **RF-15:** Procesamiento de pagos para consultas particulares.
* **RF-16:** Emisión y descarga de comprobantes/facturas digitales.
* **RF-34:** Definición del valor de la consulta por cada médico.
* **RF-35:** Cobro de la totalidad del turno ante la inasistencia del paciente.

## 5. Historial clínico
* **RF-17:** Carga de diagnósticos, indicaciones y tratamientos en la ficha digital por parte del médico.
* **RF-18:** Consulta remota del historial médico por parte del paciente.

## 6. Reportes administrativos
* **RF-19:** Generación de reporte de cantidad de turnos atendidos/cancelados por especialidad.
* **RF-20:** Generación de reporte de stock y consumo de vacunas.
* **RF-21:** Generación de reporte de ingresos por pagos y ausentismo de pacientes.

## 7. Acceso, autenticación y gestión de usuario
* **RF-22:** Registro autogestionado de cuenta de paciente.
* **RF-23:** Inicio de sesión mediante correo electrónico.
* **RF-24:** Creación de cuentas del personal de la sala por el administrador.
* **RF-25:** Diferenciación de la interfaz según el rol del usuario.
* **RF-26:** Ejercicio de las funciones de médico y de paciente por el administrador.

---

# Planillas de los requerimientos

### RF-01: Carga de horarios de atención
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Carga de horarios de atención. |
| **ID** | RF-01 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a cada médico cargar sus horarios de atención disponibles. |
| **Términos** | Horarios de atención (franja horaria que un profesional habilita en un tiempo determinado). |
| **Justificación** | Es la base del sistema, sin esta información no es posible ofrecerles turnos a los pacientes. |
| **Prioridad** | Media. |
| **Dependencias** | RF-23 |
| **Documentos** | Cronograma / Planilla de Horarios del Profesional. |
| **Argumentos de factibilidad** | Todos los médicos ya cuentan con un horario fijo lo cual simplifica la carga inicial, se puede implementar fácilmente. |
| **Métodos de verificación** | Pruebas funcionales: Un médico carga su horario y se verifica que su agenda se actualice correctamente reflejando los horarios cargados. |

---

### RF-02: Apertura automática de agenda pública según la configuración del médico
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Apertura automática de agenda pública según la configuración del médico. |
| **ID** | RF-02 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe generar y publicar automáticamente la agenda de turnos disponibles para los pacientes, a partir de la configuración de disponibilidad cargada por el médico (RF-01). |
| **Términos** | Agenda pública (vista de turnos disponibles visible y reservable por los pacientes). |
| **Justificación** | Automatiza el proceso de puesta a disposición de turnos, evitando que un administrativo deba publicarlos manualmente. |
| **Prioridad** | Media. |
| **Dependencias** | RF-01 |
| **Documentos** | Agenda Pública de Turnos. |
| **Argumentos de factibilidad** | Es una transformación directa de los datos de RF-01, no requiere lógica compleja adicional. |
| **Métodos de verificación** | Pruebas funcionales: Al guardar la disponibilidad de un médico, verificar que los turnos correspondientes aparezcan disponibles en la vista de reserva del paciente. |

---

### RF-03: Bloqueo de agenda médica por licencias, feriados o imprevistos
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Bloque de agenda médica por licencias, feriados o imprevistos |
| **ID** | RF-03 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a cada médico (o al personal administrativo en su nombre) seleccionar y bloquear días completos, franjas horarias o turnos específicos de su agenda mensual previamente publicada. Al confirmar el bloqueo por licencias, feriados o imprevistos, el sistema deshabilita la posibilidad de nuevas reservas en esa franja y marca los turnos como suspendidos/cancelados. |
| **Términos** | Bloqueo de agenda |
| **Justificación** | Otorga flexibilidad a los profesionales de la salud para gestionar imprevistos personales o licencias, previniendo que los pacientes reserven turnos en horarios en los que el médico no estará disponible en la sala médica. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-02 (Apertura automática de agenda pública). |
| **Documentos** | Reglamento Interno de Licencias y Francos del Personal Médico |
| **Argumentos de factibilidad** | Se garantiza su cumplimiento ejecutando una consulta de actualización (UPDATE) en la base de datos relacional sobre la tabla de turnos para el rango de fechas seleccionado, lo que cambiará su estado a 'Bloqueado' e impedirá que el servicio de búsqueda pública devuelva esos horarios a los pacientes. |
| **Métodos de verificación** | Prueba funcional ingresando con el rol Médico, seleccionando una fecha con agenda publicada, aplicando un bloqueo por licencia y verificando desde la interfaz de Paciente que dichos horarios ya no aparecen disponibles para reservar. |

---

### RF-04: Consulta de agenda y hoja de trabajo diaria del médico
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Consulta de agenda y hoja de trabajo diaria del médico. |
| **ID** | RF-04 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al médico visualizar su grilla de turnos reservados por día/semana, filtrando por estado de turno: confirmado, atendido, ausente, e identificando los datos del paciente. |
| **Términos** | Médico, Paciente, Turno, Estado de turno. |
| **Justificación** | Es necesario para que el médico pueda conocer y organizar su jornada laboral, verificar quienes son los pacientes agendados y llevar el control de presentismo, lo cual es el paso previo y necesario para luego cargar diagnósticos y tratamientos en el historial clínico. |
| **Prioridad** | Alta. |
| **Dependencias** | RF-06, RF-29 |
| **Documentos** | Reglamento interno de organización de turnos y agendas médicas de la sala, Manual de procedimientos operativos de atención médica en consultorios externos, Ley N° 25.326 (Protección de Datos Personales). |
| **Argumentos de factibilidad** | Se garantiza su cumplimiento mediante la implementación de consultas a la base de datos que filtren los turnos asociados al ID del médico que inició sesión, acotados por la fecha seleccionada. Los estados se pueden manejar como atributos actualizables en el modelo de datos de cada turno. |
| **Métodos de verificación** | Pruebas funcionales: Un médico inicia sesión con sus credenciales y al acceder a la pantalla de agendas/turnos verifica si solo ve sus turnos correspondientes para el día o semana seleccionados, junto con los datos de los pacientes. |

---

### RF-05: Búsqueda y filtrado de turnos disponibles
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Búsqueda y filtrado de turnos disponibles |
| **ID** | RF-05 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al paciente buscar y filtrar los turnos disponibles por especialidad, médico o fecha. |
| **Términos** | Filtrado (mecanismo de búsqueda que acota los resultados según criterios seleccionados por el usuario). Especialidad (clínico, pediatra, traumatólogo). |
| **Justificación** | Es el punto de entrada del flujo de reserva, sin una búsqueda eficaz el paciente no puede encontrar un turno acorde a su necesidad. |
| **Prioridad** | Media. |
| **Dependencias** | RF-02 |
| **Documentos** | Agenda Pública de Turnos. |
| **Argumentos de factibilidad** | Es una consulta estándar sobre la base de turnos disponibles con filtros combinables, no presenta complejidad técnica relevante. |
| **Métodos de verificación** | Pruebas funcionales: Aplicar combinaciones de filtros y verificar que los resultados devueltos por el sistema correspondan exactamente a los criterios seleccionados. |

---

### RF-06: Confirmación de reserva de turno por parte del paciente
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Confirmación de reserva de turno por parte del paciente |
| **ID** | RF-06 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al paciente confirmar su asistencia a su turno previamente reservado, cambiando su estado a "confirmado". |
| **Términos** | Paciente, Turno, Notificación, Estado de reserva, Token de confirmación. |
| **Justificación** | Reducir la tasa de ausentismo, optimizar la disponibilidad del personal médico y posibilitar la reasignación de turnos no confirmados. |
| **Prioridad** | Media. |
| **Dependencias** | RF-05, RF-07 |
| **Documentos** | Reglamento de admisión y asignación de turnos de la sala médica. Ley Nacional N° 26.529 (Derechos del Paciente, Historia Clínica y Autonomía de la Voluntad). Ley N° 25.326 (Protección de Datos Personales). |
| **Argumentos de factibilidad** | Implementación técnicamente viable mediante el uso de tokens únicos de confirmación de un solo uso en enlaces web o respuestas automatizadas por canal de mensajería estándar. |
| **Métodos de verificación** | Pruebas funcionales e integración end-to-end enviando un evento de confirmación de prueba y verificando que el registro del turno actualice su estado a "Confirmado" en la base de datos de manera inmediata. |

---

### RF-07: Envío automatizado de correos electrónicos de confirmación y recordatorios de cita
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Envío automatizado de correos electrónicos de confirmación y recordatorios de cita |
| **ID** | RF-07 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe enviar automáticamente un correo electrónico al paciente al momento de confirmar su reserva junto con los detalles de la misma y enviar recordatorios a medida que la fecha se acerque. |
| **Términos** | Correo de confirmación, recordatorio. |
| **Justificación** | Es necesario para evitar la tasa de ausentismo sin previo aviso y asegurar que el paciente disponga de un comprobante digital con la información de su cita médica. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-05 |
| **Documentos** | Política institucional de comunicaciones digitales y notificaciones a pacientes. Ley N° 25.326 (Protección de Datos Personales). Ley Nº 24.240 (Defensa del Consumidor / Información al Usuario). |
| **Argumentos de factibilidad** | Se garantiza mediante la integración del backend con un servicio o API de envío de correos electrónicos (como SMTP, Resend o SendGrid). Para los recordatorios, se implementarán tareas programadas (*cron jobs*) que consulten periódicamente la base de datos en busca de turnos próximos a cumplirse y disparen los correos correspondientes. |
| **Métodos de verificación** | El paciente ingresa al sistema con su usuario de paciente, realiza una reserva de turno y verifica en la bandeja de entrada de su correo si recibió un mail de confirmación con los datos correctos de su turno. El día anterior al del turno deberá revisar si recibió un recordatorio a su bandeja de entrada. |

---

### RF-08: Cancelación y reprogramación de turnos por parte del paciente
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Cancelación y reprogramación de turnos por parte del paciente. |
| **ID** | RF-08 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al paciente cancelar un turno confirmado o reprogramarlo a un nuevo horario disponible. |
| **Términos** | Reprogramación (cancelación de un turno existente con reserva simultánea de un nuevo turno, sin perder la relación con la solicitud original). |
| **Justificación** | Brinda autonomía al paciente ante cambios de disponibilidad, reduciendo la carga administrativa de gestionar estos cambios manualmente. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-05, RF-06 |
| **Documentos** | Comprobante de cancelación/reprogramación de turno. |
| **Argumentos de factibilidad** | La cancelación libera el slot para que vuelva a estar disponible; la reprogramación combina una cancelación con una nueva reserva en la misma operación. |
| **Métodos de verificación** | Prueba funcional: Cancelar un turno y verificar que vuelva a la agenda pública como disponible. Reprogramar un turno y verificar que el turno original quede liberado y el nuevo quede confirmado. |

---

### RF-09: Cancelación de turnos o suspensión de agenda por imprevistos
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Cancelación de turnos o suspensión de agenda por imprevistos |
| **ID** | RF-09 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al médico o al personal administrativo cancelar un turno específico o suspender un periodo de tiempo completo de la agenda por motivos imprevistos o de fuerza mayor. |
| **Términos** | Personal administrativo, personal médico, suspensión. |
| **Justificación** | Es necesario mantener la agenda actualizada y reflejar la disponibilidad de turnos real ante situaciones inesperadas para evitar que pacientes asistan en vano. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-06 |
| **Documentos** | Reglamento interno de licencias y francos del personal médico. Calendario oficial de feriados nacionales (Ministerio del Interior). Protocolo institucional de contingencias y cancelación de servicios asistenciales. |
| **Argumentos de factibilidad** | Se garantiza implementando una función en la interfaz de gestión que permita seleccionar un turno individual o un rango de fechas/horas y actualice su estado a "Cancelado" en la base de datos, bloqueando simultáneamente esos espacios para impedir futuras reservas. |
| **Métodos de verificación** | Un médico inicia sesión con su cuenta con credenciales de médico, accede a la vista de gestión de agenda, selecciona un turno ya reservado o un bloque horario en estado "disponible" y selecciona la opción "Cancelar turno/Suspender horarios". Luego se verifica que el turno/bloque haya cambiado de horario correctamente y comprobar que los horarios suspendidos ya no figuren como disponibles para ser reservados. |

---

### RF-10: Notificación automática por cancelación de turno
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Notificación automática por cancelación de turno |
| **ID** | RF-10 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe notificar automáticamente, por correo electrónico, a cada paciente cuyo turno reservado haya sido cancelado por el médico o personal administrativo. La notificación debe incluir los datos del turno cancelado (médico, especialidad, fecha y hora), la causa de la cancelación y un link que mande al usuario directo a la reprogramación del turno. |
| **Términos** | Reprogramación por turno cancelado. |
| **Justificación** | Mantiene al usuario informado sobre el estado de su turno y evita que personas asistan a la sala médica cuando su turno ya no existe, previniendo malentendidos y una mala imagen para la institución. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-03, RF-09 |
| **Documentos** | Comprobante de cancelación de turno. |
| **Argumentos de factibilidad** | Se garantiza creando un sistema de notificación automática que se active al momento en el que un turno cambia al estado "cancelado". |
| **Métodos de verificación** | Con un turno reservado por un paciente, desde el rol de médico cancelarlo especificando un motivo y verificar que el paciente reciba la notificación pertinente con fecha, hora, médico y especialidad, causa de cancelación y el link para reprogramar. Luego repetir la prueba desde el rol administrativo. |

---

### RF-11: Registro y actualización del inventario/stock de vacunas disponibles
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Registro y actualización del inventario/stock de vacunas disponibles |
| **ID** | RF-11 |
| **Categoría** | Funcional |
| **Descripción** | El sistema permite dar de alta y actualización de vacunas con tipo, lote, vencimiento y cantidad. |
| **Términos** | Stock de vacunas. |
| **Justificación** | Es necesario para mantener la trazabilidad de cada vacuna y control de stock de vacunas. |
| **Prioridad** | Media/Alta. |
| **Dependencias** | RF-23 |
| **Documentos** | Calendario Nacional de Vacunación y manual de cadena de frío. |
| **Argumentos de factibilidad** | Cumple normativas de trazabilidad de biológicos y auditoría sanitaria. |
| **Métodos de verificación** | Trazabilidad inmutable de usuario, fecha y lote por movimiento. |

---

### RF-12: Asignación y reserva de turnos específicos para vacunación
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Asignación y reserva de turnos específicos para vacunación |
| **ID** | RF-12 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a los usuarios con rol de enfermera o administrador asignar turnos específicos para vacunación, condicionando la reserva a la disponibilidad de stock físico de las vacunas en la sala médica. Los pacientes van de forma presencial a solicitar el turno. |
| **Términos** | Enfermeras, stock de vacunas, turno de vacunación. |
| **Justificación** | Indispensable para organizar la asistencia de los pacientes a vacunarse y garantizar que no se otorguen citas si no hay dosis en stock, evitando inconvenientes con pacientes. |
| **Prioridad** | Media/Alta. |
| **Dependencias** | RF-11 |
| **Documentos** | Manual de procedimientos del Vacunatorio de la Sala Médica. Calendario Nacional de Vacunación (Ministerio de Salud de la Nación). Normativa sobre Trazabilidad y Control de Stock de Medicamentos y Vacunas (ANMAT). |
| **Argumentos de factibilidad** | Se garantiza implementando un control de validación al momento de solicitar el turno. El sistema consultará la tabla de inventario en la base de datos y solo permitirá la confirmación si la cantidad de la vacuna requerida es mayor a cero. Al confirmar, se puede descontar (o reservar lógicamente) una unidad del stock disponible. |
| **Métodos de verificación** | La enfermera inicia sesión en el sistema, luego ingresa las credenciales válidas del paciente, selecciona la opción de reservar turno de vacunación y dependiendo del stock de la vacuna es aceptado o rechazado. En caso de ser aceptado, revisar que el turno haya sido asignado correctamente; caso contrario, revisar que el sistema haya impedido la reserva, indicando la falta de disponibilidad de dosis. |

---

### RF-13: Generación de alertas automáticas por bajo stock de vacunas críticas
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Generación de alertas automáticas por bajo stock de vacunas críticas |
| **ID** | RF-13 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe monitorear continuamente el inventario de vacunas catalogadas como "críticas" y generar alertas automáticas (notificaciones en pantalla, correos o mensajes) al personal responsable cuando el nivel de stock caiga por debajo del umbral mínimo definido para cada lote o insumo. |
| **Términos** | Vacuna crítica, Umbral de stock mínimo, Alerta automática, Inventario, Punto de reorden. |
| **Justificación** | Prevenir el desabastecimiento de insumos biológicos esenciales, garantizando la continuidad de las jornadas de vacunación y reduciendo riesgos para la salud pública o institucional. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-11 |
| **Documentos** | Plantilla de notificación urgente a responsables. |
| **Argumentos de factibilidad** | Implementable mediante tareas programadas (*cron jobs*) o disparadores en la base de datos (*triggers*) que comparen el conteo de stock disponible contra el umbral en cada transacción o intervalo predeterminado. |
| **Métodos de verificación** | Pruebas de integración registrando la salida o consumo de un lote de vacunas críticas hasta superar el umbral mínimo, comprobando que la alerta se cree en la base de datos y se envíe la notificación correspondiente al usuario designado. |

---

### RF-14: Registro de cobertura médica/obra social del paciente y validación
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Registro de cobertura médica/obra social del paciente y validación |
| **ID** | RF-14 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir registrar la obra social o prepaga del paciente y realizar la validación de la cobertura para la atención médica o consulta. |
| **Términos** | Paciente, cobertura médica, obra social, validación de obra social. |
| **Justificación** | Agiliza el proceso de recepción, informa correctamente los costos para el paciente antes de la consulta y permite liquidar las prestaciones o cobrar los montos particulares necesarios. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-06 |
| **Documentos** | Documentos con información relevante para este requerimiento. |
| **Argumentos de factibilidad** | Implementación de integraciones o tablas maestras de obras sociales para validación de afiliaciones. |
| **Métodos de verificación** | Registro de un paciente con obra social y verificación de la validación exitosa o rechazo según el estado de la cobertura. |

---

### RF-15: Procesamiento de pagos para consultas particulares
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Procesamiento de pagos para consultas particulares |
| **ID** | RF-15 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a los pacientes abonar consultas particulares a través de una pasarela de pago integrada, registrando la transacción una vez confirmado el pago. |
| **Términos** | Consulta particular (Atención abonada directamente por el paciente sin intermediación de una obra social o prepaga). Pasarela de pago (servicio externo que procesa la transacción financiera). |
| **Justificación** | Digitaliza el cobro de consultas particulares, uno de los objetivos explícitos de POS. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-06 (el pago se asocia a un turno confirmado) |
| **Documentos** | Orden o solicitud de cobro de consulta particular. |
| **Argumentos de factibilidad** | Se implementa mediante la integración con una pasarela de pago externa (vía API). |
| **Métodos de verificación** | Ejecución de pagos de prueba mediante el entorno de sandbox de la pasarela y validación del cambio de estado del pago en la base de datos. |

---

### RF-16: Emisión y descarga de comprobantes/facturas digitales
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Emisión y descarga de comprobantes/facturas digitales |
| **ID** | RF-16 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir emitir, consultar y descargar comprobantes o facturas digitales correspondientes a las transacciones y pagos realizados por consultas particulares o prestaciones médicas. |
| **Términos** | Factura/Comprobante digital, paciente, transacción. |
| **Justificación** | Brinda transparencia fiscal y administrativa al proceso de cobro, respalda contablemente los ingresos y provee una constancia de pago válida para el paciente. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-15 |
| **Documentos** | Normativa de Facturación Electrónica de la AFIP (Régimen de Emisión de Comprobantes Electrónicos - Factura A/B/C). Ley N° 24.240 (Defensa del Consumidor). Reglamento Interno de Facturación y Contabilidad. |
| **Argumentos de factibilidad** | Generación automática de documentos PDF respaldados en el backend tras el procesamiento del pago, asociando el enlace del comprobante al ID de la transacción. |
| **Métodos de verificación** | Un paciente inicia sesión, realiza el pago de una consulta y se verifica que el sistema genere el comprobante digital correspondiente en el historial de pagos y que la descarga produzca un PDF legible con los datos correctos. |

---

### RF-17: Carga de diagnósticos, indicaciones y tratamientos en la ficha digital
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Carga de diagnósticos, indicaciones y tratamientos en la ficha digital. |
| **ID** | RF-17 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir la carga de diagnósticos, indicaciones y tratamientos. |
| **Términos** | Ficha digital (registro electrónico del historial clínico de un paciente). |
| **Justificación** | Es el requerimiento base del módulo de historia clínica. |
| **Prioridad** | Media. |
| **Dependencias** | RF-06 |
| **Documentos** | Ley y normativa de Historia Clínica Electrónica y protección de datos. |
| **Argumentos de factibilidad** | Se implementa como un formulario estructurado, vinculado al turno atendido; no presenta complejidad técnica relevante. |
| **Métodos de verificación** | Prueba funcional: un médico marca un turno como "atendido", carga diagnóstico/indicaciones/tratamiento y se verifica que la información quede correctamente asociada a la ficha del paciente correspondiente. |

---

### RF-18: Consulta remota del historial médico por parte del paciente
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Consulta remota del historial médico por parte del paciente. |
| **ID** | RF-18 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al paciente autenticado acceder y visualizar su historial clínico desde la plataforma web o la aplicación móvil, mostrando diagnósticos, tratamientos y fecha de las atenciones registradas por los médicos. |
| **Términos** | Historial clínico, Ficha del paciente, Diagnóstico, Tratamiento, Consulta remota. |
| **Justificación** | Brinda una experiencia ágil y digital al paciente, dándole acceso inmediato a su información de salud sin necesidad de acudir presencialmente. |
| **Prioridad** | Alta. |
| **Dependencias** | RF-17 |
| **Documentos** | Resumen descargable de Historia Clínica del paciente. |
| **Argumentos de factibilidad** | Viable mediante la implementación de un backend que consuma la base de datos centralizada de historias clínicas, exponiendo endpoints seguros (API REST) accesibles por la plataforma web y la app móvil. |
| **Métodos de verificación** | Pruebas de integración y UI: verificar que un paciente autenticado visualice únicamente sus propios registros clínicos cargados previamente de forma precisa y legible. |

---

### RF-19: Reporte de turnos atendidos/cancelados por especialidad
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Reporte de turnos atendidos/cancelados por especialidad |
| **ID** | RF-19 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe poder generar un reporte que muestre la cantidad de turnos atendidos y cancelados, discriminados por especialidad médica, en un período seleccionable. |
| **Términos** | Turno atendido, Turno cancelado. |
| **Justificación** | Permite a los administradores evaluar la operatividad de cada especialidad y detectar patrones de cancelación. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-04, RF-09 |
| **Documentos** | Registros consolidados de estados de turnos (Atendido/Cancelado/Ausente). |
| **Argumentos de factibilidad** | Consulta agregada sobre datos ya existentes en el sistema de turnos filtrada por rango de fechas. |
| **Métodos de verificación** | Prueba funcional: generar el reporte para un período con turnos en distintos estados y especialidades, y verificar que los totales coinciden con los datos cargados. |

---

### RF-20: Generación de reporte de stock y consumo de vacunas
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Generación de reporte de stock y consumo de vacunas |
| **ID** | RF-20 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a los usuarios con el rol administrador generar y visualizar reportes detallados sobre el estado del stock actual de vacunas y el consumo/aplicación de las mismas en un rango de fechas determinado. |
| **Términos** | Reporte administrativo, Stock de vacunas, Consumo de vacunas, Alerta de bajo stock, Administrador. |
| **Justificación** | Necesario para optimizar la gestión interna de la sala médica, permitir un control eficiente del inventario y respaldar la toma de decisiones en la compra de insumos. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-11, RF-12 |
| **Documentos** | Documentos con información relevante para este requerimiento. |
| **Argumentos de factibilidad** | Ejecución de consultas agregadas (SQL/ORM) sobre las tablas de inventario y registro de aplicaciones, renderizando los datos en paneles de control y formatos descargables (ej. PDF/Excel). |
| **Métodos de verificación** | Pruebas funcionales: comprobar que los datos consolidados coincidan con el stock cargado por las enfermeras y las dosis registradas como aplicadas en el período seleccionado. |

---

### RF-21: Generación de reporte de ingresos por pagos y ausentismo de pacientes
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Generación de reporte de ingresos por pagos y ausentismo de pacientes |
| **ID** | RF-21 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a los administradores generar y consultar reportes sobre los ingresos financieros obtenidos por pago de consultas y la tasa de ausentismo de los pacientes en un periodo de tiempo determinado. |
| **Términos** | Administrador, reporte de ingresos, ausentismo. |
| **Justificación** | Necesario para la gestión financiera de la sala médica, evaluar la facturación obtenida y medir el impacto económico del ausentismo. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-04, RF-15, RF-16 |
| **Documentos** | Reglamento interno de administración financiera. Manual de procedimientos para la gestión de cobros. Normativa AFIP. Ley N° 25.326. |
| **Argumentos de factibilidad** | Consultas SQL de agregación cruzando la tabla de pagos/facturación y la tabla de turnos filtrados por fecha y estado ("atendido" vs "ausente"). |
| **Métodos de verificación** | Iniciar sesión como administrador, definir un rango de fechas, solicitar el reporte y verificar el total acumulado recaudado y el porcentaje exacto de ausentismo. |

---

### RF-22: Registro autogestionado de cuenta de paciente
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Registro autogestionado de cuenta de paciente |
| **ID** | RF-22 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir que una persona cree por sí misma su cuenta de paciente, informando sus datos personales (nombre, apellido, DNI, correo electrónico) y una contraseña. La cuenta creada queda asociada al rol Paciente. |
| **Términos** | Cuenta de usuario, Rol, Paciente. |
| **Justificación** | Es la puerta de entrada al circuito de reserva de turnos autogestionada sin intervención del personal. |
| **Prioridad** | Media. |
| **Dependencias** | Ninguna. |
| **Documentos** | Minuta de la consulta con el cliente del 03/09/2026. Ley 25.326 de Protección de Datos Personales. |
| **Argumentos de factibilidad** | Base de datos relacional con unicidad de DNI y correo electrónico. |
| **Métodos de verificación** | Pruebas funcionales: completar el formulario de registro y verificar el inicio de sesión correcto en la interfaz de Paciente. |

---

### RF-23: Inicio de sesión mediante correo electrónico
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Inicio de sesión mediante correo electrónico |
| **ID** | RF-23 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a todos los usuarios iniciar sesión mediante su correo electrónico y su contraseña, y debe presentarles la interfaz correspondiente al rol que tienen asignado. |
| **Términos** | Credenciales, Rol. |
| **Justificación** | Precondición de toda función que dependa de la identidad del usuario. |
| **Prioridad** | Media. |
| **Dependencias** | Ninguna. |
| **Documentos** | Minuta de la consulta con el cliente del 03/09/2026. |
| **Argumentos de factibilidad** | Implementación estándar de autenticación segura por correo y hash de contraseña. |
| **Métodos de verificación** | Pruebas funcionales: iniciar sesión con credenciales de cada rol y verificar la redirección a la pantalla correspondiente, comprobando rechazos ante claves inválidas. |

---

### RF-24: Creación de cuentas del personal de la sala por el administrador
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Creación de cuentas del personal de la sala por el administrador |
| **ID** | RF-24 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al administrador crear las cuentas de los médicos y de las enfermeras, asignando el rol correspondiente en el mismo momento del alta. |
| **Términos** | Administrador, Alta de cuenta, Asignación de rol. |
| **Justificación** | Mantiene bajo control quién puede operar como personal médico o de enfermería sin autogestión de roles sensibles. |
| **Prioridad** | Media. |
| **Dependencias** | RF-23 |
| **Documentos** | Minutas de consultas del 03/09/2026 y 17/09/2026. Nómina de profesionales de la sala médica. |
| **Argumentos de factibilidad** | Formulario administrativo de alta de cuentas con asignación forzosa de rol. |
| **Métodos de verificación** | El administrador da de alta un médico y una enfermera, y se comprueba que puedan iniciar sesión con sus respectivos roles. |

---

### RF-25: Diferenciación de la interfaz según el rol del usuario
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Diferenciación de la interfaz según el rol del usuario |
| **ID** | RF-25 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe presentar a cada usuario el conjunto de pantallas y acciones propio de su rol (paciente, médico, enfermera o administrador), sin exponerle las funciones que corresponden a los demás roles. |
| **Términos** | Rol, Interfaz de usuario, Permisos. |
| **Justificación** | Evita accesos indebidos a datos clínicos o funciones fuera del alcance del usuario. |
| **Prioridad** | Media. |
| **Dependencias** | RF-23 |
| **Documentos** | Minuta de consulta del 17/09/2026. Enunciado del Proyecto PSS-2026. |
| **Argumentos de factibilidad** | Implementación de control de acceso basado en roles (RBAC) y guardias de rutas tanto en frontend como en backend. |
| **Métodos de verificación** | Iniciar sesión con diferentes perfiles y verificar que no existan accesos directos ni enlaces a vistas no autorizadas. |

---

### RF-26: Permisos de las funciones de médico y de paciente por el administrador
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Permisos de las funciones de médico y de paciente por el administrador |
| **ID** | RF-26 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al administrador realizar las mismas acciones que puede realizar un médico y las que puede realizar un paciente, además de las funciones propias de su rol. |
| **Términos** | Administrador, Permisos, Rol. |
| **Justificación** | Permite cubrir la operación de la sala ante ausencias del personal o solicitudes presenciales en mostrador. |
| **Prioridad** | Media. |
| **Dependencias** | RF-25 |
| **Documentos** | Minutas de consulta del proyecto. |
| **Argumentos de factibilidad** | Inclusión de permisos de paciente y médico dentro de la matriz de autorización del rol administrador. |
| **Métodos de verificación** | El administrador ingresa a funciones de gestión médica y reserva de turnos verificando la ejecución exitosa sin cuentas secundarias. |

---

### RF-27: Modificación de los horarios de atención por el administrador
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Modificación de los horarios de atención por el administrador |
| **ID** | RF-27 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir únicamente al administrador modificar los horarios de atención cargados para un médico. El médico carga sus horarios una sola vez, al momento del alta, y no puede modificarlos por sí mismo. |
| **Términos** | Horario de atención, Administrador. |
| **Justificación** | Evita que la agenda publicada se altere de forma imprevista provocando cancelaciones no controladas de turnos ya reservados. |
| **Prioridad** | Media/Alta. |
| **Dependencias** | RF-01, RF-25 |
| **Documentos** | Minuta de la consulta con el cliente del 03/09/2026. |
| **Argumentos de factibilidad** | Bloqueo de permisos de edición horaria al rol médico y habilitación del endpoint al rol administrador. |
| **Métodos de verificación** | Un médico intenta cambiar su horario y comprueba que la opción está deshabilitada; el administrador realiza el cambio y se verifica el impacto en la agenda. |

---

### RF-28: Selección de un turno como no disponible por el médico
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Selección de un turno como no disponible por el médico |
| **ID** | RF-28 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al médico marcar un turno determinado de su agenda como no disponible, de modo que ese horario deje de ofrecerse a los pacientes para su reserva. |
| **Términos** | Turno no disponible, Agenda. |
| **Justificación** | Permite al médico gestionar ausencias puntuales sin necesidad de suspender toda la jornada de trabajo. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-02 |
| **Documentos** | Minutas de consulta del 03/09/2026 y 17/09/2026. |
| **Argumentos de factibilidad** | Cambio de estado de la entidad Turno a "No Disponible". |
| **Métodos de verificación** | El médico inhabilita un horario libre y se corrobora desde la vista de paciente que no aparezca en la lista de turnos reservables. |

---

### RF-29: Registro de la asistencia del paciente al turno
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Registro de la asistencia del paciente al turno |
| **ID** | RF-29 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al médico asignado a un turno registrar si el paciente asistió o no asistió a la consulta, dejando el turno en el estado correspondiente. |
| **Términos** | Asistencia, Inasistencia, Estado de turno (atendido o ausente). |
| **Justificación** | El médico determina la presencia del paciente; alimenta directamente el reporte de ausentismo y el cobro por inasistencia. |
| **Prioridad** | Media. |
| **Dependencias** | RF-04, RF-06 |
| **Documentos** | Minutas de consulta del 03/09/2026 y 17/09/2026. |
| **Argumentos de factibilidad** | Acciones rápidas de cambio de estado en la hoja diaria del médico. |
| **Métodos de verificación** | El médico marca a un paciente como ausente y se comprueba el cambio de estado y la actualización de los datos en el módulo de reportes. |

---

### RF-30: Reserva de turno por el administrador a solicitud presencial
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Reserva de turno por el administrador a solicitud presencial |
| **ID** | RF-30 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir al administrador reservar un turno a nombre de un paciente cuando la solicitud se realice de forma presencial o telefónica en la sala médica. |
| **Términos** | Reserva presencial, Administrador. |
| **Justificación** | Permite registrar turnos solicitados en el mostrador para reflejar la disponibilidad y ocupación real de la sala. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-06, RF-25 |
| **Documentos** | Minuta de la consulta con el cliente del 17/09/2026. |
| **Argumentos de factibilidad** | Interfaz administrativa con selector de paciente y selector de turno libre en la agenda. |
| **Métodos de verificación** | El administrador agenda una cita para un paciente registrado y se verifica su aparición en la hoja del médico y en la cuenta del paciente. |

---

### RF-31: Aprobación de la solicitud de turno de vacunación por la enfermera
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Aprobación de la solicitud de turno de vacunación por la enfermera |
| **ID** | RF-31 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe registrar las solicitudes de turno de vacunación en estado pendiente y permitir que una enfermera o el administrador las apruebe o las rechace. El turno de vacunación solo queda confirmado una vez aprobado. |
| **Términos** | Solicitud de turno de vacunación, Turno pendiente, Aprobación, Rechazo. |
| **Justificación** | Garantiza que todo turno sea validado contra la existencia física y estado de las dosis en la sala. |
| **Prioridad** | Media. |
| **Dependencias** | RF-11, RF-12 |
| **Documentos** | Minutas del 03/09/2026 y 17/09/2026. Manual de procedimientos de enfermería. |
| **Argumentos de factibilidad** | Flujo con máquina de estados: `Pendiente` -> `Confirmado` o `Rechazado`. |
| **Métodos de verificación** | Se genera una solicitud de vacunación, se comprueba que quede pendiente, la enfermera aprueba una y pasa a confirmada; rechaza otra y se notifica al paciente. |

---

### RF-32: Definición del nivel de stock crítico de cada vacuna
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Definición del nivel de stock crítico de cada vacuna |
| **ID** | RF-32 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a las enfermeras y al administrador definir, para cada vacuna del inventario, la cantidad mínima a partir de la cual su stock se considera crítico. |
| **Términos** | Stock crítico, Umbral, Vacuna. |
| **Justificación** | Permite parametrizar las alertas automáticas para prevenir el desabastecimiento. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-11 |
| **Documentos** | Minutas del 03/09/2026 y 17/09/2026. Calendario Nacional de Vacunación. |
| **Argumentos de factibilidad** | Campo numérico editable en la ficha de catálogo de cada biológico. |
| **Métodos de verificación** | Se define un umbral, se descuentan dosis por debajo del valor y se verifica la activación de la alerta correspondiente. |

---

### RF-33: Alta de nuevas vacunas en el inventario por la enfermera
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Alta de nuevas vacunas en el inventario por la enfermera |
| **ID** | RF-33 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir a las enfermeras incorporar al inventario vacunas que no estuvieran previamente registradas, además de actualizar el stock de las ya existentes. |
| **Términos** | Inventario de vacunas, Alta de vacuna. |
| **Justificación** | Evita que el inventario quede estático y permite registrar biológicos que lleguen por nuevas campañas sanitarias. |
| **Prioridad** | Media/Alta. |
| **Dependencias** | RF-11 |
| **Documentos** | Minuta de la consulta con el cliente del 03/09/2026. Calendario Nacional de Vacunación. |
| **Argumentos de factibilidad** | Formulario de carga de nombre comercial, biológico, laboratorio y configuración inicial. |
| **Métodos de verificación** | Carga de una nueva vacuna por la enfermera y verificación de su disponibilidad inmediata para recibir lotes y agendar turnos. |

---

### RF-34: Definición del valor de la consulta por cada médico
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Definición del valor de la consulta por cada médico |
| **ID** | RF-34 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe permitir que cada médico defina el valor de su consulta particular, y debe tomar ese valor al registrar el pago del turno correspondiente. |
| **Términos** | Valor de consulta, Consulta particular. |
| **Justificación** | Cada profesional establece sus propios honorarios para atenciones privadas; es la base para los cálculos de cobranza. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-25 |
| **Documentos** | Minuta del 03/09/2026. Tabla de aranceles de la sala médica. |
| **Argumentos de factibilidad** | Parámetro monetario en el perfil del médico tomado por la pasarela de pagos. |
| **Métodos de verificación** | Dos médicos asignan valores distintos; al reservar turno con cada uno se corrobora que el monto a pagar coincida con el fijado por el profesional. |

---

### RF-35: Cobro de la totalidad del turno ante la inasistencia del paciente
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Cobro de la totalidad del turno ante la inasistencia del paciente |
| **ID** | RF-35 |
| **Categoría** | Funcional |
| **Descripción** | El sistema debe registrar, cuando un turno queda marcado como ausente, una deuda a nombre del paciente por el valor total de la consulta del médico correspondiente. |
| **Términos** | Inasistencia, Deuda del paciente, Valor de consulta. |
| **Justificación** | Aplica la penalidad estipulada por la institución ante ausencias no canceladas a tiempo, alimentando el reporte financiero. |
| **Prioridad** | Baja. |
| **Dependencias** | RF-29, RF-34 |
| **Documentos** | Minuta de la consulta con el cliente del 03/09/2026. |
| **Argumentos de factibilidad** | Disparador lógico ante el estado "Ausente" que crea un registro en la cuenta corriente del paciente por el monto de la consulta. |
| **Métodos de verificación** | Un turno pasa a "Ausente" y se constata la generación automática del saldo deudor en la cuenta del paciente; si se marca como "Atendido", no se imputa deuda adicional. |