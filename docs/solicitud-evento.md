# SOLICITUD Y APROBACIÓN DE EVENTOS (CONVIVENCIAS)

## 1. Descripción General

Las convivencias y eventos se gestionan como una **entidad única de EVENTO**, que comienza en estado de **Solicitud** y evoluciona a través de un flujo de discernimiento y aprobación.

No existe una entidad separada de “solicitud”:
**todo comienza como un evento en estado inicial.**

---

## 2. Roles habilitados para solicitar eventos

Pueden crear solicitudes:

- Enlaces
- Responsables
- Delegados del Equipo Timón
- Animadores de Jóvenes
- Animadores de Dedicados
- Guía de Familiares

Todos pertenecen al **Ministerio Pastoral de Animación**.

---

## 3. Datos requeridos en la solicitud

Al crear un evento en estado _Solicitud_, se deben cargar:

### Datos organizacionales

- Confraternidad
- Fraternidad (**obligatoria siempre**)

### Datos del evento

- Tipo de evento
- Modalidad: virtual | presencial | bimodal
- ¿Tiene aporte de valor?
- Ciudad / lugar
- Fecha inicio (rango general)
- Fecha fin (rango general)
- Notas

### Personas propuestas (texto libre)

- Coordinador(es) propuestos (hasta 3)
- Asesor(es) propuestos
- Indicar si asesor es voluntario

⚠️ Importante:
Estos datos son **texto libre**, no FK, porque:

- pueden no existir en el sistema
- pueden no tener rol asignado aún

---

## 4. Tipos de evento

Debe existir una entidad:

### TIPO_EVENTO

Define:

- nombre (ej: convivencia, retiro corto, taller)
- categoría (abierto / interno)
- requisitos (texto visible al usuario)
- niveles de aprobación requeridos

Esto permite:

- guiar al solicitante
- definir el flujo automáticamente

---

## 5. Flujo de estados del evento

```text
SOLICITUD
→ DISCERNIMIENTO_CONFRA/DELEGADO (opcional)
→ DISCERNIMIENTO_EQT
→ APROBADO_CONFRA (intermedio)
→ APROBADO
→ RECHAZADO
```

---

## 6. Estados detallados

### 6.1 SOLICITUD

- Evento creado
- Puede editarse
- Botones:
  - Guardar (borrador)
  - Enviar solicitud

---

### 6.2 DISCERNIMIENTO CONFRA / DELEGADO

Se activa si el tipo de evento requiere nivel 1.

- Visible para:
  - responsables
  - enlaces
  - delegado EqT

Acciones:

- Aprobar
- Rechazar
- Modificar datos
- Agregar notas

---

### 6.3 DISCERNIMIENTO EQUIPO TIMÓN

Se activa:

- directamente (si no hay nivel 1)
- o luego de aprobación de nivel 1

Acciones:

- Aprobar
- Rechazar
- Modificar datos
- Agregar notas

---

### 6.4 APROBADO CONFRA (estado intermedio)

Solo para eventos con doble aprobación.

- Ya aprobado en nivel 1
- Pendiente de EqT

---

### 6.5 APROBADO

Evento aprobado completamente.

Luego:

- se completa info faltante
- se transforma en evento publicable

Ejemplo:

- casa de retiro
- fechas específicas

---

### 6.6 RECHAZADO

- Se corta el flujo
- No pasa a siguientes niveles
- Puede incluir notas explicativas

---

## 7. Reglas de aprobación

### Niveles de aprobación

Dependen del TIPO_EVENTO:

- 1 nivel:
  - Confra / Delegado
  - o EqT

- 2 niveles:
  - Confra / Delegado
    → EqT

---

### Lógica organizacional

- Si solicitud viene de Fraternidad:
  → pasa primero por Confraternidad

- Si viene de Confraternidad:
  → pasa directo a EqT

- Fraternidades dependientes de EqT:
  → pasa por Delegado EqT (nivel 1)

---

### Regla colegiada

No es aprobación individual.

✔ Basta con:

- 1 responsable o enlace

Representa a toda la estructura.

---

## 8. Modificación durante el flujo

En cualquier nivel de aprobación se puede:

- modificar fechas
- modificar lugar
- modificar asesor/coordinador
- agregar notas

---

## 9. Notas de discernimiento

Debe existir un campo:

```text
notas_discernimiento (TEXT)
```

Se utiliza para:

- justificar decisiones
- registrar cambios
- contexto pastoral

---

## 10. Coordinadores y asesores

### En solicitud:

- texto libre

### Luego de aprobación:

- se asignan como:
  - 1 coordinador
  - 1 asesor

✔ Relacionados a PERSONA

---

## 11. Relación con personas

- Una persona puede ser coordinador en múltiples eventos
- El rol es contextual al evento
- No es un rol permanente

---

## 12. Fechas del evento

### En solicitud:

- rango general (inicio / fin)

### Luego:

- se definen fechas reales (tabla EVENTO_FECHAS)

---

## 13. Notificaciones

El sistema debe permitir notificar:

- aprobación
- rechazo
- cambios de estado

Opciones:

- email
- listado en plataforma

---

## 14. Reglas críticas del dominio

1. Siempre debe existir una fraternidad en la solicitud.
2. El flujo depende del tipo de evento.
3. Los aprobadores no son individuos, sino roles.
4. El proceso puede modificar datos en cada etapa.
5. Un rechazo corta completamente el flujo.
6. Los roles de coordinador/asesor no son persistentes globalmente.
7. El evento es la entidad central desde el inicio.

---
