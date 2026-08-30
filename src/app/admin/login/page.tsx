import LoginForm from "@/components/site/LoginForm";

export const metadata = {
  title: "Staff Login | Caffeine",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-caffeine-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl">
        <h1 className="font-cozy text-2xl font-bold text-caffeine-dark mb-1">Staff Login</h1>
        <p className="text-sm text-stone-500 mb-6">Sign in to manage the Caffeine website.</p>
        <LoginForm />
      </div>
    </div>
  );
}
