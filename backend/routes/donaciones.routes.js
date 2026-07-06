// backend/routes/donaciones.routes.js
const express = require('express');
const router  = express.Router();
const { PAYPAL_API, getAccessToken } = require('../config/paypal');

// POST /api/donaciones/crear-orden
// El frontend manda el monto, el backend crea la orden en PayPal
router.post('/crear-orden', async (req, res) => {
  const { monto } = req.body;

  // Validación del monto
  const montoNum = parseFloat(monto);
  if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'Monto inválido' });
  }
  if (montoNum > 10000) {
    return res.status(400).json({ error: 'Monto máximo excedido' });
  }

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: montoNum.toFixed(2),
          },
          description: 'Donación a Domus',
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: 'Error al crear la orden en PayPal' });
    }

    return res.json({ orderID: data.id });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/donaciones/capturar-orden
// Después de que el usuario paga, el backend verifica y captura el pago
router.post('/capturar-orden', async (req, res) => {
  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: 'orderID es requerido' });
  }

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Verifica que el pago se completó
    if (data.status === 'COMPLETED') {
      const monto = data.purchase_units[0].payments.captures[0].amount.value;
      return res.json({
        message: 'Donación completada. ¡Gracias!',
        monto,
        status: 'COMPLETED',
      });
    }

    return res.status(400).json({ error: 'El pago no se completó' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;