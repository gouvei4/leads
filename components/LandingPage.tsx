"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { BrandMarkIcon, ChartIcon, CheckIcon, HeadsetIcon, LockIcon, SearchIcon, ShieldCheckIcon, TargetIcon, UsersIcon, ZapIcon } from "@/components/icons";

const productBenefits = [
  { icon: SearchIcon, title: "Encontre empresas", text: "Descubra novos leads com filtros inteligentes." },
  { icon: UsersIcon, title: "Organize seus contatos", text: "Tenha tudo em um só lugar e não perca nenhuma oportunidade." },
  { icon: ChartIcon, title: "Acompanhe seu funil", text: "Do primeiro contato até o fechamento." },
];
const planBenefits = ["Pesquisa e organização de empresas", "Controle de contatos e negociações", "Seus dados em um espaço exclusivo"];
const contactHref = "https://wa.me/5511947909982?text=Ol%C3%A1%21%20Quero%20assinar%20o%20Prospector.";

function ProductBenefits() {
  return (
    <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
      {productBenefits.map(({ icon: Icon, title, text }) => (
        <div key={title} className="group rounded-2xl border border-white/10 bg-white/[.035] p-4 transition duration-300 hover:-translate-y-1 hover:border-orange-400/40 hover:bg-orange-400/[.07] hover:shadow-[0_12px_35px_rgba(255,107,0,.12)]">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-400/10 text-orange-300"><Icon className="h-4 w-4" /></div>
          <h3 className="text-sm font-bold text-white/90">{title}</h3>
          <p className="mt-2 text-xs leading-5 text-white/45">{text}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardDecoration() {
  return (
    <div className="pointer-events-none absolute -right-16 -top-20 hidden h-64 w-80 -rotate-6 rounded-2xl border border-orange-300/15 bg-[#14151b]/80 p-4 opacity-45 shadow-[0_0_80px_rgba(255,107,0,.15)] blur-[1px] lg:block">
      <div className="flex gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-400/80" /><i className="h-2 w-2 rounded-full bg-white/20" /><i className="h-2 w-2 rounded-full bg-white/20" /></div>
      <div className="mt-5 grid grid-cols-3 gap-2"><div className="h-12 rounded-lg bg-white/5" /><div className="h-12 rounded-lg bg-orange-400/10" /><div className="h-12 rounded-lg bg-white/5" /></div>
      <div className="mt-4 flex h-28 items-end gap-2 rounded-lg bg-white/[.03] p-3"><span className="h-1/3 w-1/6 rounded-t bg-orange-400/45" /><span className="h-1/2 w-1/6 rounded-t bg-orange-400/60" /><span className="h-2/3 w-1/6 rounded-t bg-orange-400/75" /><span className="h-3/4 w-1/6 rounded-t bg-orange-300/80" /><span className="h-full w-1/6 rounded-t bg-orange-200/90" /></div>
    </div>
  );
}

function PlanCard() {
  return (
    <aside data-animate="price" className="relative mx-auto w-full max-w-md">
      <DashboardDecoration />
      <div data-visual className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-orange-400/25 via-orange-500/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-orange-200/20 bg-[#101117]/90 p-7 shadow-[0_28px_80px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/80 to-transparent" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-orange-300">Plano mensal</p>
            <h2 className="mt-2 text-xl font-bold text-white">Prospector Completo</h2>
          </div>
          <div className="shrink-0 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-200">Acesso completo</div>
        </div>
        <div className="mt-7 flex items-end border-b border-white/10 pb-6">
          <span className="pb-2 text-lg font-bold text-orange-300">R$</span>
          <span className="ml-2 text-7xl font-extrabold leading-none tracking-[-.07em] text-white">30</span>
          <span className="mb-2 ml-3 text-sm text-white/45">por mês</span>
        </div>
        <p className="mt-5 text-sm leading-6 text-white/55">Tudo que você precisa para prospectar e organizar suas oportunidades durante 30 dias.</p>
        <ul className="mt-6 space-y-4 text-sm text-white/80">{planBenefits.map((item) => <li key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-300/10"><CheckIcon className="h-4 w-4 text-orange-300" /></span><span>{item}</span></li>)}</ul>
        <a href={contactHref} target="_blank" rel="noreferrer" className="mt-8 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ffa62b] px-5 py-4 text-sm font-bold text-white shadow-[0_12px_32px_rgba(249,115,22,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(249,115,22,.38)]">Quero assinar — falar com vocês →</a>
        <p className="mt-4 text-center text-[11px] leading-5 text-white/35">Atendimento personalizado para liberar seu acesso.</p>
      </div>
    </aside>
  );
}

export default function LandingPage() {
  const page = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-animate=header]", { opacity: 0, y: -18, duration: .7, ease: "power3.out" });
      gsap.from("[data-animate=hero] > *", { opacity: 0, y: 28, duration: .8, stagger: .1, delay: .15, ease: "power3.out" });
      gsap.from("[data-animate=price]", { opacity: 0, x: 32, duration: .9, delay: .35, ease: "back.out(1.4)" });
      gsap.to("[data-visual]", { rotate: 2, scale: 1.03, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, page);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={page} className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-[#090a0f] bg-cover bg-center bg-no-repeat px-5 py-6 text-white sm:px-8 sm:py-8" style={{ backgroundImage: "linear-gradient(110deg, rgba(9,10,15,.45), rgba(9,10,15,.18) 52%, rgba(9,10,15,.4)), url('/background.png')" }}>
      <div className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header data-animate="header" className="flex items-center justify-between border-b border-white/10 pb-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-300 to-orange-600 text-white shadow-[0_0_30px_rgba(249,115,22,.35)]"><BrandMarkIcon className="h-5 w-5" /></div><span className="font-bold tracking-tight">Prospector <span className="text-orange-300">— Leads</span></span></div><Link href="/login" className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-orange-300/50 hover:text-white"><LockIcon className="h-3.5 w-3.5" />Já tenho acesso</Link></header>
        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.08fr_.92fr] lg:gap-20 lg:py-20"><div data-animate="hero"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-300/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em] text-orange-200"><TargetIcon className="h-3.5 w-3.5" /> Prospecção inteligente</div><h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-.04em] sm:text-6xl">Mais leads. <span className="bg-gradient-to-r from-orange-200 via-orange-400 to-amber-300 bg-clip-text text-transparent">Mais negócios.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">Encontre empresas, organize seus contatos e acompanhe cada oportunidade em um único espaço feito para vender melhor.</p><ProductBenefits /><div className="mt-9 flex flex-wrap items-center gap-4"><a href={contactHref} target="_blank" rel="noreferrer" className="rounded-xl bg-gradient-to-r from-[#ff6b00] to-[#ffa62b] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(249,115,22,.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(249,115,22,.4)]">Quero assinar — falar com vocês →</a><Link href="/login" className="text-sm font-semibold text-white/55 transition hover:text-white">Já tenho um token →</Link></div><p className="mt-6 pl-1 text-xs text-white/35">Pagamento combinado diretamente com nossa equipe.</p></div><PlanCard /></section>
        <section className="grid border-t border-white/10 py-7 sm:grid-cols-3 sm:divide-x sm:divide-white/10"><div className="flex items-center gap-3 px-0 py-3 sm:px-6 sm:py-0"><ShieldCheckIcon className="h-5 w-5 shrink-0 text-orange-300" /><div><h3 className="text-sm font-bold">Seguro e confiável</h3><p className="mt-1 text-xs text-white/40">Seus dados sempre protegidos.</p></div></div><div className="flex items-center gap-3 px-0 py-3 sm:px-6 sm:py-0"><ZapIcon className="h-5 w-5 shrink-0 text-orange-300" /><div><h3 className="text-sm font-bold">Simples e rápido</h3><p className="mt-1 text-xs text-white/40">Comece em poucos minutos.</p></div></div><div className="flex items-center gap-3 px-0 py-3 sm:px-6 sm:py-0"><HeadsetIcon className="h-5 w-5 shrink-0 text-orange-300" /><div><h3 className="text-sm font-bold">Suporte dedicado</h3><p className="mt-1 text-xs text-white/40">Estamos aqui para ajudar.</p></div></div></section>
        <footer className="border-t border-white/10 py-5 text-center text-xs text-white/30">Prospector — Leads · sua rotina comercial, mais inteligente.</footer>
      </div>
    </main>
  );
}
