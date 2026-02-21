import 'dotenv/config';
import { buildApp } from './app';


async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: 3333, host: '0.0.0.0' });
    console.log('NSV API running on http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();