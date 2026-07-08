// backend/routes/chatbot.routes.js
const express = require('express');
const router  = express.Router();

// El "system prompt" define de qué puede hablar el bot y de qué no
const CONTEXTO = `Eres un asistente de educación financiera para una plataforma de cajas de ahorro comunitarias llamada Domus. 
Respondes SOLO preguntas conceptuales sobre finanzas personales y comunitarias: ahorro, interés, crédito, presupuesto, planificación financiera.
Das respuestas breves, claras y en español, con lenguaje sencillo para personas sin formación financiera.
Si te preguntan algo que no sea de finanzas, respondes amablemente que solo puedes ayudar con temas de educación financiera.
Nunca inventas datos específicos de ninguna caja ni usuario.`;

// POST /api/chatbot/preguntar
router.post('/preguntar', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ error: 'El mensaje es requerido' });
  }

  // Límite de longitud para evitar abuso
  if (mensaje.length > 500) {
    return res.status(400).json({ error: 'El mensaje es demasiado largo' });
  }

  try {
    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          messages: [
            { role: 'system', content: CONTEXTO },
            { role: 'user',   content: mensaje },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Error HuggingFace:', data);
      return res.status(500).json({ error: 'El asistente no está disponible ahora' });
    }

    const respuesta = data.choices?.[0]?.message?.content ?? 'No pude generar una respuesta.';

    return res.json({ respuesta });

  } catch (err) {
    console.error('Error chatbot:', err.message);
    return res.status(500).json({ error: 'Error al procesar tu pregunta' });
  }
});

module.exports = router;