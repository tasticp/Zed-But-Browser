// Simple dev server for Tauri
Bun.serve({
  port: 1420,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;
    
    // Default to index.html for root
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Remove leading slash and serve from public directory
    const filePath = `public${pathname}`;
    
    try {
      const file = Bun.file(filePath);
      return new Response(file);
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log('Dev server running on http://localhost:1420');
