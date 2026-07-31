import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentSession } from "@/server/auth/session";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) redirect("/projects");
  return <main className="min-h-screen bg-[#f5f7f7] px-6 py-12"><div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col justify-center"><BrandLogo className="scale-[0.72] origin-left" /><h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#182323]">アカウントを作成</h1><p className="mt-3 max-w-sm text-sm leading-7 text-[#526161]">意思決定の理由を、あとから迷わずたどれる形で残します。</p><AuthForm mode="register" /><p className="mt-6 text-sm text-[#526161]">すでにアカウントをお持ちですか？ <Link href="/login" className="font-medium text-[#176b67] underline underline-offset-4">ログイン</Link></p></div></main>;
}
