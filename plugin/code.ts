figma.showUI(__html__, { width: 720, height: 760, title: 'Moood!' });

async function main() {
  const savedToken = await figma.clientStorage.getAsync('pinterest_token');
  if (savedToken) {
    figma.ui.postMessage({ type: 'show-view', view: 'search' });
  } else {
    figma.ui.postMessage({ type: 'show-view', view: 'auth' });
  }
}

main();

figma.ui.onmessage = async (msg) => {
  // Flujo de Autenticación
  if (msg.type === 'connect-pinterest') {
    const PROXY_URL = 'https://moood-backend-test-ctui.vercel.app';
    const userEmail = 'test@moood-googleai.app';
    const authUrl = `${PROXY_URL}/api/login?email=${encodeURIComponent(userEmail)}`;
    figma.ui.postMessage({ type: 'open-auth-window', url: authUrl });
  }
  if (msg.type === 'token-received') {
    const token = msg.token;
    await figma.clientStorage.setAsync('pinterest_token', token);
    figma.ui.postMessage({ type: 'show-view', view: 'search' });
  }

  // Flujo de Obtener Pines
  if (msg.type === 'get-pins') {
    const token = await figma.clientStorage.getAsync('pinterest_token');
    const category = msg.category;
    if (!token) { figma.ui.postMessage({ type: 'show-view', view: 'auth' }); return; }
    try {
      const response = await fetch('https://moood-backend-test-ctui.vercel.app/api/get-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, token }),
      });
      if (!response.ok) throw new Error('Failed to fetch pins from backend.');
      const pins = await response.json();
      figma.ui.postMessage({ type: 'show-view', view: 'moodboard', data: { pins, category } });
    } catch (e: any) {
      figma.notify('Error al obtener los pines.', { error: true });
    }
  }

  // Lógica de Imagen (Actualizada para el lightbox)
  if (msg.type === 'fetch-image') {
    try {
      const proxyUrl = `https://moood-backend-test-ctui.vercel.app/api/image-proxy?url=${encodeURIComponent(msg.url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Proxy failed with status ${response.status}`);
      const imageBytes = await response.arrayBuffer();
      // Devolvemos el target para que la UI sepa si es para el grid o el lightbox
      figma.ui.postMessage({ type: 'image-loaded', url: msg.url, imageBytes: new Uint8Array(imageBytes), target: msg.target });
    } catch (e) {
      console.error('Error fetching image via proxy:', e);
    }
  }

  if (msg.type === 'back-to-search') {
    figma.ui.postMessage({ type: 'show-view', view: 'search' });
  }
};