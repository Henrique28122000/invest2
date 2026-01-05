
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Erro crítico na montagem do React:", error);
  rootElement.innerHTML = `
    <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #020617; color: #ef4444; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="font-size: 24px; margin-bottom: 10px;">Erro de Inicialização</h1>
        <p style="color: #94a3b8;">Houve um problema ao carregar o aplicativo. Por favor, verifique o console ou as variáveis de ambiente.</p>
        <pre style="background: #1e293b; padding: 15px; border-radius: 8px; font-size: 12px; color: #f8fafc; margin-top: 20px; text-align: left; overflow: auto; max-width: 90vw;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Recarregar</button>
      </div>
    </div>
  `;
}
