import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single<{ name: string; email: string }>();

  return (
    <div className="px-4 pt-2 pb-8">
      <h2 className="text-text-primary font-semibold text-lg mb-6">Profil</h2>

      <div className="bg-surface border border-border rounded-2xl px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-background font-bold text-lg">
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div>
            <p className="text-text-primary font-semibold">{profile?.name ?? "—"}</p>
            <p className="text-text-secondary text-sm">{profile?.email ?? user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
