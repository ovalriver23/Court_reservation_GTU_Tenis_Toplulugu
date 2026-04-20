import HamburgerMenu from "@/components/HamburgerMenu";
import { getProfile } from "@/lib/cache";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  return (
    <div className="grain flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 pt-12 pb-4">
        <HamburgerMenu isAdmin={profile?.is_admin ?? false} />
        <h1 className="text-text-primary font-semibold text-base">Kort Rezervasyon</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
