// backend/routes/creditos.routes.js
const express = require('express')
const router = express.Router({ mergeParams: true })
const supabaseAdmin = require('../config/supabaseAdmin')
const verifyToken = require('../middlewares/auth.middleware')

router.use(verifyToken)

// Helper de rol (misma lógica que en ahorros)
async function verificarRol(userId, cajaId, rolMinimo = 'socio') {
	const jerarquia = { socio: 1, tesorero: 2, admin: 3 }
	const { data } = await supabaseAdmin
		.from('miembros_caja')
		.select('rol')
		.eq('caja_id', cajaId)
		.eq('user_id', userId)
		.eq('activo', true)
		.single()
	if (!data) return null
	if (jerarquia[data.rol] < jerarquia[rolMinimo]) return null
	return data.rol
}

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/creditos
// Lista créditos de la caja
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
	const { cajaId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'socio')
	if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' })

	const { data, error } = await supabaseAdmin
		.from('creditos')
		.select(`*, socios ( nombre, apellido, cedula )`)
		.eq('caja_id', cajaId)
		.order('created_at', { ascending: false })

	if (error) return res.status(500).json({ error: error.message })

	return res.json({ creditos: data ?? [] })
})

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/creditos/:creditoId
// Detalle de un crédito y sus pagos
// ─────────────────────────────────────────────
router.get('/:creditoId', async (req, res) => {
	const { cajaId, creditoId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'socio')
	if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' })

	const { data: credito, error } = await supabaseAdmin
		.from('creditos')
		.select(`*, socios ( nombre, apellido, cedula )`)
		.eq('id', creditoId)
		.eq('caja_id', cajaId)
		.single()

	if (error || !credito) return res.status(404).json({ error: 'Crédito no encontrado' })

	const { data: pagos } = await supabaseAdmin
		.from('pagos_credito')
		.select('*')
		.eq('credito_id', creditoId)
		.order('created_at', { ascending: false })

	return res.json({ credito, pagos: pagos ?? [] })
})

// ─────────────────────────────────────────────
// GET /api/cajas/:cajaId/creditos/socio/:socioId
// Créditos por socio
// ─────────────────────────────────────────────
router.get('/socio/:socioId', async (req, res) => {
	const { cajaId, socioId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'socio')
	if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' })

	const { data, error } = await supabaseAdmin
		.from('creditos')
		.select('*')
		.eq('caja_id', cajaId)
		.eq('socio_id', socioId)
		.order('created_at', { ascending: false })

	if (error) return res.status(500).json({ error: error.message })

	return res.json({ creditos: data ?? [] })
})

// ─────────────────────────────────────────────
// POST /api/cajas/:cajaId/creditos
// Crear solicitud de crédito (estado: 'pendiente')
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
	const { cajaId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'tesorero')
	if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' })

	const { socio_id, monto_solicitado, tasa_interes, plazo_meses } = req.body
	if (!socio_id || !monto_solicitado || !tasa_interes || !plazo_meses) {
		return res.status(400).json({ error: 'Faltan campos requeridos' })
	}

	// Valida que el socio pertenezca a la caja
	const { data: socio } = await supabaseAdmin
		.from('socios')
		.select('id')
		.eq('id', socio_id)
		.eq('caja_id', cajaId)
		.eq('activo', true)
		.single()

	if (!socio) return res.status(404).json({ error: 'Socio no encontrado en esta caja' })

	// Calcula monto total por interés simple anual proporcional al plazo
	const meses = parseInt(plazo_meses, 10)
	const monto = parseFloat(monto_solicitado)
	const tasa = parseFloat(tasa_interes)
	const monto_total = +(monto * (1 + (tasa / 100) * (meses / 12))).toFixed(2)
	const cuota_mensual = +(monto_total / meses).toFixed(2)

	const { data, error } = await supabaseAdmin
		.from('creditos')
		.insert({
			caja_id:         cajaId,
			socio_id,
			monto_solicitado: monto,
			tasa_interes:    tasa,
			plazo_meses:     meses,
			monto_total,
			cuota_mensual,
			saldo_pendiente: monto_total,
			estado:          'pendiente',
		})
		.select()
		.single()

	if (error) return res.status(500).json({ error: error.message })

	return res.status(201).json({ message: 'Solicitud registrada', credito: data })
})

