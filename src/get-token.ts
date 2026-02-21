import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!, // aqui é a ANON key, usada para login
);

async function main() {
  const email = process.env.AUTH_EMAIL || process.argv[2];
  const password = process.env.AUTH_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error(JSON.stringify({ error: 'AUTH_EMAIL and AUTH_PASSWORD must be provided via .env or as args: get-token <email> <password>' }));
    process.exit(1);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(JSON.stringify({ error: error.message || error }));
    process.exit(1);
  }

  const token = data.session?.access_token;
  if (!token) {
    console.error(JSON.stringify({ error: 'No access token returned' }));
    process.exit(1);
  }

  // Print JSON only (easy to parse)
  console.log(JSON.stringify({ access_token: token }));
}

main().catch(err => {
  console.error(JSON.stringify({ error: err?.message || err }));
  process.exit(1);
});
