# Requerimientos No Funcionales

## Rendimiento y Escalabilidad
* **RNF-01:** El tiempo de respuesta del backend para la carga de turnos disponibles y consulta de historiales clínicos no debe superar los 1.5 segundos en el 95% de las peticiones.
* **RNF-02:** El sistema debe soportar un pico de concurrencia de al menos 50 usuarios simultáneos sin degradación del servicio, evento esperado durante la apertura mensual automática de la agenda médica.

## Seguridad y Privacidad
* **RNF-03:** La totalidad de los datos médicos sensibles y las contraseñas deben estar encriptados en tránsito mediante protocolos TLS/HTTPS y en reposo dentro del motor de base de datos.
* **RNF-04:** La plataforma debe contar con protocolos de autenticación seguros, brindando una separación estricta de permisos mediante roles (Paciente, Médico, Enfermera, Administrador), para establecer restricciones sobre quién puede modificar parámetros críticos del sistema.

## Disponibilidad
* **RNF-05:** El entorno de producción, incluyendo el frontend web y la API para la aplicación móvil desplegados en plataformas en la nube, debe garantizar un nivel de disponibilidad (*uptime*) del 99.9% mensual.

## Usabilidad
* **RNF-06:** El diseño de la aplicación móvil debe permitir que un paciente con sesión iniciada complete el flujo de reserva de un turno en un máximo de 5 minutos.

---

# Planillas de los requerimientos

### RNF-01: Tiempo de respuesta del backend
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Tiempo de respuesta del backend |
| **ID** | RNF-01 |
| **Categoría** | No Funcional |
| **Descripción** | El tiempo de respuesta del backend para la carga de turnos disponibles y consulta de historiales clínicos no debe superar el umbral establecido. |
| **Escala** | Tiempo transcurrido en segundos. |
| **Test** | Prueba de carga simulando peticiones HTTP GET a los endpoints de turnos e historiales mediante herramientas como JMeter o k6. |
| **Peor Caso** | 2.5 segundos en el 90% de las peticiones. |
| **Nivel planificado**| 1.5 segundos en el 95% de las peticiones. |
| **Mejor caso** | 0.5 segundos en el 99% de las peticiones. |
| **Nivel actual** | - |

---

### RNF-02: Soporte de concurrencia máxima
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Soporte de concurrencia máxima |
| **ID** | RNF-02 |
| **Categoría** | No Funcional |
| **Descripción** | El sistema debe soportar picos de usuarios simultáneos sin degradación del servicio durante la apertura mensual de la agenda médica. |
| **Escala** | Cantidad de conexiones o usuarios simultáneos activos. |
| **Test** | Prueba de estrés inyectando tráfico concurrente hacia la plataforma web y la API móvil. |
| **Peor Caso** | 20 usuarios simultáneos. |
| **Nivel planificado**| 30 usuarios simultáneos. |
| **Mejor caso** | 50 o más usuarios simultáneos sostenidos. |
| **Nivel actual** | - |

---

### RNF-03: Encriptación de datos sensibles y contraseñas
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Encriptación de datos sensibles y contraseñas |
| **ID** | RNF-03 |
| **Categoría** | No Funcional |
| **Descripción** | La totalidad de los datos médicos sensibles, historias clínicas y contraseñas deben estar encriptados en tránsito y en reposo. |
| **Escala** | Porcentaje (%) de conexiones y almacenamiento de datos sensibles protegidos. |
| **Test** | Auditoría de certificados de red y revisión de la configuración de encriptación nativa en la base de datos relacional. |
| **Peor Caso** | 100% |
| **Nivel planificado**| 100% |
| **Mejor caso** | 100% |
| **Nivel actual** | - |

---

### RNF-04: Control de acceso y segmentación de permisos
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Control de acceso y segmentación de permisos |
| **ID** | RNF-04 |
| **Categoría** | No Funcional |
| **Descripción** | La plataforma debe restringir la modificación de parámetros críticos asegurando una separación de permisos estricta mediante roles (Paciente, Médico, Enfermera, Administrador). |
| **Escala** | Porcentaje (%) de endpoints de la API restringidos y validados según el rol (RBAC). |
| **Test** | Pruebas de penetración e intentos de inyección de tokens de un rol inferior en endpoints de nivel superior. |
| **Peor Caso** | 100% de protección en operaciones de escritura (POST/PUT/DELETE). |
| **Nivel planificado**| 100% de protección en la totalidad de la plataforma (lectura y escritura). |
| **Mejor caso** | 100% + generación automática de registros inmutables (logs) ante intentos fallidos de acceso. |
| **Nivel actual** | - |

---

### RNF-05: Disponibilidad del entorno de producción
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Disponibilidad del entorno de producción |
| **ID** | RNF-05 |
| **Categoría** | No Funcional |
| **Descripción** | El entorno de producción (frontend web y API) desplegado en la nube debe asegurar una operación continua mínima. |
| **Escala** | Porcentaje (%) de tiempo operativo (*uptime*) mensual. |
| **Test** | Monitoreo continuo mediante sondas externas con frecuencia de 1 minuto. |
| **Peor Caso** | 99.0% mensual (Aprox. 7 horas de inactividad). |
| **Nivel planificado**| 99.9% mensual (Aprox. 43 minutos de inactividad). |
| **Mejor caso** | 99.99% mensual (Menos de 5 minutos de inactividad). |
| **Nivel actual** | - |

---

### RNF-06: Eficiencia del flujo de reserva móvil
| Campo | Detalle |
| :--- | :--- |
| **Nombre** | Eficiencia del flujo de reserva móvil |
| **ID** | RNF-06 |
| **Categoría** | No Funcional |
| **Descripción** | Un paciente con sesión iniciada debe completar el circuito de reserva de un turno de manera ágil y con mínimo esfuerzo cognitivo. |
| **Escala** | Cantidad de interacciones (toques en pantalla) y tiempo transcurrido (minutos). |
| **Test** | Pruebas de usabilidad cronometradas con usuarios reales ejecutando tareas sobre el prototipo interactivo o la app funcional. |
| **Peor Caso** | 8 minutos de tiempo de resolución. |
| **Nivel planificado**| 5 minutos de tiempo de resolución. |
| **Mejor caso** | Menos de 5 minutos. |
| **Nivel actual** | Gestión manual telefónica actual (Tarda entre 5 a 10 minutos). |