import { createServer } from 'vite';

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '0.0.0.0';

const server = await createServer({
  server: {
    host,
    port,
    strictPort: true,
  },
});

await server.listen();
server.printUrls();

process.stdin.resume();

