import Link from "next/link";
import { ArrowRight, History, Network } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentSession } from "@/server/auth/session";

export default async function HomePage() {
  const session = await getCurrentSession();

  return (
    <main className="min-h-screen bg-[#f5f7f7] text-[#182323]">
      <header className="border-b border-[#dbe3e2] bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"><BrandLogo className="scale-[0.72] origin-left" /><Link href={session ? "/projects" : "/login"} className="text-sm font-medium text-[#176b67]">{session ? "プロジェクトへ" : "ログイン"}</Link></div>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section><p className="text-sm font-semibold text-[#176b67]">Decision intelligence</p><h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[#182323] sm:text-5xl">判断の背景を、開発の資産として残す。</h1><p className="mt-5 max-w-xl text-base leading-8 text-[#526161]">Chronicleは、選択肢と判断理由、その後の変化をひとつの履歴として記録します。実際のプロジェクト画面で、履歴と関係グラフをたどりながら判断を更新できます。</p><div className="mt-8 flex flex-wrap gap-3"><Link href={session ? "/projects" : "/register"} className="inline-flex items-center gap-2 bg-[#176b67] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#125955]">{session ? "プロジェクトを開く" : "アカウントを作成"}<ArrowRight size={16} /></Link>{!session ? <Link href="/login" className="border border-[#cdd8d7] bg-white px-4 py-2.5 text-sm font-medium text-[#304140] hover:bg-[#f4f8f7]">ログイン</Link> : null}</div></section>
        <aside className="border-l border-[#d8e2e0] pl-6 lg:pl-10"><p className="text-sm font-medium text-[#304140]">Chronicleで残すもの</p><div className="mt-7 space-y-6"><div className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center border border-[#b8d4d0] bg-[#eef8f6] text-[#176b67]"><History size={17} /></span><div><h2 className="font-medium">変更されない履歴</h2><p className="mt-1 max-w-sm text-sm leading-6 text-[#637270]">タイトル、選択肢、理由、状態のすべてをイベントとして追記保存します。</p></div></div><div className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center border border-[#b8d4d0] bg-[#eef8f6] text-[#176b67]"><Network size={17} /></span><div><h2 className="font-medium">判断の関係</h2><p className="mt-1 max-w-sm text-sm leading-6 text-[#637270]">依存、競合、置換といった決定同士の関係をグラフで把握できます。</p></div></div></div></aside>
      </div>
    </main>
  );
}
