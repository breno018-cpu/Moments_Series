import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Tema único Glass Aurora — força dark e remove preferências antigas
document.documentElement.classList.add("dark");
try {
  localStorage.removeItem("theme-manual");
} catch {}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registro do Service Worker para PWA (Instalação na tela inicial e atalhos)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Falha ao registrar Service Worker:", err);
      });
  });
}

// Proteção da plataforma: previne menu de contexto em imagens e atalhos de inspeção/cópia de código
if (typeof window !== "undefined") {
  document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    // Permite clique direito apenas em campos de texto/input
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }
    e.preventDefault();
  });

  document.addEventListener("keydown", (e) => {
    // Bloqueia Ctrl+S (Salvar Página) e Ctrl+U (Ver Código Fonte)
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")) {
      e.preventDefault();
    }
  });
}


