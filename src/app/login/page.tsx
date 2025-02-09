"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback, Suspense } from "react";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import { Section } from "@/components/common/Section";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import AuthLogo from "@/components/auth/AuthLogo";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20 animate-in fade-in-50 duration-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle
            className="h-5 w-5 text-destructive"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      </div>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  const validateForm = useCallback(
    (email: string, password: string): boolean => {
      const newErrors: FormErrors = {};

      if (!email) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(email)) {
        newErrors.email = "Invalid email format";
      }

      if (!password) {
        newErrors.password = "Password is required";
      } else if (!validatePassword(password)) {
        newErrors.password = "Password must be at least 6 characters";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!validateForm(email, password)) {
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        setErrors({
          general: result?.error || "Authentication failed",
        });
        return;
      }

      setIsRedirecting(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general: "An unexpected error occurred. Please try again.",
      });
    } finally {
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  const FormError = ({ message }: { message?: string }) =>
    message ? (
      <p className="text-sm text-destructive mt-1 animate-in fade-in-50 duration-200">
        {message}
      </p>
    ) : null;

  return (
    <div
      className={`relative min-h-screen transition-all duration-500 ${
        isRedirecting ? "opacity-50 blur-sm" : ""
      }`}
    >
      <main className="container mx-auto h-screen px-3 py-4 sm:px-4 sm:py-12 max-w-6xl relative flex flex-col items-center justify-center">
        <AuthLogo />

        <Section title="" className="w-[450px]">
          <div className="w-full mx-auto relative">
            {isRedirecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            <form
              method="POST"
              onSubmit={handleSubmit}
              className="space-y-6 mt-6"
            >
              {errors.general && <ErrorAlert message={errors.general} />}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    disabled={isLoading || isRedirecting}
                  />
                  <FormError message={errors.email} />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    disabled={isLoading || isRedirecting}
                  />
                  <FormError message={errors.password} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isRedirecting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[rgb(210,50,170)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[rgb(180,40,150)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(210,50,170)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn
                    size={18}
                    className="transition-transform"
                    strokeWidth={1.5}
                  />
                )}
                <span>
                  {isRedirecting
                    ? "Redirecting..."
                    : isLoading
                    ? "Logging in..."
                    : "Log in"}
                </span>
              </button>

              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[rgb(210,50,170)] hover:text-[rgb(180,40,150)] hover:underline font-medium"
                  tabIndex={isLoading || isRedirecting ? -1 : 0}
                >
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </Section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}