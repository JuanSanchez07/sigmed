# Requerimientos de mayor prioridad para SPRINT 1

---

## US-1.4: Consulta de hoja de trabajo diaria del médico (RF-04)

**Como** médico  
**quiero** ver mi hoja de trabajo diaria con los turnos reservados y su estado  
**para** organizar mi jornada.

### Tareas:
* **1.4.1** Armar la pantalla con los turnos del día del médico.
* **1.4.2** Mostrar el estado de cada turno (reservado, cancelado, atendido).

### Criterios de aceptación:
* **CA1:** Cuando un médico accede a la pantalla de agendas, entonces verifica y visualiza solo sus turnos correspondientes para el día o semana seleccionados.
* **CA2:** Dado que el médico visualiza la grilla de turnos, puede identificar los datos del paciente y filtrar por estado (confirmado, atendido, ausente).

### Diseño / Mockup:
```text
+----------------------------------------------------------------------------------------------------+
| [Nombre Sistema]                                                                [Rol Usuario] | Salir|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [Título de Pantalla]                                                                             |
|                                                                                                    |
|                                [< Anterior]   dd / mm / aaaa [📅]   [Siguiente >]                  |
|                                                                                                    |
|   Filtros: (•) Opción A   ( ) Opción B   ( ) Opción C                     [ 🔍 Buscar           ]  |
|                                                                                                    |
|   +---------------+--------------------+---------------+---------------+-----------------------+   |
|   | [DATO HORA]   | [DATO PACIENTE]    | [DATO DNI]    | [DATO ESTADO] | [ACCIONES]            |   |
|   +---------------+--------------------+---------------+---------------+-----------------------+   |
|   | XX:XX         | Apellido, Nombre   | XX.XXX.XXX    | [Estado]      | [Acción]              |   |
|   | XX:XX         | Apellido, Nombre   | XX.XXX.XXX    | [Estado]      | [Acción]              |   |
|   | XX:XX         | Apellido, Nombre   | XX.XXX.XXX    | [Estado]      | [Acción]              |   |
|   | XX:XX         | Apellido, Nombre   | XX.XXX.XXX    | [Estado]      | [Acción]              |   |
|   +---------------+--------------------+---------------+---------------+-----------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## US-1.5: Modificación de horarios por el administrador (RF-27)

**Como** administrador  
**quiero** modificar los horarios de atención de un médico  
**para** mantener su agenda actualizada.

### Tareas:
* **1.5.1** Permitir al admin elegir un médico y ver sus horarios.
* **1.5.2** Permitir cambiar esos horarios y guardarlos.
* **1.5.3** Actualizar los turnos disponibles según el cambio.

### Criterios de aceptación:
* **CA1:** Dado un acceso al sistema con el rol administrador, cuando se realiza una modificación en los horarios de un médico, entonces el cambio se refleja de forma exitosa en la agenda publicada.
* **CA2:** Dado que un médico ingresa al sistema, cuando intenta modificar su propio horario de atención, entonces la acción no está disponible para su rol.

### Diseño / Mockup:
```text
+----------------------------------------------------------------------------------------------------+
| [Nombre Sistema]                                                          [Rol Administrador] | Salir|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [Título: Modificación de Horarios]                                                               |
|                                                                                                    |
|   [Seleccionar Profesional]: [ Lista de Profesionales / Especialidad               v ]             |
|                                                                                                    |
|   [Configuración de Disponibilidad]                                                                |
|   [ ] Día 1   [x] Día 2   [ ] Día 3   [x] Día 4   [ ] Día 5                                        |
|                                                                                                    |
|   [Hora Inicio]: [ 08:00    v ]   [Hora Fin]: [ 16:00    v ]   [Duración Turno]: [ XX min    v ]   |
|                                                                                                    |
|                                                           [ Cancelar ]  [ Guardar Cambios ]        |
|                                                                                                    |
|   [Agenda Actual del Profesional]                                                                  |
|   +---------------+---------------------------------+---------------+--------------------------+   |
|   | [DÍA]         | [FRANJA HORARIA]                | [DURACIÓN]    | [ACCIONES]               |   |
|   +---------------+---------------------------------+---------------+--------------------------+   |
|   | [Dato Día]    | XX:XX - XX:XX                   | XX min        | [Modificar/Editar]       |   |
|   | [Dato Día]    | XX:XX - XX:XX                   | XX min        | [Modificar/Editar]       |   |
|   +---------------+---------------------------------+---------------+--------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## US-3.1: Alta de nuevas vacunas (RF-33)

**Como** enfermera  
**quiero** dar de alta nuevas vacunas en el inventario  
**para** poder gestionarlas.

### Tareas:
* **3.1.1** Armar el formulario para cargar una vacuna nueva.
* **3.1.2** Mostrar el listado de vacunas cargadas.

