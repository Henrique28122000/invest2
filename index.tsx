
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Elemento root não encontrado.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro crítico na renderização:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #020617; color: white; font-family: sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 500px;">
          <h1 style="color: #f43f5e; font-size: 24px; margin-bottom: 16px;">Falha no Carregamento</h1>
          <p style="color: #94a3b8; margin-bottom: 24px;">Ocorreu um erro ao iniciar a aplicação React.</p>
          <div style="background: #1e293b; padding: 16px; border-radius: 12px; text-align: left; overflow: auto; font-family: monospace; font-size: 13px; color: #f8fafc;">
            ${error instanceof Error ? error.message : String(error)}
          </div>
          <button onclick="window.location.reload()" style="margin-top: 24px; padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Tentar Novamente</button>
        </div>
      </div>
    `;
  }
}
