"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "E-posta veya şifre hatalı." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "E-posta adresin henüz doğrulanmamış. Gelen kutunu kontrol et." };
    }
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved, is_admin")
      .eq("id", user.id)
      .single<{ approved: boolean; is_admin: boolean }>();

    if (profile && !profile.approved && !profile.is_admin) {
      redirect("/pending");
    }
  }

  redirect("/");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const name     = formData.get("name") as string;
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Bu e-posta zaten kayıtlı." };
    }
    return { error: "Kayıt olurken bir hata oluştu." };
  }

  if (data.user) {
    const admin = createAdminClient();
    await admin.from("profiles").upsert(
      { id: data.user.id, name, email, approved: false },
      { onConflict: "id" }
    );
  }

  // If session is null, Supabase sent a confirmation email with OTP
  if (!data.session) {
    redirect(`/verify?email=${encodeURIComponent(email)}`);
  }

  redirect("/pending");
}

export async function verifyEmail(email: string, token: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { error: "Kod hatalı veya süresi dolmuş. Lütfen tekrar dene." };
  }

  redirect("/pending");
}

export async function resendVerification(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) return { error: "Kod gönderilemedi. Lütfen tekrar dene." };
  return {};
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
