import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ROLE_TABLES = ["profiles", "users"] as const;

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

function looksConfigured(value: string | undefined) {
  return Boolean(value && !value.includes("your_") && !value.includes("_here"));
}

async function upsertRoleWithAdminClient(userId: string, email: string | null | undefined) {
  if (!supabaseUrl || !looksConfigured(serviceRoleKey)) {
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey!);

  for (const table of ROLE_TABLES) {
    const { error } = await adminClient.from(table).upsert({
      id: userId,
      email,
      role: "Operator",
    });

    if (error && !isMissingTableError(error)) {
      console.error(`Erro ao salvar role em ${table}:`, error);
    }
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !publicKey) {
    return NextResponse.json(
      { error: "As variaveis publicas do Supabase nao estao configuradas." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha sao obrigatorios." },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Informe um email valido." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const publicClient = createClient(supabaseUrl, publicKey);
    const { data, error } = await publicClient.auth.signUp({
      email,
      password,
      options: {
        data: name ? { name } : undefined,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Nao foi possivel criar o usuario." },
        { status: 400 }
      );
    }

    await upsertRoleWithAdminClient(data.user.id, data.user.email);

    return NextResponse.json({
      message: "Usuario criado com sucesso.",
      needsEmailConfirmation: !data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao criar usuario:", error);
    return NextResponse.json(
      { error: "Nao foi possivel processar o cadastro." },
      { status: 500 }
    );
  }
}
