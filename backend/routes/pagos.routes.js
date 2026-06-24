// backend/routes/pagos.routes.js
const express = require('express')
const router = express.Router({ mergeParams: true })
const supabaseAdmin = require('../config/supabaseAdmin')
const verifyToken = require('../middlewares/auth.middleware')

router.use(verifyToken)

// Helper de rol
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

// GET /api/cajas/:cajaId/pagos
// Lista todos los pagos de la caja
router.get('/', async (req, res) => {
  const { cajaId } = req.params
  const rol = await verificarRol(req.user.id, cajaId, 'socio')
  if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' })

  const { data, error } = await supabaseAdmin
    .from('pagos_credito')
    .select('*')
    .eq('caja_id', cajaId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ pagos: data ?? [] })
})

// GET /api/cajas/:cajaId/pagos/:pagoId
router.get('/:pagoId', async (req, res) => {
  const { cajaId, pagoId } = req.params
  const rol = await verificarRol(req.user.id, cajaId, 'socio')
  if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' })

  const { data, error } = await supabaseAdmin
    .from('pagos_credito')
    .select('*')
    .eq('id', pagoId)
    .eq('caja_id', cajaId)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Pago no encontrado' })
  return res.json({ pago: data })
})

// GET /api/cajas/:cajaId/pagos/credito/:creditoId
router.get('/credito/:creditoId', async (req, res) => {
  const { cajaId, creditoId } = req.params
  const rol = await verificarRol(req.user.id, cajaId, 'socio')
  if (!rol) return res.status(403).json({ error: 'Sin acceso a esta caja' })

  const { data, error } = await supabaseAdmin
    .from('pagos_credito')
    .select('*')
    .eq('caja_id', cajaId)
    .eq('credito_id', creditoId)
    .order('numero_cuota', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ pagos: data ?? [] })
})

// POST /api/cajas/:cajaId/pagos
// Registra un pago y actualiza saldo del crédito
router.post('/', async (req, res) => {
  const { cajaId } = req.params
  const rol = await verificarRol(req.user.id, cajaId, 'tesorero')
  if (!rol) return res.status(403).json({ error: 'Se requiere rol tesorero o admin' })

  const { credito_id, numero_cuota, monto_pagado, saldo_antes, saldo_despues, fecha_pago } = req.body
  if (!credito_id || numero_cuota === undefined || monto_pagado === undefined || saldo_antes === undefined || saldo_despues === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  // Valida crédito
  const { data: credito } = await supabaseAdmin
    .from('creditos')
    .select('id, saldo_pendiente')
    .eq('id', credito_id)
    .eq('caja_id', cajaId)
    .single()

  if (!credito) return res.status(404).json({ error: 'Crédito no encontrado' })

  const fecha = fecha_pago ? fecha_pago : new Date().toISOString().split('T')[0]

  const { data: pago, error: errorPago } = await supabaseAdmin
    .from('pagos_credito')
    .insert({
      caja_id: cajaId,
      credito_id,
      numero_cuota,
      monto_pagado: parseFloat(monto_pagado),
      saldo_antes: parseFloat(saldo_antes),
      saldo_despues: parseFloat(saldo_despues),
      fecha_pago: fecha,
      registrado_por: req.user.id,
    })
    .select()
    .single()

  if (errorPago) return res.status(500).json({ error: errorPago.message })

  // Actualiza saldo pendiente en creditos
  const updates = { saldo_pendiente: parseFloat(saldo_despues), updated_at: new Date().toISOString() }
  if (parseFloat(saldo_despues) <= 0) updates.estado = 'pagado'

  const { data: creditoActualizado, error: errorUpd } = await supabaseAdmin
    .from('creditos')
    .update(updates)
    .eq('id', credito_id)
    .select()
    .single()

  if (errorUpd) return res.status(500).json({ error: errorUpd.message })

  return res.json({ message: 'Pago registrado', pago, credito: creditoActualizado })
})

module.exports = router
