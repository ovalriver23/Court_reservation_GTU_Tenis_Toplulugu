import HamburgerMenu from "@/components/HamburgerMenu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4">
        <HamburgerMenu />
        <h1 className="text-text-primary font-semibold text-base">Kort Rezervasyon</h1>
        {/* Sağ taraf boş — simetri için */}
        <div className="w-10" />
      </header>

      {/* İçerik */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
