import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentSession } from "@/server/auth/session";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/projects");
  return <main className="min-h-screen bg-[#f5f7f7] px-6 py-12"><div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col justify-center"><Link href="/" className="text-sm font-semibold text-[#176b67]">Chronicle</Link><h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#182323]">ログイン</h1><p className="mt-3 max-w-sm text-sm leading-7 text-[#526161]">記録した判断と、その背景に戻りましょう。</p><AuthForm mode="login" /><p className="mt-6 text-sm text-[#526161]">アカウントをお持ちでないですか？ <Link href="/register" className="font-medium text-[#176b67] underline underline-offset-4">新規登録</Link></p></div></main>;
}
