"use client";

import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#040609] text-zinc-100 relative overflow-hidden flex items-center justify-center">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 bg-[#0d1117]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-emerald-500 rounded-sm"></span>
            TradeZero Pro
          </h1>
          <h2 className="text-[11px] text-zinc-500 mt-3 font-bold tracking-widest uppercase">
            Yeni Hesap Oluştur
          </h2>
        </div>

        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Ad</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                placeholder="Adınız" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Soyad</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                placeholder="Soyadınız" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">E-Posta</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
              placeholder="ornek@email.com" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Şifre</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="button" 
            onClick={() => router.push("/login")}
            className="w-full py-3 px-4 mt-6 rounded-xl font-bold text-black bg-emerald-500 hover:bg-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all duration-300 shadow-lg shadow-emerald-900/20"
          >
            Kayıt Ol
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-sm text-zinc-500">
            Zaten hesabın var mı?{" "}
            <a href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200">
              Giriş Yap
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
