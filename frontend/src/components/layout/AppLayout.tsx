// src/components/layout/AppLayout.tsx
import { useState } from "react"
import  {Sidebar}  from "./Sidebar"
import { TopBar }  from "./TopBar"
import { ChatbotFlotante } from "../ChatbotFlotante"

interface AppLayoutProps {
  children: React.ReactNode
  titulo:   string   // título de la página actual → va en el TopBar
}

export function AppLayout({ children, titulo }: AppLayoutProps) {
  const [sidebarAbierto, setSidebarAbierto] = useState(true)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Sidebar */}
      <Sidebar
        abierto={sidebarAbierto}
        onToggle={() => setSidebarAbierto(prev => !prev)}
      />

      {/* Columna derecha: TopBar + contenido */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar titulo={titulo} />

        {/* Contenido scrolleable */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <ChatbotFlotante />
    </div>
  )
}