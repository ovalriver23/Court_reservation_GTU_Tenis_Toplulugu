import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Auth callback — session kurulumu için dokunma
  if (pathname === "/auth/callback") {
    return supabaseResponse;
  }

  // Sadece login/kayıt akışı sayfaları (recovery ve MFA hariç)
  const isLoginFlowPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/forgot-password");

  // Şifre sıfırlama: recovery session ile gelinir, kimlik doğrulama gerekmez
  const isPasswordResetPage = pathname.startsWith("/reset-password");

  // MFA doğrulama: giriş yapmış (aal1) kullanıcılara açık
  const isMfaPage = pathname.startsWith("/mfa-challenge");

  // Giriş yapılmamış → login sayfalarına ve reset-password'e izin ver, geri kalanını engelle
  if (!user) {
    if (!isLoginFlowPage && !isPasswordResetPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Giriş yapılmış → login/kayıt sayfalarına erişimi engelle
  if (isLoginFlowPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Şifre sıfırlama sayfası — recovery session olan giriş yapmış kullanıcıya izin ver
  if (isPasswordResetPage) {
    return supabaseResponse;
  }

  // MFA sayfası — giriş yapmış ama aal2 tamamlamamış kullanıcıya izin ver
  if (isMfaPage) {
    return supabaseResponse;
  }

  // Onay ve admin kontrolü
  const { data: profile } = await supabase
    .from("profiles")
    .select("approved, is_admin")
    .eq("id", user.id)
    .single<{ approved: boolean; is_admin: boolean }>();

  if (profile && !profile.approved && !profile.is_admin && pathname !== "/pending") {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  if (pathname.startsWith("/admin") && !profile?.is_admin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
