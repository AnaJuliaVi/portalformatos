import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_DOMAIN = "@g.globo";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "E-mail é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
      return new Response(
        JSON.stringify({ error: "Acesso restrito ao portal corporativo." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await adminClient
      .from("portal_users")
      .select("email, role, status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (authError || !authData) {
      return new Response(
        JSON.stringify({ error: "Seu e-mail não está autorizado. Solicite acesso ao administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (authData.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Seu acesso foi desativado. Contate o administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === normalizedEmail);

    if (!existingUser) {
      const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: randomPassword,
        email_confirm: true,
      });

      if (signUpError || !signUpData.user) {
        return new Response(
          JSON.stringify({ error: "Não foi possível criar o acesso. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: randomPassword,
    });

    if (signInError || !signInData.session) {
      const freshPassword = crypto.randomUUID() + crypto.randomUUID();
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser!.id,
        { password: freshPassword },
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Não foi possível autenticar. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: retryData, error: retryError } = await userClient.auth.signInWithPassword({
        email: normalizedEmail,
        password: freshPassword,
      });

      if (retryError || !retryData.session) {
        return new Response(
          JSON.stringify({ error: "Não foi possível autenticar. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          session: retryData.session,
          role: authData.role,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        session: signInData.session,
        role: authData.role,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
