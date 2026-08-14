"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#040609] text-zinc-100 relative overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* Arka Plan Parlamaları */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] bg-emerald-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[#040609]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_-4px_rgba(16,185,129,0.8)]">
              <span className="font-mono text-[16px] font-black text-[#04140d]">TZ</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white hidden sm:block">
              TradeZero <span className="text-emerald-400">Pro</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Özellikler</a>
            <a href="#platform" className="hover:text-emerald-400 transition-colors">Platform</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/login")}
              className="text-sm font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Giriş Yap
            </button>
            <button 
              onClick={() => router.push("/register")}
              className="px-5 py-2.5 rounded-lg text-sm font-extrabold bg-emerald-500 hover:bg-emerald-400 text-[#04140d] transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] active:translate-y-px"
            >
              Hesap Aç
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mt-12 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-bold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Yeni Nesil Web Terminali Yayında
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight mb-8">
            Piyasalara Hükmet.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
              Kurumsal Güç Artık Seninle.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl font-medium leading-relaxed">
            Işık hızında emir iletimi, kişiselleştirilebilir kısayol tuşları (hotkeys) ve profesyonel grafiklerle sıfır gecikmeli işlem deneyimi. Kendi stratejini test et ve piyasaya yön ver.
          </p>
        </div>

        {/* Feature Dashboard Mockup */}
        <div id="platform" className="relative rounded-2xl border border-white/10 bg-[#0d1117]/80 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,1)] p-2 mx-auto max-w-5xl mt-8 overflow-hidden transform perspective-1000 rotate-x-2 rotate-y-0 scale-100 hover:scale-[1.01] transition-transform duration-700">
          <div className="absolute inset-0 bg-gradient-to-t from-[#040609] via-transparent to-transparent z-20"></div>
          <div className="w-full h-8 bg-black/40 rounded-t-xl border-b border-white/5 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop" 
            alt="Platform Interface" 
            className="w-full h-auto object-cover opacity-30 rounded-b-xl grayscale contrast-125"
          />
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className="px-6 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-md text-emerald-300 font-mono text-sm font-bold shadow-2xl flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Sistem Aktif - NQNX Veri Akışı
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
          
          <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.05] hover:border-emerald-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">Işık Hızında Emirler</h3>
            <p className="text-zinc-400 font-medium leading-relaxed">
              Gecikmelere son. Özelleştirilebilir "Hotkey" sistemiyle rakiplerinizden önce piyasaya girin ve çıkın.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.05] hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-2xl mb-6 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-xl font-bold text-white mb-3">Profesyonel Grafikler</h3>
            <p className="text-zinc-400 font-medium leading-relaxed">
              Dahili mum grafikleri ve anlık L1 veri akışı ile üçüncü parti araçlara ihtiyaç duymadan analizinizi yapın.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.05] hover:border-rose-500/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 text-2xl mb-6 group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-3">Paper Trading</h3>
            <p className="text-zinc-400 font-medium leading-relaxed">
              1.000.000$ sanal bakiye ile stratejilerinizi sıfır riskle test edin, gerçek piyasa şartlarında antrenman yapın.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[#020305] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">TradeZero <span className="text-emerald-500">Pro</span></span>
          </div>
          <p className="text-xs text-zinc-600 font-medium">
            © 2026 TradeZero Pro Institutional. Tüm hakları saklıdır. Eğitim amaçlı simülasyon terminalidir.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Gizlilik Politikası</a>
            <a href="#" className="hover:text-white transition-colors">Kullanım Şartları</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
