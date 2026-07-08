// src/components/ChatbotFlotante.tsx
import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot } from "lucide-react"
import { chatbotService } from "../api/chatbot.service"

interface Mensaje {
  autor: "usuario" | "bot"
  texto: string
}

export function ChatbotFlotante() {
  const [abierto,   setAbierto]   = useState(false)
  const [mensajes,  setMensajes]  = useState<Mensaje[]>([
    { autor: "bot", texto: "¡Hola! Soy tu asistente de educación financiera. Pregúntame sobre ahorro, interés, crédito o cómo manejar tu dinero." }
  ])
  const [entrada,   setEntrada]   = useState("")
  const [cargando,  setCargando]  = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  async function enviar() {
    const texto = entrada.trim()
    if (!texto || cargando) return

    // Agrega el mensaje del usuario
    setMensajes(prev => [...prev, { autor: "usuario", texto }])
    setEntrada("")
    setCargando(true)

    try {
      const res = await chatbotService.preguntar(texto)
      setMensajes(prev => [...prev, { autor: "bot", texto: res.respuesta }])
    } catch (err) {
      setMensajes(prev => [...prev, {
        autor: "bot",
        texto: "Lo siento, no pude responder en este momento. Intenta de nuevo."
      }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir asistente"
          style={{
            position:     "fixed",
            bottom:       "24px",
            right:        "24px",
            width:        "56px",
            height:       "56px",
            borderRadius: "50%",
            background:   "var(--color-primary_y)",
            border:       "none",
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"center",
            boxShadow:    "0 4px 12px rgba(0,0,0,0.2)",
            zIndex:       40,
          }}
        >
          <MessageCircle size={24} color="white" />
        </button>
      )}

      {/* Ventana del chat */}
      {abierto && (
        <div
          style={{
            position:     "fixed",
            bottom:       "24px",
            right:        "24px",
            width:        "360px",
            maxWidth:     "calc(100vw - 48px)",
            height:       "500px",
            maxHeight:    "calc(100vh - 48px)",
            background:   "var(--bg-surface)",
            borderRadius: "16px",
            boxShadow:    "0 8px 30px rgba(0,0,0,0.25)",
            display:      "flex",
            flexDirection:"column",
            overflow:     "hidden",
            zIndex:       40,
            border:       "1px solid var(--border-base)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding:      "14px 16px",
              background:   "var(--color-primary_y)",
              display:      "flex",
              alignItems:   "center",
              gap:          "10px",
            }}
          >
            <Bot size={20} color="white" />
            <span style={{ color: "white", fontWeight: 500, flex: 1, fontSize: "14px" }}>
              Asistente financiero
            </span>
            <button
              onClick={() => setAbierto(false)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={18} color="white" />
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf:  m.autor === "usuario" ? "flex-end" : "flex-start",
                  maxWidth:   "80%",
                  padding:    "10px 12px",
                  borderRadius: "12px",
                  fontSize:   "13px",
                  lineHeight: "1.5",
                  background: m.autor === "usuario"
                    ? "var(--color-primary_y)"
                    : "var(--bg-base)",
                  color: m.autor === "usuario"
                    ? "white"
                    : "var(--text-primary)",
                }}
              >
                {m.texto}
              </div>
            ))}
            {cargando && (
              <div style={{ alignSelf: "flex-start", padding: "10px 12px", color: "var(--text-muted)", fontSize: "13px" }}>
                Escribiendo...
              </div>
            )}
            <div ref={finRef} />
          </div>

          {/* Entrada */}
          <div
            style={{
              padding:    "12px",
              borderTop:  "1px solid var(--border-base)",
              display:    "flex",
              gap:        "8px",
            }}
          >
            <input
              type="text"
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              onKeyDown={e => e.key === "Enter" && enviar()}
              placeholder="Escribe tu pregunta..."
              disabled={cargando}
              style={{
                flex:         1,
                padding:      "8px 12px",
                borderRadius: "8px",
                border:       "1px solid var(--border-base)",
                background:   "var(--bg-base)",
                color:        "var(--text-primary)",
                fontSize:     "13px",
                outline:      "none",
              }}
            />
            <button
              onClick={enviar}
              disabled={cargando || !entrada.trim()}
              aria-label="Enviar"
              style={{
                width:        "38px",
                height:       "38px",
                borderRadius: "8px",
                background:   "var(--color-primary_y)",
                border:       "none",
                cursor:       cargando ? "not-allowed" : "pointer",
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                opacity:      (cargando || !entrada.trim()) ? 0.5 : 1,
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}