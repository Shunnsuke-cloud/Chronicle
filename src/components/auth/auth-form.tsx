"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const authFormSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(80),
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(128),
});

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRegister = mode === "register";

  function handleSubmit(formData: FormData) {
    const parsed = authFormSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = isRegister
        ? await authClient.signUp.email({
            name: parsed.data.name,
            email: parsed.data.email,
            password: parsed.data.password,
          })
        : await authClient.signIn.email({
            email: parsed.data.email,
            password: parsed.data.password,
          });

      if (result.error) {
        setErrorMessage(result.error.message ?? "認証に失敗しました");
        return;
      }

      router.push("/projects");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="mt-8 grid gap-5">
      {isRegister ? (
        <label className="grid gap-2 text-sm font-medium text-neutral-800">
          Name
          <input
            name="name"
            autoComplete="name"
            className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none ring-emerald-700 transition focus:ring-2"
            required
          />
        </label>
      ) : (
        <input name="name" type="hidden" value="Chronicle User" />
      )}

      <label className="grid gap-2 text-sm font-medium text-neutral-800">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none ring-emerald-700 transition focus:ring-2"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-neutral-800">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none ring-emerald-700 transition focus:ring-2"
          required
          minLength={8}
        />
      </label>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Processing..." : isRegister ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