// ─────────────────────────────────────────────
// PUT /api/cajas/:cajaId/creditos/:creditoId/aprobar
// Aprueba el crédito: establece fechas y pone estado 'activo'
// ─────────────────────────────────────────────
router.put('/:creditoId/aprobar', async (req, res) => {
	const { cajaId, creditoId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'tesorero')
	if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' })

	const { fecha_desembolso } = req.body
	const fecha = fecha_desembolso ? new Date(fecha_desembolso) : new Date()

	// Lee el crédito
	const { data: credito } = await supabaseAdmin
		.from('creditos')
		.select('*')
		.eq('id', creditoId)
		.eq('caja_id', cajaId)
		.single()

	if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' })
	if (credito.estado !== 'pendiente') return res.status(400).json({ error: 'Sólo se pueden aprobar solicitudes pendientes' })

	const fecha_vencimiento = new Date(fecha)
	fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + parseInt(credito.plazo_meses, 10))

	const { data: dataUpd, error: errorUpd } = await supabaseAdmin
		.from('creditos')
		.update({
			estado: 'activo',
			fecha_desembolso: fecha.toISOString().split('T')[0],
			fecha_vencimiento: fecha_vencimiento.toISOString().split('T')[0],
			aprobado_por: req.user.id,
			updated_at: new Date().toISOString(),
		})
		.eq('id', creditoId)
		.select()
		.single()

	if (errorUpd) return res.status(500).json({ error: errorUpd.message })

	return res.json({ message: 'Crédito aprobado', credito: dataUpd })
})

// ─────────────────────────────────────────────
// POST /api/cajas/:cajaId/creditos/:creditoId/pago
// Registra un pago para el crédito
// ─────────────────────────────────────────────
router.post('/:creditoId/pago', async (req, res) => {
	const { cajaId, creditoId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'tesorero')
	if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' })

	const { monto, descripcion } = req.body
	if (!monto || isNaN(monto) || monto <= 0) return res.status(400).json({ error: 'Monto inválido' })

	const { data: credito } = await supabaseAdmin
		.from('creditos')
		.select('*')
		.eq('id', creditoId)
		.eq('caja_id', cajaId)
		.single()

	if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' })
	if (credito.estado !== 'activo') return res.status(400).json({ error: 'El crédito no está activo' })

	const pago = parseFloat(monto)
	const saldoAnterior = parseFloat(credito.saldo_pendiente)
	const saldoPosterior = Math.max(0, +(saldoAnterior - pago).toFixed(2))

	// Inserta registro de pago
	const { data: pagoData, error: errorPago } = await supabaseAdmin
		.from('pagos_credito')
		.insert({
			credito_id: creditoId,
			caja_id: cajaId,
			socio_id: credito.socio_id,
			monto: pago,
			descripcion: descripcion ?? '',
			registrado_por: req.user.id,
		})
		.select()
		.single()

	if (errorPago) return res.status(500).json({ error: errorPago.message })

	// Actualiza saldo pendiente y estado si corresponde
	const updates = { saldo_pendiente: saldoPosterior, updated_at: new Date().toISOString() }
	if (saldoPosterior <= 0) updates.estado = 'pagado'

	const { data: creditoActualizado, error: errorUpd2 } = await supabaseAdmin
		.from('creditos')
		.update(updates)
		.eq('id', creditoId)
		.select()
		.single()

	if (errorUpd2) return res.status(500).json({ error: errorUpd2.message })

	return res.json({ message: 'Pago registrado', pago: pagoData, credito: creditoActualizado })
})

// ─────────────────────────────────────────────
// PUT /api/cajas/:cajaId/creditos/:creditoId/estado
// Cambia el estado del crédito (admin)
// ─────────────────────────────────────────────
router.put('/:creditoId/estado', async (req, res) => {
	const { cajaId, creditoId } = req.params
	const rol = await verificarRol(req.user.id, cajaId, 'admin')
	if (!rol) return res.status(403).json({ error: 'Se requiere rol admin' })

	const { estado } = req.body
	const estadosValidos = ['pendiente', 'activo', 'pagado', 'mora', 'castigado']
	if (!estadosValidos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' })

	const { data, error } = await supabaseAdmin
		.from('creditos')
		.update({ estado, updated_at: new Date().toISOString() })
		.eq('id', creditoId)
		.eq('caja_id', cajaId)
		.select()
		.single()

	if (error) return res.status(500).json({ error: error.message })

	return res.json({ message: 'Estado actualizado', credito: data })
})

module.exports = router

