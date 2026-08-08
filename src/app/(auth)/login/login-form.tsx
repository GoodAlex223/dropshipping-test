"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { auth } from "@/content/auth";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(auth.login.errors.invalidCredentials);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("[Login Error]", error);
      setError(auth.login.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{auth.login.title}</CardTitle>
        <CardDescription>{auth.login.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{auth.login.email.label}</Label>
            <Input
              id="email"
              type="email"
              placeholder={auth.login.email.placeholder}
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{auth.login.password.label}</Label>
            <Input
              id="password"
              type="password"
              placeholder={auth.login.password.placeholder}
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? auth.login.submitting : auth.login.submit}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {auth.login.noAccount}{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            {auth.login.signUpLink}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{auth.login.title}</CardTitle>
        <CardDescription>{auth.login.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="bg-muted h-4 w-12 rounded" />
            <div className="bg-muted h-10 rounded" />
          </div>
          <div className="space-y-2">
            <div className="bg-muted h-4 w-16 rounded" />
            <div className="bg-muted h-10 rounded" />
          </div>
          <div className="bg-muted h-10 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginForm() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginFormInner />
      </Suspense>
    </div>
  );
}
