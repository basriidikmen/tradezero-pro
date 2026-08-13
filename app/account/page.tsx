"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("api");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#040609] text-zinc-100 relative overflow-hidden flex justify-center items-center p-4 md:p-10">
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl h-[85vh] flex flex-col md:flex-row bg-[#0d1117]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col gap-2 bg-black/40">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-sm"></span>
              TradeZero Pro
            </h1>
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold mt-2 block">
              Kullanıcı Paneli
            </span>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <button 
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "api" ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"}`}
            >
              <span>⚡</span> API Ayarları
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "profile" ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"}`}
            >
              <span>👤</span> Profil Bilgileri
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "security" ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 shadow-sm" : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"}`}
            >
              <span>🔒</span> Güvenlik
            </button>
          </div>
          
          <div className="mt-auto pt-6">
            <button 
              onClick={() => router.push("/login")} 
              className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium"
            >
              Güvenli Çıkış
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          
          {activeTab === "api" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white">TradeZero API Bağlantısı</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                  Platform üzerinden işlem yapabilmek için TradeZero hesabınıza ait API Key ve Secret bilgilerini aşağıya girin.
                </p>
              </div>

              <form className="space-y-6 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">API Key</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 font-mono text-sm" 
                    placeholder="TRZ-XXXXXXXXXXXXXXXXX" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">API Secret</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 font-mono text-sm" 
                    placeholder="••••••••••••••••••••••••••••••" 
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
                  <button 
                    type="button" 
                    className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-black bg-emerald-500 hover:bg-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all duration-300 shadow-lg shadow-emerald-900/20"
                  >
                    Bağlantıyı Kaydet
                  </button>
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                    Uçtan uca şifreli
                  </span>
                </div>
              </form>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white">Profil Bilgileri</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                  Kişisel hesap bilgilerinizi buradan görüntüleyebilir ve güncelleyebilirsiniz.
                </p>
              </div>

              <form className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Adınız</label>
                    <input 
                      type="text" 
                      defaultValue="Basri"
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Soyadınız</label>
                    <input 
                      type="text" 
                      defaultValue="Dikmen"
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">E-Posta Adresi</label>
                  <input 
                    type="email" 
                    defaultValue="ornek@email.com"
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-zinc-500 cursor-not-allowed" 
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="button" 
                    className="px-8 py-3 rounded-xl font-bold text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all duration-300"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white">Güvenlik Ayarları</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                  Hesabınızın güvenliğini artırmak için şifrenizi güncelleyebilir ve oturum geçmişinizi kontrol edebilirsiniz.
                </p>
              </div>

              <div className="space-y-8 max-w-2xl">
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Şifre Değiştir</h3>
                  <form className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Mevcut Şifre</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Yeni Şifre</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Yeni Şifre (Tekrar)</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300" 
                      />
                    </div>
                    <button 
                      type="button" 
                      className="mt-4 px-6 py-2.5 rounded-lg font-bold text-black bg-emerald-500 hover:bg-emerald-400 transition-all duration-300"
                    >
                      Şifreyi Güncelle
                    </button>
                  </form>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Oturum Geçmişi</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400 whitespace-nowrap">
                      <thead className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/10">
                        <tr>
                          <th className="pb-3 font-semibold pr-4">Tarih & Saat</th>
                          <th className="pb-3 font-semibold pr-4">Cihaz / Tarayıcı</th>
                          <th className="pb-3 font-semibold pr-4">IP Adresi</th>
                          <th className="pb-3 font-semibold">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="py-4 pr-4 text-zinc-300">12 Ağu 2026, 17:30</td>
                          <td className="py-4 pr-4">Mac OS • Chrome</td>
                          <td className="py-4 pr-4 font-mono text-xs">192.168.1.42</td>
                          <td className="py-4">
                            <span className="text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-400/20">
                              Başarılı
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 pr-4 text-zinc-300">10 Ağu 2026, 14:15</td>
                          <td className="py-4 pr-4">Windows • Edge</td>
                          <td className="py-4 pr-4 font-mono text-xs">85.102.14.88</td>
                          <td className="py-4">
                            <span className="text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-400/20">
                              Başarılı
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
