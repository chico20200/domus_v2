# DOMUS

Sistema de gestión de tesorería para cajas de ahorro comunitarias. Digitaliza el registro de socios, ahorros y créditos, y automatiza el cálculo y la distribución de intereses entre los socios al cierre de cada ciclo.

Una misma instancia da servicio a múltiples cajas de forma aislada (multi-caja), con control de acceso por roles (administrador, tesorero, socio).

**Demo:** https://domus-online.netlify.app

---

## Tecnologías

| Capa | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express, JWT |
| Base de datos | PostgreSQL (Supabase) con Row Level Security |
| Despliegue | Netlify (frontend), Render (backend) |

---

## Estructura

```
domus_v2/
├── frontend/     # React + TypeScript (Vite)
└── backend/      # Node.js + Express (API REST)
```

---

## Requisitos

- Node.js v18 o superior
- Una cuenta de Supabase con la base de datos creada

---

## Instalación y ejecución

### Backend

```bash
cd backend
npm install
npm run dev          # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Variables de entorno

### `backend/.env`

```
PORT=3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_ANON_KEY=eyJhbGci...
FRONTEND_URL=http://localhost:5173
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
HUGGINGFACE_API_KEY=...
```

### `frontend/.env`

```
VITE_API_URL=http://localhost:3000/api
VITE_PAYPAL_CLIENT_ID=...
```

---

## Módulos

- **Autenticación** — registro, inicio de sesión y recuperación de contraseña (JWT).
- **Cajas** — creación y gestión multi-caja con invitaciones por código.
- **Socios** — registro y administración de miembros por caja.
- **Ahorros** — depósitos y retiros con trazabilidad de saldos.
- **Créditos** — préstamos con tabla de amortización de interés simple.
- **Pagos** — cuotas separando capital e interés, con prepago y abono parcial.
- **Reportes** — distribución proporcional de intereses por ciclo y estado de la caja.
- **Ciclos** — periodo configurable con cálculo automático del ciclo vigente.

---

## Roles

| Rol | Permisos |
|---|---|
| Socio | Consulta de sus propias cuentas de ahorro |
| Tesorero | Operaciones: socios, ahorros, créditos, pagos y reportes |
| Admin | Todo lo anterior + gestión de miembros y configuración |

Los roles son por caja: un usuario puede ser admin en una caja y socio en otra.

---

## Despliegue

- **Frontend (Netlify):** build `npm run build`, directorio `dist/`.
- **Backend (Render):** servicio web con `npm start`.

Configurar las variables de entorno en cada plataforma. En el backend, `FRONTEND_URL` debe apuntar a la URL de Netlify para el CORS.

---

## Autor

Sebastián Chico — Escuela Politécnica Nacional (ESFOT), 2026.
