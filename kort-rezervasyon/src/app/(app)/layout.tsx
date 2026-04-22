import HamburgerMenu from "@/components/HamburgerMenu";
import DynamicBackground from "@/components/DynamicBackground";
import { getProfile } from "@/lib/cache";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  return (
    <div className="grain flex flex-col min-h-screen bg-background relative">
      <DynamicBackground />

      <header className="flex items-center justify-between px-4 pt-12 pb-4 relative z-20 bg-gradient-to-b from-black/20 to-transparent">
        <HamburgerMenu isAdmin={profile?.is_admin ?? false} />
        <h1 className="text-text-primary font-semibold text-base">Kort Rezervasyon</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
