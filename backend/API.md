# API DOMUS — Documentación de Endpoints

Backend Express + Supabase. Base URL local: `http://localhost:3000` (puerto configurable vía `PORT`).

## Autenticación

La mayoría de los endpoints requieren el header:

```
Authorization: Bearer <access_token>
```

El token es el `access_token` de sesión devuelto por Supabase en `/api/auth/login`. El middleware `verifyToken` (`middlewares/auth.middleware.js`) valida el token contra Supabase Auth y expone el usuario en `req.user`.

Respuestas de error de autenticación:
- `401 { error: 'Token no proporcionado' }` — falta el header `Authorization`.
- `403 { error: 'Token inválido o expirado' }` — el token no es válido.

## Roles y permisos por caja

Las rutas anidadas bajo `/api/cajas/:cajaId/...` validan el rol del usuario dentro de esa caja específica (tabla `miembros_caja`), con jerarquía:

```
socio (1) < tesorero (2) < admin (3)
```

Cada endpoint indica el **rol mínimo** requerido. Si el usuario no es miembro activo de la caja o no alcanza el rol mínimo, responde `403`.

---

## 1. Auth — `/api/auth`

### POST /api/auth/register
Crea un usuario nuevo en Supabase Auth.

- Auth: No
- Body: `{ email, password }`
- 201: `{ message, user: { id, email } }`
- 400: `{ error }` si faltan campos o Supabase rechaza el registro

### POST /api/auth/login
Inicia sesión y devuelve el JWT de sesión.

- Auth: No
- Body: `{ email, password }`
- 200: `{ message, token, user: { id, email } }`
- 400: `{ error }` si faltan campos
- 401: `{ error: 'Credenciales incorrectas' }`

### POST /api/auth/resend-confirmation
Reenvía el correo de confirmación de registro.

- Auth: No
- Body: `{ email }`
- 200: `{ message }`
- 400: `{ error }`

### POST /api/auth/forgot-password
Envía correo de recuperación de contraseña (redirige a `${FRONTEND_URL}/reset-password`).

- Auth: No
- Body: `{ email }`
- 200: `{ message }`
- 400: `{ error }`

### POST /api/auth/update-password
Actualiza la contraseña del usuario autenticado (requiere token, incluyendo el token de recuperación recibido por correo).

- Auth: Sí (Bearer token)
- Body: `{ password }` (mínimo 6 caracteres)
- 200: `{ message }`
- 400: `{ error }` si la contraseña es muy corta o Supabase rechaza el cambio
- 401: `{ error }` si la sesión no pudo establecerse

### POST /api/auth/test-email
Endpoint de diagnóstico para verificar el envío de correos (SMTP).

- Auth: No
- Body: `{ email }`
- 200: `{ message }`
- 400/500: `{ error, detalle }`

---

## 2. Perfiles — `/api/profiles`

Todas requieren Auth (Bearer token).

### GET /api/profiles/me
Devuelve el perfil del usuario autenticado.

- 200: `{ profile }`
- 404: `{ error: 'Perfil no encontrado' }`

### PUT /api/profiles/me
Actualiza el perfil propio.

- Body (todos opcionales): `{ nombre, telefono, foto_url }`
- 200: `{ message, profile }`
- 400: `{ error }` si no se envía ningún campo
- 500: `{ error, detalle }`

---

## 3. Cajas — `/api/cajas`

Todas requieren Auth (Bearer token).

### GET /api/cajas/mis-cajas
Lista las cajas activas a las que pertenece el usuario, junto con su rol en cada una.

- 200: `{ cajas: [{ id, nombre, descripcion, rol }] }`

### POST /api/cajas
Crea una nueva caja. El creador queda registrado automáticamente como `admin`.

- Body: `{ nombre, descripcion? }`
- 201: `{ message, caja }`
- 400: `{ error }` si falta el nombre
- 500: `{ error }` (si falla el registro del miembro, la caja creada se revierte)

### GET /api/cajas/:cajaId/resumen
Devuelve el detalle de la caja, el rol del usuario y un resumen de indicadores (miembros, socios, saldo total en ahorros, créditos activos, saldo pendiente, últimas 5 transacciones). Solo accesible para miembros de la caja.

> Nota: este endpoint está definido dos veces en `cajas.routes.js` (líneas 102 y 249) con lógica equivalente; Express usa la primera definición.

- 200: `{ caja, rol, resumen: { totalMiembros, totalSocios, saldoTotal, creditosActivos, saldoPendiente }, transaccionesRecientes }`
- 403: `{ error: 'No perteneces a esta caja' }`

### PUT /api/cajas/:cajaId
Edita nombre/descripción de la caja.

- Rol mínimo: `admin`
- Body (al menos uno): `{ nombre?, descripcion? }`
- 200: `{ message, caja }`
- 400: `{ error }` si no se envían campos
- 403: `{ error: 'Solo el admin puede editar la caja' }`

### POST /api/cajas/unirse
El usuario se une a una caja mediante un código de invitación. Si existe un socio en la caja con el mismo email y sin `user_id` vinculado, se vincula automáticamente.

