export default function ForgotPasswordPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
  
        <div className="relative z-10 w-full max-w-md p-8 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              TradeZero Pro
            </h1>
            <h2 className="text-sm text-zinc-400 mt-2 font-medium tracking-wide uppercase">Şifre Sıfırlama</h2>
          </div>
  
          <p className="text-sm text-zinc-400 text-center mb-6">
            Hesabınıza bağlı e-posta adresini girin. Size şifrenizi sıfırlamanız için güvenli bir bağlantı göndereceğiz.
          </p>
  
          <form className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">E-posta</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300" 
                placeholder="ornek@email.com" 
              />
            </div>
  
            <button 
              type="button" 
              className="w-full py-3 px-4 mt-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all duration-300 shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
            >
              Sıfırlama Bağlantısı Gönder
            </button>
          </form>
  
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <a href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
              &larr; Giriş Ekranına Dön
            </a>
          </div>
        </div>
      </div>
    );
  }
  