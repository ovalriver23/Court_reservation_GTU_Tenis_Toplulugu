import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/cache";
import PasswordChangeForm from "./PasswordChangeForm";

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user) redirect("/login");

  return (
    <div className="px-4 pt-2 pb-8 space-y-4 max-w-4xl mx-auto w-full">
      <h2 className="text-text-primary font-semibold text-lg mb-2">Profil</h2>

      {/* Kullanıcı bilgileri */}
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

      {/* Şifre değiştir */}
      <PasswordChangeForm />
    </div>
  );
}