- Body: `{ codigo }`
- 200: `{ message, socioVinculado, caja: { id, nombre, rol } }`
- 400: `{ error }` si falta el código o ya es miembro
- 404: `{ error: 'Código inválido o expirado' }`

---

## 4. Socios — `/api/cajas/:cajaId/socios`

Todas requieren Auth. Roles mínimos indicados por endpoint.

### GET /api/cajas/:cajaId/socios
Lista los socios de la caja, ordenados por apellido.

- Rol mínimo: `socio`
- 200: `{ socios }`
- 403: `{ error: 'Sin acceso a esta caja' }`

### GET /api/cajas/:cajaId/socios/:socioId
Detalle de un socio.

- Rol mínimo: `socio`
- 200: `{ socio }`
- 404: `{ error: 'Socio no encontrado' }`

### POST /api/cajas/:cajaId/socios
Registra un nuevo socio.

- Rol mínimo: `tesorero`
- Body: `{ nombre, apellido, cedula, telefono?, email?, direccion?, fecha_ingreso? }`
- 201: `{ message, socio }`
- 400: `{ error }` si faltan campos requeridos o la cédula ya existe en la caja

### PUT /api/cajas/:cajaId/socios/:socioId
Actualiza datos del socio.

- Rol mínimo: `tesorero`
- Body (al menos uno): `{ nombre?, apellido?, cedula?, telefono?, email?, direccion? }`
- 200: `{ message, socio }`
- 400: `{ error }` si no se envían campos

### DELETE /api/cajas/:cajaId/socios/:socioId
Desactiva (soft delete) un socio.

- Rol mínimo: `admin`
- 200: `{ message: 'Socio desactivado correctamente' }`

---

## 5. Cuentas de ahorro — `/api/cajas/:cajaId/cuentas`

Todas requieren Auth.

### GET /api/cajas/:cajaId/cuentas
Lista todas las cuentas de ahorro de la caja, con datos del socio.

- Rol mínimo: `socio`
- 200: `{ cuentas }`

### GET /api/cajas/:cajaId/cuentas/:cuentaId
Detalle de una cuenta y sus transacciones.

- Rol mínimo: `socio`
- 200: `{ cuenta, transacciones }`
- 404: `{ error: 'Cuenta no encontrada' }`

### GET /api/cajas/:cajaId/cuentas/socio/:socioId
Cuentas de un socio específico.

- Rol mínimo: `socio`
- 200: `{ cuentas }`

### POST /api/cajas/:cajaId/cuentas
Abre una nueva cuenta de ahorro (saldo inicial 0, número de cuenta autogenerado `CA-####`).

- Rol mínimo: `tesorero`
- Body: `{ socio_id }`
- 201: `{ message, cuenta }`
- 400: `{ error: 'El socio_id es requerido' }`
- 404: `{ error: 'Socio no encontrado en esta caja' }`

### POST /api/cajas/:cajaId/cuentas/:cuentaId/deposito
Registra un depósito y actualiza el saldo.

- Rol mínimo: `tesorero`
- Body: `{ monto, descripcion? }`
- 200: `{ message, transaccion, saldo_anterior, saldo_posterior }`
- 400: `{ error }` si el monto es inválido o la cuenta no está activa
- 404: `{ error: 'Cuenta no encontrada' }`

### POST /api/cajas/:cajaId/cuentas/:cuentaId/retiro
Registra un retiro, validando saldo suficiente.

- Rol mínimo: `tesorero`
- Body: `{ monto, descripcion? }`
- 200: `{ message, transaccion, saldo_anterior, saldo_posterior }`
- 400: `{ error }` si el monto es inválido, la cuenta no está activa, o el saldo es insuficiente
- 404: `{ error: 'Cuenta no encontrada' }`

### PUT /api/cajas/:cajaId/cuentas/:cuentaId/estado
Cambia el estado de la cuenta.

- Rol mínimo: `admin`
- Body: `{ estado }` — uno de `activa | cerrada | suspendida`
- 200: `{ message, cuenta }`
- 400: `{ error: 'Estado inválido' }`

---

## 6. Miembros de la caja — `/api/cajas/:cajaId/miembros`

Todas requieren Auth.

### GET /api/cajas/:cajaId/miembros
Lista los miembros de la caja con perfil y email.

- Rol mínimo: `socio`
- 200: `{ miembros: [{ id, rol, activo, created_at, profiles, email }] }`

### PUT /api/cajas/:cajaId/miembros/:userId
Cambia el rol de un miembro.

- Rol mínimo: `admin`
- Body: `{ nuevoRol }` — uno de `admin | tesorero | socio`
- 200: `{ message, miembro }`
- 400: `{ error: 'Rol inválido' }` o `{ error: 'No puedes cambiar tu propio rol' }`

### DELETE /api/cajas/:cajaId/miembros/:userId
Remueve (desactiva) a un miembro.

- Rol mínimo: `admin`
- 200: `{ message: 'Miembro removido correctamente' }`
- 400: `{ error: 'No puedes removerte a ti mismo' }`

