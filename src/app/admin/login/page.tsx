import LoginForm from "@/components/site/LoginForm";

export const metadata = {
  title: "Staff Login | Caffeine",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.redirectTo) ? params.redirectTo[0] : params.redirectTo;

  return (
    <div className="min-h-screen bg-caffeine-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-stone-200 p-8 sm:p-10 max-w-md w-full shadow-xl">
        <h1 className="font-cozy text-2xl font-bold text-caffeine-dark mb-1">Staff Login</h1>
        <p className="text-sm text-stone-500 mb-6">Sign in to manage the Caffeine website.</p>
        <LoginForm redirectTo={raw ?? ""} />
      </div>
    </div>
  );
}
