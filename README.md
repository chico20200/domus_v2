# DOMUS
# Sistema de Gestión de Tesorería — Cajas de Ahorro Comunitarias

> Plataforma web para el registro y control de operaciones financieras en cajas de ahorro comunitarias. Diseñada para ser accesible, adaptable y fácil de operar sin conocimientos contables previos.

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Motivación](#motivación)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Stack tecnológico](#stack-tecnológico)
- [Módulos funcionales](#módulos-funcionales)
- [Modelo de datos](#modelo-de-datos)
- [API REST](#api-rest)
- [Roles y permisos](#roles-y-permisos)
- [Decisiones de diseño](#decisiones-de-diseño)

---

## Descripción general

Este sistema provee a las cajas de ahorro comunitarias una herramienta web para gestionar sus operaciones financieras cotidianas: registro de socios, control de ahorros, otorgamiento de créditos, seguimiento de pagos y generación de reportes. El sistema está pensado para ser operado por personas sin formación técnica en contabilidad, con roles rotativos de tesorería.

El proyecto nace como respuesta a una problemática concreta: la gestión de tesorería en estas organizaciones suele recaer en uno o dos integrantes que trabajan con hojas de cálculo o registros manuales, lo que genera inconsistencias, pérdida de información y dificultades en el traspaso de responsabilidades.

---

## Motivación

Las cajas de ahorro comunitarias operan bajo un modelo autogestionado y solidario. Sus principales limitaciones administrativas son:

- **Falta de formación técnica** en las personas que asumen la tesorería, lo que deriva en errores de registro y reportes poco confiables.
- **Rol rotativo**, que produce rupturas en la continuidad de la información cada vez que cambia el responsable.
- **Dificultad para calcular y distribuir intereses** de forma equitativa entre los socios, especialmente en cajas que aplican criterios más rigurosos.
- **Ausencia de transparencia** en el historial de operaciones, lo que puede generar desconfianza entre los miembros.

El sistema busca resolver estos problemas mediante una interfaz simple, un control de roles claro y cálculos automatizados de intereses.

---

## Arquitectura del sistema

El sistema sigue una arquitectura de tres capas desacopladas:

```
┌─────────────────┐        HTTP/REST        ┌─────────────────┐        supabase-js        ┌─────────────────┐
│                 │ ──────────────────────► │                 │ ────────────────────────► │                 │
│  React / Vite   │                         │   Express API   │                           │    Supabase     │
│   (Frontend)    │ ◄────────────────────── │   (Backend)     │ ◄──────────────────────── │  (PostgreSQL)   │
│                 │        JSON             │                 │        Resultados          │                 │
└─────────────────┘                         └─────────────────┘                           └─────────────────┘
```

**Frontend** — Interfaz de usuario construida en React con Vite. Se comunica exclusivamente con la API de Express mediante peticiones HTTP. No accede a Supabase directamente.

**Backend (Express)** — Capa intermedia que expone la API REST, aplica autenticación JWT, valida permisos por rol y ejecuta la lógica de negocio (cálculo de amortización, validaciones de saldo, etc.). Es el único servicio que se comunica con Supabase usando la clave `service_role`.

**Base de datos (Supabase)** — Instancia de PostgreSQL gestionada en Supabase. Centraliza todos los datos del sistema y delega la autenticación de usuarios al servicio integrado Supabase Auth.

### Flujo de autenticación

```
Usuario ingresa credenciales
        │
        ▼
Express valida contra Supabase Auth
        │
        ▼
Supabase Auth devuelve JWT
        │
        ▼
Express adjunta el rol desde tabla `usuarios`
        │
        ▼
Cliente almacena el JWT y lo envía en cada request (Authorization: Bearer)
        │
        ▼
Express verifica JWT + rol en cada endpoint protegido
```

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 18 + Vite | Desarrollo rápido, ecosistema amplio, HMR en desarrollo |
| Estilos | Tailwind CSS | Utilidades atómicas, diseño responsivo sin CSS custom extenso |
| Backend | Node.js + Express | Ligero, flexible, amplia comunidad, fácil integración con Supabase |
| Base de datos | Supabase (PostgreSQL) | PostgreSQL gestionado con Auth integrado, panel de administración, free tier |
| Autenticación | Supabase Auth + JWT | Manejo seguro de sesiones sin implementar auth desde cero |
| ORM / Query | supabase-js | Cliente oficial, soporta filtros, joins y Row Level Security |

---

## Módulos funcionales

El sistema está dividido en seis módulos que corresponden directamente a las operaciones de una caja de ahorro.

### Socios

Gestión del padrón de miembros de la caja. Cada socio tiene un identificador único interno (UUID) y su cédula de identidad como identificador humano de búsqueda. El módulo permite registrar, actualizar y desactivar socios (baja lógica, sin eliminar el historial). También expone un resumen individual con el saldo de ahorros y créditos activos de cada socio.

### Ahorros

Registro de movimientos de ahorro: depósitos y retiros. El saldo de un socio no se almacena como un campo fijo en la base de datos, sino que se calcula dinámicamente a partir del historial de transacciones. Esto garantiza consistencia: no es posible que el saldo registrado diverja del historial real. Cada transacción queda vinculada al usuario que la registró y a la fecha exacta.

### Registro de créditos

Alta y seguimiento de créditos otorgados a socios. Al registrar un crédito se especifica el monto, la tasa de interés, el plazo en meses y el método de cálculo de interés (simple, compuesto o francés/cuota fija). El sistema calcula automáticamente la tabla de amortización completa y genera los registros de cuotas correspondientes en la tabla de pagos.

### Pagos de créditos

Registro de los pagos de cuotas. Cada cuota generada al crear un crédito tiene estado `pendiente`; al registrar un pago, la cuota pasa a `pagado` y se actualiza el saldo restante. El módulo también permite consultar cuotas vencidas y próximas a vencer para el seguimiento de mora.

### Resumen general de la caja

Vista consolidada del estado financiero de la organización. Incluye el total de ahorros, la cartera de créditos activa, los intereses cobrados, los créditos en mora y el flujo de operaciones por período. Esta información se genera desde una vista SQL calculada en tiempo real, sin datos duplicados.

### Administración de usuarios

Gestión de las cuentas que pueden operar el sistema. Permite crear usuarios, asignarles roles y vincularlos opcionalmente a un socio existente. El módulo es accesible únicamente para el rol `admin`.

---

## Modelo de datos

El modelo está compuesto por cinco tablas principales. Las relaciones centrales son: un socio puede tener muchos ahorros y muchos créditos; un crédito genera muchas cuotas de pago; los usuarios registran operaciones y son auditables en cada transacción.

### Tablas

**`socios`** — Padrón de miembros. Campo `cedula` con índice único para búsquedas frecuentes. Baja lógica mediante campo `activo`.

**`ahorros`** — Historial de movimientos. Campo `tipo` con valores `deposito` o `retiro`. El saldo se obtiene siempre por agregación sobre esta tabla.

**`creditos`** — Créditos otorgados. Almacena condiciones del crédito (monto, tasa, plazo, tipo de interés) y su estado (`activo`, `pagado`, `mora`, `castigado`).

**`pagos_credito`** — Tabla de amortización. Cada fila es una cuota. Contiene la descomposición capital/interés, el saldo restante y el estado de pago. Incluye `socio_id` desnormalizado para consultas directas por cédula sin pasar por `creditos`.

**`usuarios`** — Cuentas del sistema. Vinculada a Supabase Auth mediante `auth_user_id`. Puede estar asociada opcionalmente a un socio.

### Tipos de interés soportados

El sistema soporta tres métodos de cálculo, elegibles al momento de registrar el crédito:

- **Simple** — Los intereses se calculan siempre sobre el capital original. Cuotas de interés constantes, abono a capital variable.
- **Compuesto** — Los intereses se calculan sobre el saldo insoluto (capital pendiente). Los intereses disminuyen con cada pago.
- **Francés (cuota fija)** — Cuota mensual constante. El componente de interés disminuye y el de capital aumenta con cada pago. Es el sistema más usado en créditos formales.

---

## API REST

Todos los endpoints (excepto login) requieren token JWT en el header `Authorization: Bearer <token>`. Las respuestas siguen una estructura uniforme:

```json
// Respuesta exitosa
{
  "ok": true,
  "data": { },
  "meta": { "page": 1, "total": 45 }
}

// Respuesta de error
{
  "ok": false,
  "error": "CODIGO_ERROR",
  "message": "Descripción legible del error"
}
```

### Resumen de endpoints

| Módulo | Base | Operaciones principales |
|--------|------|------------------------|
| Autenticación | `/api/auth` | Login, logout, token actual, refresh |
| Socios | `/api/socios` | CRUD, búsqueda por cédula/nombre, resumen por socio |
| Ahorros | `/api/ahorros` | Depósitos, retiros, historial por socio/cédula |
| Créditos | `/api/creditos` | Registro, consulta, cálculo de amortización, estado |
| Pagos | `/api/pagos` | Registro de cuotas, historial, cuotas pendientes/vencidas |
| Resumen | `/api/resumen` | Totales de caja, flujo, intereses, mora, exportación |
| Usuarios | `/api/usuarios` | CRUD de usuarios, gestión de roles |

### Búsqueda por cédula

La cédula del socio funciona como identificador de búsqueda humana en todos los módulos. Los endpoints `GET` aceptan `?cedula=` como query parameter para filtrar resultados sin necesidad de conocer el UUID interno:

```
GET /api/socios?cedula=1712345678
GET /api/ahorros?cedula=1712345678&desde=2025-01-01
GET /api/creditos?cedula=1712345678&estado=activo
GET /api/pagos?cedula=1712345678
```

---

## Roles y permisos

El sistema maneja tres niveles de acceso:

| Rol | Descripción | Accesos |
|-----|-------------|---------|
| `admin` | Administrador de la caja | Acceso completo: operaciones financieras, gestión de usuarios, configuración, reportes y exportación |
| `tesorero` | Operador del día a día | Registro de ahorros, créditos y pagos, consulta de reportes. Sin acceso a gestión de usuarios ni configuración |
| `socio` | Miembro de la caja | Solo lectura de su propia información (saldo, historial, estado de créditos). Rol reservado para una fase futura |

El rol se almacena en la tabla `usuarios` y es verificado por Express en cada request mediante middleware, después de validar el JWT.

---