### POST /api/cajas/:cajaId/miembros/invitaciones
Genera un código de invitación (8 caracteres, expira en 7 días). Desactiva cualquier código anterior sin usar.

- Rol mínimo: `admin`
- Body: `{ rolInvitado? }` (default `'socio'`)
- 201: `{ message, codigo, expira, rol }`

### GET /api/cajas/:cajaId/miembros/invitaciones
Devuelve el código de invitación activo (no usado, no expirado) más reciente de la caja.

- Rol mínimo: `admin`
- 200: `{ invitacion }` (o `null` si no hay ninguno activo)

---

## 7. Créditos — `/api/cajas/:cajaId/creditos`

Todas requieren Auth.

### GET /api/cajas/:cajaId/creditos
Lista los créditos de la caja con datos del socio.

- Rol mínimo: `socio`
- 200: `{ creditos }`

### GET /api/cajas/:cajaId/creditos/:creditoId
Detalle de un crédito y sus pagos asociados.

- Rol mínimo: `socio`
- 200: `{ credito, pagos }`
- 404: `{ error: 'Crédito no encontrado' }`

### GET /api/cajas/:cajaId/creditos/socio/:socioId
Créditos de un socio específico.

- Rol mínimo: `socio`
- 200: `{ creditos }`

### POST /api/cajas/:cajaId/creditos
Crea una solicitud de crédito (estado `pendiente`). Calcula `monto_total` con interés simple anual proporcional al plazo, y `cuota_mensual`.

- Rol mínimo: `tesorero`
- Body: `{ socio_id, monto_solicitado, tasa_interes, plazo_meses }`
- 201: `{ message, credito }`
- 400: `{ error: 'Faltan campos requeridos' }`
- 404: `{ error: 'Socio no encontrado en esta caja' }`

### PUT /api/cajas/:cajaId/creditos/:creditoId/aprobar
Aprueba una solicitud pendiente: fija fecha de desembolso/vencimiento y pasa a estado `activo`.

- Rol mínimo: `tesorero`
- Body: `{ fecha_desembolso? }` (default: hoy)
- 200: `{ message, credito }`
- 400: `{ error: 'Sólo se pueden aprobar solicitudes pendientes' }`
- 404: `{ error: 'Crédito no encontrado' }`

### POST /api/cajas/:cajaId/creditos/:creditoId/pago
Registra un pago contra el crédito y actualiza `saldo_pendiente` (pasa a `pagado` si llega a 0).

- Rol mínimo: `tesorero`
- Body: `{ monto, descripcion? }`
- 200: `{ message, pago, credito }`
- 400: `{ error: 'Monto inválido' }` o `{ error: 'El crédito no está activo' }`
- 404: `{ error: 'Crédito no encontrado' }`

### PUT /api/cajas/:cajaId/creditos/:creditoId/estado
Cambia manualmente el estado del crédito.

- Rol mínimo: `admin`
- Body: `{ estado }` — uno de `pendiente | activo | pagado | mora | castigado`
- 200: `{ message, credito }`
- 400: `{ error: 'Estado inválido' }`

---

## 8. Pagos — `/api/cajas/:cajaId/pagos`

Todas requieren Auth. Estos endpoints manejan pagos por cuota (tabla `pagos_credito`), de forma similar pero independiente al endpoint `POST /creditos/:creditoId/pago`.

### GET /api/cajas/:cajaId/pagos
Lista todos los pagos registrados en la caja.

- Rol mínimo: `socio`
- 200: `{ pagos }`

### GET /api/cajas/:cajaId/pagos/:pagoId
Detalle de un pago.

- Rol mínimo: `socio`
- 200: `{ pago }`
- 404: `{ error: 'Pago no encontrado' }`

### GET /api/cajas/:cajaId/pagos/credito/:creditoId
Lista los pagos de un crédito, ordenados por número de cuota.

- Rol mínimo: `socio`
- 200: `{ pagos }`

### POST /api/cajas/:cajaId/pagos
Registra el pago de una cuota y actualiza el saldo pendiente del crédito (pasa a `pagado` si llega a 0).

- Rol mínimo: `tesorero`
- Body: `{ credito_id, numero_cuota, monto_pagado, saldo_antes, saldo_despues, fecha_pago? }`
- 200: `{ message, pago, credito }`
- 400: `{ error: 'Faltan campos requeridos' }`
- 404: `{ error: 'Crédito no encontrado' }`

---

## Resumen de montaje de rutas (`server.js`)

```
/api/auth                      → auth.routes.js
/api/profiles                  → profile.routes.js
/api/cajas                     → cajas.routes.js
/api/cajas/:cajaId/socios      → socios.routes.js
/api/cajas/:cajaId/cuentas     → ahorros.routes.js
/api/cajas/:cajaId/miembros    → miembros.routes.js
/api/cajas/:cajaId/creditos    → creditos.routes.js
/api/cajas/:cajaId/pagos       → pagos.routes.js
```
