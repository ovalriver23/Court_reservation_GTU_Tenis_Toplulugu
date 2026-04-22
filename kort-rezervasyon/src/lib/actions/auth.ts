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
    return { error: "Giriş başarısız. Lütfen tekrar dene." };
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

  if (!email.endsWith("@gtu.edu.tr")) {
    return { error: "Sadece @gtu.edu.tr e-posta adresleri ile kayıt olabilirsiniz." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      return { error: "Bu e-posta zaten kayıtlı." };
    }
    if (error.message.includes("Password should be")) {
      return { error: "Şifre en az 6 karakter olmalı." };
    }
    if (error.message.includes("rate limit") || error.message.includes("over_email_send_rate_limit")) {
      return { error: "Çok fazla deneme yapıldı. Lütfen biraz bekle." };
    }
    return { error: "Kayıt başarısız. Lütfen tekrar dene." };
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

export async function forgotPassword(email: string) {
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: "E-posta gönderilemedi. Lütfen tekrar dene." };
  return {};
}

export async function resetPassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: "Şifre güncellenemedi. Lütfen tekrar dene." };
  await supabase.auth.signOut();
  return { success: true };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Oturum bulunamadı." };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Mevcut şifre hatalı." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: `Şifre güncellenemedi: ${error.message}` };
  return {};
}
