import type { Server } from 'node:http';
import app from './app.js';

const PORT = process.env.PORT || 5000;

let server: Server;

async function main() {
  try {
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection detected:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception detected:', error);
  process.exit(1);
});
