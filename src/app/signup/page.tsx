"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import { registerUser } from "@/app/actions";
import { Section } from "@/components/common/Section";
import AuthLogo from "@/components/auth/AuthLogo";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = useCallback(
    (email: string, password: string, confirmPassword: string): boolean => {
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

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
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
      const confirmPassword = formData.get("confirmPassword") as string;

      if (!validateForm(email, password, confirmPassword)) {
        setIsLoading(false);
        return;
      }

      const result = await registerUser(email, password);
      
      if (!result.success) {
        if (result.error?.code === "email_exists") {
          setErrors({
            email: result.error.message
          });
          return;
        }
        
        setErrors({
          general: result.error?.message || "Registration failed. Please try again."
        });
        return;
      }
      
      toast({
        title: "✨ Account created successfully",
        description: "You can now log in with your credentials",
        duration: 5000,
      });
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/login?registered=true");
    } catch (error) {
      setErrors({
        general: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const FormError = ({ message }: { message?: string }) =>
    message ? <p className="text-sm text-destructive mt-1">{message}</p> : null;

  return (
    <div className="relative min-h-screen transition-all duration-500">
      <main className="container mx-auto h-screen px-3 py-4 sm:px-4 sm:py-12 max-w-6xl relative flex items-center flex-col justify-center">
        <AuthLogo />
        <Section title="" className="w-[450px]">
          <div className="w-full mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
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
                    autoComplete="new-password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <FormError message={errors.password} />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <FormError message={errors.confirmPassword} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[rgb(210,50,170)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[rgb(180,40,150)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(210,50,170)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus
                    size={18}
                    className="transition-transform"
                    strokeWidth={1.5}
                  />
                )}
                <span>
                  {isLoading ? "Creating account..." : "Create account"}
                </span>
              </button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[rgb(210,50,170)] hover:text-[rgb(180,40,150)] hover:underline font-medium"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </Section>
      </main>
    </div>
  );
}