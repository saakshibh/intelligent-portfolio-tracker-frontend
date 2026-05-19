'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, BrainCircuit, Activity, Search, Loader2, X, Zap, ShieldCheck, ExternalLink, LogOut, Lock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- CHART COMPONENT (Handles Mini and Large views) ---
function StockChart({ data, isLarge = false }: { data: any[], isLarge?: boolean }) {
  if (!data || data.length === 0) return <div className="text-[10px] text-slate-600 italic">No historical data</div>;

  return (
    <div className={isLarge ? "h-[300px] w-full mt-4" : "h-[45px] w-[140px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {isLarge && <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />}
          <XAxis dataKey="day" hide={!isLarge} stroke="#444" fontSize={10} />
          <YAxis hide={!isLarge} domain={['auto', 'auto']} stroke="#444" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: isLarge ? '12px' : '8px', color: '#fff' }}
            labelStyle={{ display: isLarge ? 'block' : 'none' }}
          />
          <Line type="monotone" dataKey="actual" stroke="#334155" strokeWidth={isLarge ? 2 : 1.5} dot={isLarge} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={isLarge ? 3 : 2} dot={isLarge} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  // --- AUTH STATES ---
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- DASHBOARD STATES ---
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);

  // --- CHECK AUTH SESSION & FETCH ---
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStocks();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStocks();
      } else {
        setStocks([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchStocks() {
    setLoading(true);
    const { data } = await supabase.from('market_sentiment').select('*').order('created_at', { ascending: false });
    if (data) {
      const uniqueData = data.filter((v, i, a) => a.findIndex(t => t.asset === v.asset) === i);
      setStocks(uniqueData);
    }
    setLoading(false);
  }

  // --- AUTH HANDLERS ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSelectedStock(null);
  };

  // --- ANALYSIS HANDLER ---
  const handleAnalyze = async () => {
    if (!searchQuery) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('https://intelligent-portfolio-tracker-backend.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: searchQuery }),
      });
      if (response.ok) {
        setSearchQuery('');
        const interval = setInterval(async () => {
          const { data } = await supabase.from('market_sentiment').select('asset').eq('asset', searchQuery.toUpperCase());
          if (data && data.length > 0) {
            fetchStocks(); 
            setIsAnalyzing(false);
            clearInterval(interval);
          }
        }, 3000);
        setTimeout(() => { clearInterval(interval); setIsAnalyzing(false); }, 30000);
      }
    } catch (error) { setIsAnalyzing(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono">Initializing AI Neural Network...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 font-sans selection:bg-blue-500/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-16 backdrop-blur-md bg-black/20 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">SentimentAI <span className="text-blue-500">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hidden sm:block">
            Supabase: Connected
          </div>
          {user && (
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-full border border-white/5 transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* --- LOGIN / SIGNUP SCREEN IF NOT LOGGED IN --- */}
      {!user ? (
        <div className="max-w-md mx-auto mt-12 bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={22} />
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              {isSignUp ? 'Create Corporate Account' : 'Secure Neural Terminal Login'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Authorized technical personnel access only</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl font-semibold text-white text-sm transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 size={16} className="animate-spin" /> : isSignUp ? 'Register Terminal' : 'Establish Connection'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-white/5 pt-4">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
              className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              {isSignUp ? 'Already verified? Sign In' : 'Need new console access? Request Sign Up'}
            </button>
          </div>
        </div>
      ) : (
        /* --- CORE DASHBOARD CONTAINER (VISIBLE ONLY IF LOGGED IN) --- */
        <>
          {/* Search & Analyze Section */}
          <div className="mb-10 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Search asset (e.g. WIPRO.NS, BTC-USD)..."
                className="block w-full pl-11 pr-4 py-3 bg-[#0f0f0f] border border-white/5 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
              />
            </div>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-white font-semibold"
            >
              {isAnalyzing ? (
                <><Loader2 size={16} className="animate-spin" /> AI Training...</>
              ) : (
                'Analyze & Track'
              )}
            </button>
          </div>

          {/* Market Intelligence Table */}
          <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-medium">Market Intelligence</h2>
              <div className="text-xs text-slate-500 uppercase tracking-widest text-[10px]">Real-time Feed</div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-slate-500 text-[11px] uppercase tracking-[0.2em] font-semibold">
                <tr>
                  <th className="px-8 py-4">Asset</th>
                  <th className="px-8 py-4">Sentiment</th>
                  <th className="px-8 py-4 text-center">7D Trend & Target</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {stocks.map((stock) => (
                  <tr 
                    key={stock.id} 
                    onClick={() => setSelectedStock(stock)}
                    className="group hover:bg-white/[0.02] cursor-pointer transition-all"
                  >
                    <td className="px-8 py-6">
                       <span className="text-white font-medium group-hover:text-blue-400 transition-colors">{stock.asset}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${stock.score > 0.05 ? 'bg-green-500' : stock.score < -0.05 ? 'bg-red-500' : 'bg-slate-500'}`}
                            style={{ width: `${Math.min(100, Math.max(15, Math.abs(stock.score * 100)))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{stock.score}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 flex flex-col items-center">
                       <StockChart data={stock.history} />
                       <span className="text-blue-400 font-mono text-[11px] mt-1 font-bold">
                         {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stock.predicted_price || 0)}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase border tracking-wider transition-all ${
                        stock.label === 'Bullish' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        stock.label === 'Bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-slate-500/10 text-slate-400 border-white/10'
                      }`}>
                        {stock.label || 'Neutral'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- DYNAMIC MODAL (WITH NEWS FEED & CLICKABLE LINKS) --- */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overflow-y-auto">
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl"><Zap size={20} className="text-white" /></div>
                <h2 className="text-xl font-bold text-white">{selectedStock.asset} <span className="text-slate-500 text-sm font-normal ml-2">Intelligence Report</span></h2>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setSelectedStock(null); }} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {/* Top Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-slate-500 text-[10px] uppercase mb-1 tracking-widest">Price Target</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(selectedStock.predicted_price || 0)}
                  </p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-slate-500 text-[10px] uppercase mb-1 tracking-widest">Model Health</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-green-500" />
                    <p className="text-xl font-bold text-white">Loss: 0.0086</p>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Historical Performance</h3>
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
                <StockChart data={selectedStock.history} isLarge={true} />
              </div>

              {/* AI News Intelligence Section */}
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">AI Source Intelligence</h3>
              <div className="space-y-3">
                {selectedStock.news_snippets && selectedStock.news_snippets.length > 0 ? (
                  selectedStock.news_snippets.map((news: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={news.link || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center group/card hover:border-blue-500/40 hover:bg-blue-500/[0.02] transition-all cursor-pointer block decoration-none"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-slate-200 font-medium line-clamp-1 group-hover/card:text-blue-400 transition-colors">{news.title}</p>
                          <ExternalLink size={12} className="text-slate-600 opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">{news.source}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-md border flex-shrink-0 ${
                        news.sentiment === 'Positive' ? 'text-green-400 border-green-500/20 bg-green-500/5' : 
                        news.sentiment === 'Negative' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-400 border-white/10 bg-white/5'
                      }`}>
                        {news.sentiment}
                      </span>
                    </a>
                  ))
                ) : (
                  <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-center">
                     <p className="text-xs text-slate-600 italic">No news sources analyzed for this session.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedStock(null)} 
                className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm border border-white/10 transition-all font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}