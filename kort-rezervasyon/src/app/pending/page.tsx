export default function PendingPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-border mb-6">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-text-primary text-xl font-semibold mb-2">Onay Bekleniyor</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Hesabın oluşturuldu. Kort rezervasyonu yapabilmek için admin onayı gerekiyor.
          Onaylandıktan sonra giriş yapabilirsin.
        </p>
        <form action="/api/auth/signout" method="post" className="mt-8">
          <a
            href="/login"
            className="text-text-secondary text-sm underline underline-offset-2"
          >
            Giriş sayfasına dön
          </a>
        </form>
      </div>
    </main>
  );
}
