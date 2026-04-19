import CourtLines from "@/components/CourtLines";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <CourtLines />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
