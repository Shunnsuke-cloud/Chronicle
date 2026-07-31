import Link from "next/link";
import { ArrowRight, GitBranch, History, Network } from "lucide-react";
import { getCurrentSession } from "@/server/auth/session";

export default async function HomePage() {
  const session = await getCurrentSession();

  return (
    <main className="min-h-screen bg-[#f5f7f7] text-[#182323]">
      <header className="border-b border-[#dbe3e2] bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight"><span className="grid size-7 place-items-center bg-[#176b67] text-white"><History size={15} /></span>Chronicle</Link>
          <Link href={session ? "/projects" : "/login"} className="text-sm font-medium text-[#176b67]">{session ? "プロジェクトへ" : "ログイン"}</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-24">
        <section>
          <p className="text-sm font-semibold text-[#176b67]">Decision intelligence</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-[#182323] sm:text-5xl">判断の背景を、開発の資産として残す。</h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-[#526161]">Chronicleは、選択肢と判断理由、その後の変化をひとつの履歴として記録します。コードの変更だけでは見えない「なぜ」を、いつでもたどれます。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={session ? "/projects" : "/register"} className="inline-flex items-center gap-2 bg-[#176b67] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#125955]">{session ? "プロジェクトを開く" : "アカウントを作成"}<ArrowRight size={16} /></Link>
            {!session ? <Link href="/login" className="border border-[#cdd8d7] bg-white px-4 py-2.5 text-sm font-medium text-[#304140] hover:bg-[#f4f8f7]">ログイン</Link> : null}
          </div>
        </section>
        <section className="border border-[#d8e2e0] bg-white shadow-[0_18px_45px_rgba(26,55,52,0.08)]">
          <div className="flex items-center justify-between border-b border-[#e4ebea] px-5 py-4"><div><p className="text-sm font-medium">決定の履歴</p><p className="mt-1 text-xs text-[#6c7b79]">認証方式の選定</p></div><span className="border border-[#b8d4d0] bg-[#eef8f6] px-2 py-1 text-xs font-medium text-[#176b67]">v8</span></div>
          <div className="grid md:grid-cols-[1fr_0.9fr]"><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[#6c7b79]">Timeline</p><ol className="mt-4 space-y-4 border-l border-[#d8e2e0] pl-4"><li><p className="text-sm font-medium">AlternativeSelected</p><p className="mt-1 text-xs leading-5 text-[#6c7b79]">Passkeysを採用。復旧経路を含めて検証。</p></li><li><p className="text-sm font-medium">ReasonChanged</p><p className="mt-1 text-xs leading-5 text-[#6c7b79]">モバイルでの摩擦を最小化するため。</p></li><li><p className="text-sm font-medium">DecisionCreated</p><p className="mt-1 text-xs text-[#6c7b79]">認証方式を決定する。</p></li></ol></div><div className="border-t border-[#e4ebea] bg-[#f8fbfa] p-5 md:border-l md:border-t-0"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6c7b79]"><Network size={14} /> Decision graph</p><div className="relative mt-8 h-36"><span className="absolute left-1 top-10 border border-[#b8d4d0] bg-white px-3 py-2 text-xs">ログイン体験</span><span className="absolute right-1 top-0 border border-[#176b67] bg-[#eef8f6] px-3 py-2 text-xs font-medium">認証方式</span><span className="absolute right-1 bottom-0 border border-[#b8d4d0] bg-white px-3 py-2 text-xs">復旧設計</span><GitBranch className="absolute left-[43%] top-10 text-[#176b67]" size={46} /></div></div></div>
        </section>
      </div>
    </main>
  );
}
