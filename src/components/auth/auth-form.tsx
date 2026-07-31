"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const authFormSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください。").max(80),
  email: z.string().trim().email("有効なメールアドレスを入力してください。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。").max(128),
});

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
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
      setErrorMessage(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = isRegister
        ? await authClient.signUp.email(parsed.data)
        : await authClient.signIn.email({ email: parsed.data.email, password: parsed.data.password });

      if (result.error) {
        setErrorMessage(result.error.message ?? "認証を完了できませんでした。");
        return;
      }

      router.push("/projects");
      router.refresh();
    });
  }

  const inputClassName = "mt-1.5 h-11 w-full border border-[#cdd8d7] bg-white px-3 text-base outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#cde5e1]";

  return (
    <form action={handleSubmit} className="mt-7 grid gap-5">
      {isRegister ? <label className="text-sm font-medium text-[#304140]">名前<input name="name" autoComplete="name" className={inputClassName} required /></label> : <input name="name" type="hidden" value="Chronicle User" />}
      <label className="text-sm font-medium text-[#304140]">メールアドレス<input name="email" type="email" autoComplete="email" className={inputClassName} required /></label>
      <label className="text-sm font-medium text-[#304140]">パスワード<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} className={inputClassName} required minLength={8} /></label>
      {errorMessage ? <p className="border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{errorMessage}</p> : null}
      <button type="submit" disabled={isPending} className="inline-flex h-11 items-center justify-center bg-[#176b67] px-4 text-sm font-medium !text-white transition hover:bg-[#125955] disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "処理中..." : isRegister ? "アカウントを作成" : "ログイン"}</button>
    </form>
  );
}