### Criterios de aceptación:
* **CA1:** Dado un ingreso con el rol de enfermera, cuando se incorpora una vacuna no registrada previamente, entonces esta queda disponible para cargarle stock, definir un nivel crítico y asignar turnos.

### Diseño / Mockup:
```text
+----------------------------------------------------------------------------------------------------+
| [Nombre Sistema]                                                             [Rol Enfermera] | Salir|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [Título: Alta de Nueva Vacuna]                                                                   |
|                                                                                                    |
|   [Datos del Biológico a Incorporar]                                                               |
|   [Nombre de la Vacuna]:   [ ___________________________________________________________ ]         |
|   [Laboratorio / Origen]:  [ Seleccionar Opción                                        v ]         |
|                                                                                                    |
|   [Configuración de Inventario Inicial]                                                            |
|   [Lote Inicial]:          [ ______________ ]   [Fecha Vencimiento]:   [ dd / mm / aaaa       📅 ] |
|   [Cantidad Ingresada]:    [ ______________ ]   [Nivel Stock Crítico]: [ ______________          ] |
|                                                                                                    |
|                                                           [ Cancelar ]  [ Guardar en Catálogo ]    |
|                                                                                                    |
|   [Catálogo Actual de Vacunas]                                                                     |
|   +-----------------------+-------------------------+--------------------+---------------------+   |
|   | [DATO VACUNA]         | [DATO LABORATORIO]      | [UMBRAL CRÍTICO]   | [ACCIONES]          |   |
|   +-----------------------+-------------------------+--------------------+---------------------+   |
|   | [Dato Nombre]         | [Dato Laboratorio]      | [Dato Numérico]    | [Editar]            |   |
|   | [Dato Nombre]         | [Dato Laboratorio]      | [Dato Numérico]    | [Editar]            |   |
|   +-----------------------+-------------------------+--------------------+---------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## US-3.2: Registro y actualización de stock de vacunas (RF-11)

**Como** enfermera  
**quiero** registrar y actualizar el stock de vacunas (tipo, lote, vencimiento y cantidad)  
**para** mantener el inventario al día.

### Tareas:
* **3.2.1** Permitir cargar lote, vencimiento y cantidad.
* **3.2.2** Permitir sumar o descontar dosis.
* **3.2.3** Probar que el stock nunca quede negativo.

### Criterios de aceptación:
* **CA1:** Dado un ingreso con rol de enfermera, cuando se registra el stock de una vacuna, entonces el sistema guarda el tipo, lote, vencimiento y cantidad correcta.
* **CA2:** Dado que se registra un movimiento de stock, cuando se guarda la operación, entonces el sistema genera una trazabilidad inmutable del usuario, la fecha y el lote del movimiento.

### Diseño / Mockup:
```text
+----------------------------------------------------------------------------------------------------+
| [Nombre Sistema]                                                             [Rol Enfermera] | Salir|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [Título: Actualización de Stock]                                                                 |
|                                                                                                    |
|   [Registro de Movimiento]                                                                         |
|   [Seleccionar Vacuna del Catálogo]:                     [Tipo de Movimiento]:                     |
|   [ Dosis de vacuna y present.                       v ] [ Ingreso / Egreso                    v ] |
|                                                                                                    |
|   [Dato Lote]:             [Fecha Vencimiento]:          [Cantidad]:                               |
|   [ Dato Alfanumérico   ]  [ dd / mm / aaaa          📅 ] [ Dato Numérico                       ]  |
|                                                                                                    |
|                                                        [ Cancelar ]  [ Registrar Movimiento ]      |
|                                                                                                    |
|   [Historial de Movimientos Recientes]                                                             |
|   +---------------+---------------------+--------------------+-----------------+-----------------+ |
|   | FECHA/HORA    | [DATO VACUNA]       | [DATO LOTE]        | [MOVIMIENTO]    | [RESPONSABLE]   | |
|   +---------------+---------------------+--------------------+-----------------+-----------------+ |
|   | [Dato Fecha]  | [Dato Nom. Vacuna]  | [Dato Alfanum.]    | [+/- Dato Num.] | [Dato Usuario]  | |
|   | [Dato Fecha]  | [Dato Nom. Vacuna]  | [Dato Alfanum.]    | [+/- Dato Num.] | [Dato Usuario]  | |
|   | [Dato Fecha]  | [Dato Nom. Vacuna]  | [Dato Alfanum.]    | [+/- Dato Num.] | [Dato Usuario]  | |
|   +---------------+---------------------+--------------------+-----------------+-----------------+ |
+----------------------------------------------------------------------------------------------------+
```

---

## US-3.6: Asignación de turnos de vacunación (RF-12)

**Como** enfermera  
**quiero** asignar turnos de vacunación según el stock disponible  
**para** no dar turnos sin dosis.

### Tareas:
* **3.6.1** Armar pantalla para asignar turno vacunación.
* **3.6.2** Mostrar sólo vacunas con stock.
* **3.6.3** Mostrar a la enfermera los horarios libres de vacunación.
* **3.6.4** Reservar una dosis al asignar el turno.

### Criterios de aceptación:
* **CA1:** Dado un ingreso con el rol enfermera o administrador, cuando se intenta asignar un turno específico de vacunación, entonces el sistema lo permite únicamente si el nivel del inventario de la vacuna requerida es mayor a cero.
* **CA2:** Dado que se confirma la asignación de un turno de vacunación, cuando se procesa la solicitud, entonces se descuenta o se reserva lógicamente una unidad del stock disponible de esa vacuna.

### Diseño / Mockup:
```text
+----------------------------------------------------------------------------------------------------+
| [Nombre Sistema]                                                             [Rol Enfermera] | Salir|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [Título: Asignación de Turno de Vacunación]                                                      |
|                                                                                                    |
|   [Datos de la Asignación]                                                                         |
|   [Buscar Paciente]:                 [Seleccionar Vacuna]:                 [Stock Disponible]:     |
|   [ DNI / Nombre Paciente         ]  [ Seleccionar del Catálogo        v ] [ [XX Dosis]          ] |
|                                                                                                    |
|   [Fecha de Vacunación]:             [Horario Asignado]:                   [Observaciones (Opcional)]|
|   [ dd / mm / aaaa              📅 ] [ Seleccionar franja horaria      v ] [ Ingrese notas...    ] |
|                                                                                                    |
|                                                           [ Cancelar ]  [ Confirmar Turno ]        |
|                                                                                                    |
|   [Turnos de Vacunación Programados]                                                               |
|   +-------------------+---------------------+---------------------+---------------+----------------+
|   | [DATO FECHA/HORA] | [DATO PACIENTE]     | [DATO VACUNA]       | [ESTADO]      | [ACCIONES]     |
|   +-------------------+---------------------+---------------------+---------------+----------------+
|   | [Dato Fecha] XX:XX| [Dato Nombre]       | [Dato Nom. Vacuna]  | [Confirmado]  | [Cancelar]     |
|   | [Dato Fecha] XX:XX| [Dato Nombre]       | [Dato Nom. Vacuna]  | [Pendiente]   | [Cancelar]     |
|   +-------------------+---------------------+---------------------+---------------+----------------+
+----------------------------------------------------------------------------------------------------+
```

---

## US-5.2: Consulta remota de historial clínico (RF-18)

**Como** paciente  
**quiero** consultar mi historial clínico desde la plataforma  
**para** acceder a mi información sin ir a la sala.

### Tareas:
* **5.2.1** Armar la sección "Mi historial" para el paciente.
* **5.2.2** Mostrar las consultas ordenadas por fecha.
* **5.2.3** Probar que cada paciente vea solo su historial.

### Criterios de aceptación:
* **CA1:** Dado un inicio sesión como paciente autenticado, cuando se accede a mi historial desde la web o la app, entonces se visualizan los diagnósticos, tratamientos y fechas de atenciones registradas.
* **CA2:** Dado un ingreso como paciente, cuando se consulta la base de datos centralizada, entonces se visualizan únicamente los registros clínicos propios de forma precisa y legible.

### Diseño / Mockup:
```text
+----------------------------------------------------------------------------------------------------+
| [Nombre Sistema]                                                                [Rol Usuario] | Salir|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [Título de Pantalla]                                                                             |
|                                                                                                    |
|                                                   [Etiqueta Orden]: [Opción Orden A             v ]|
|                                                                                                    |
|   Filtros: (•) Opción A   ( ) Opción B   ( ) Opción C                     [ 🔍 Buscar           ]  |
|                                                                                                    |
|   +---------------+--------------------+--------------------+--------------------+--------------+   |
|   | [DATO FECHA]  | [DATO PROFESIONAL] | [DATO DIAGNÓSTICO] | [DATO TRATAMIENTO] | [ACCIONES]   |   |
|   +---------------+--------------------+--------------------+--------------------+--------------+   |
|   | XX/XX/XXXX    | Apellido, Nombre   | [Estado/Diag.]     | Texto genérico     | [Acción]     |   |
|   | XX/XX/XXXX    | Apellido, Nombre   | [Estado/Diag.]     | Texto genérico     | [Acción]     |   |
|   | XX/XX/XXXX    | Apellido, Nombre   | [Estado/Diag.]     | Texto genérico     | [Acción]     |   |
|   | XX/XX/XXXX    | Apellido, Nombre   | [Estado/Diag.]     | Texto genérico     | [Acción]     |   |
|   +---------------+--------------------+--------------------+--------------------+--------------+   |
|                                                                                                    |
|                                         [ << 1 / página(s) / 4 resultado(s) >> ]                   |
+----------------------------------------------------------------------------------------------------+
```