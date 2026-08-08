"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { auth } from "@/content/auth";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          (result.code && auth.register.errors.byCode[result.code]) || auth.register.errors.generic
        );
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed
        router.push("/login?registered=true");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("[Register Error]", error);
      setError(auth.register.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{auth.register.title}</CardTitle>
          <CardDescription>{auth.register.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{auth.register.name.label}</Label>
              <Input
                id="name"
                type="text"
                placeholder={auth.register.name.placeholder}
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{auth.register.email.label}</Label>
              <Input
                id="email"
                type="email"
                placeholder={auth.register.email.placeholder}
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{auth.register.password.label}</Label>
              <Input
                id="password"
                type="password"
                placeholder={auth.register.password.placeholder}
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{auth.register.confirmPassword.label}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={auth.register.confirmPassword.placeholder}
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? auth.register.submitting : auth.register.submit}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {auth.register.hasAccount}{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              {auth.register.signInLink}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
