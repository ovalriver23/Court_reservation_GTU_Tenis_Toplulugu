"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "E-posta veya şifre hatalı." };
    }
    return { error: error.message };
  }

  // approved kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved")
      .eq("id", user.id)
      .single<{ approved: boolean }>();

    if (profile && !profile.approved) {
      redirect("/pending");
    }
  }

  redirect("/");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Bu e-posta zaten kayıtlı." };
    }
    return { error: "Kayıt olurken bir hata oluştu." };
  }

  // Create the profile row using service role to bypass RLS
  if (data.user) {
    const admin = createAdminClient();
    await admin.from("profiles").upsert({
      id: data.user.id,
      name,
      email,
      approved: false,
    }, { onConflict: "id" });
  }

  redirect("/pending");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
