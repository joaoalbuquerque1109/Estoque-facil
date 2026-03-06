import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint should be called only on the server (POST) and
// will create a special "dev" user with admin role if it doesn't exist.
// It uses the service role key so the request should never be exposed to
// the browser; you can trigger it manually from curl or the Supabase SQL
// editor once after deploying to set up the account.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST() {
  try {
    // Try to sign in to see if the user already exists
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: 'dev@local',
      password: 'admin123',
    });

    if (signInData.session) {
      return NextResponse.json({ message: 'Usuário dev já existe' });
    }
  } catch (err) {
    // If signin failed because user doesn't exist we continue
  }

  // create a new user using admin API
  const { data, error: createErr } = await supabase.auth.admin.createUser({
    email: 'dev@local',
    password: 'admin123',
    email_confirm: true,
  });

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 500 });
  }

  // ensure profile row with role Admin
  await supabase.from('profiles').upsert({
    id: data?.user?.id,
    email: data?.user?.email,
    role: 'Admin',
  });

  return NextResponse.json({ message: 'Usuário dev criado', user: data?.user });
}
