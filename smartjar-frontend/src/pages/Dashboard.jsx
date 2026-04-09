import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, QrCode, SendIcon, TrendingUp, PiggyBank, ReceiptText, Sparkles, ChevronRight, Activity, Bell, Search, LayoutDashboard, ShieldAlert } from 'lucide-react';
import api from '../api/axiosConfig';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [walletBal, setWalletBal] = useState(0);
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState([]);
  const [totalGold, setTotalGold] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if(!user) return navigate('/login');
    const loadData = async () => {
        try {
            const [wReq, hReq, iReq, gReq] = await Promise.all([
                api.get(`/wallet/${user.id}`),
                api.get(`/upi/history/${user.id}`),
                api.get(`/insights`),
                api.get(`/gold/portfolio/${user.id}`)
            ]);
            setWalletBal(wReq.data.balance);
            setHistory(hReq.data);
            setInsights(iReq.data);
            setTotalGold(gReq.data.totalGrams);
        } catch(e) { console.error("Error loading dashboard metrics"); }
    };
    loadData();
  }, [user?.id, navigate]);

  const chartData = [
    { name: 'Mon', balance: 2400 }, { name: 'Tue', balance: 3500 },
    { name: 'Wed', balance: 4200 }, { name: 'Thu', balance: 3800 },
    { name: 'Fri', balance: 5900 }, { name: 'Sat', balance: 6500 },
    { name: 'Sun', balance: 7100 }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 font-sans">
      
      {/* Sleek Minimalist Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col py-8 px-4 fixed h-screen z-10">
        <div className="flex items-center space-x-3 px-4 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-lg">SJ</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">SmartJar</span>
        </div>
        
        <div className="space-y-1 flex-1">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Menu</p>
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
            <NavItem icon={<SendIcon size={20}/>} label="P2P Transfer" onClick={() => navigate('/send')} />
            <NavItem icon={<TrendingUp size={20}/>} label="Gold Vault" onClick={() => navigate('/gold')} />
            <NavItem icon={<PiggyBank size={20}/>} label="Auto Savings" onClick={() => navigate('/savings')}/>
            <NavItem icon={<ReceiptText size={20}/>} label="Bill Payments" onClick={() => navigate('/bills')}/>
            <NavItem icon={<Wallet size={20}/>} label="Wallet" onClick={() => navigate('/wallet')}/>
            
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest mt-6 mb-3">System</p>
            <NavItem icon={<ShieldAlert size={20}/>} label="Security" onClick={() => navigate('/settings')}/>
        </div>

        <div className="border-t border-slate-100 pt-6 px-2">
            <div className="flex items-center space-x-3 px-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold uppercase">
                    {user?.name.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">@{user?.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}jar</p>
                </div>
            </div>
            <button className="mt-4 w-full text-left px-4 py-2 text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
                onClick={() => { localStorage.clear(); navigate('/login'); }}>
                Log out
            </button>
        </div>
      </div>

      {/* Main Ultra-Clean Layout */}
      <div className="flex-1 ml-64 p-10 max-w-7xl mx-auto">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-10">
            <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input type="text" placeholder="Search transactions..." className="bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-6 text-sm w-80 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow shadow-sm"/>
            </div>
            <div className="flex items-center space-x-4">
                <button className="relative w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </div>

        {/* Header Greeting */}
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Overview</h2>
            <p className="text-slate-500 mt-1">Here is a summary of your automated finances.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Primary Balance Widget */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md">Live</span>
                </div>
                <div>
                    <p className="text-slate-500 font-medium text-sm mb-1">Total Balance</p>
                    <h3 className="text-4xl font-bold text-slate-900 tracking-tight">₹{walletBal.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl lg:col-span-2 text-white relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Automate Your Future</h3>
                        <p className="text-slate-400 text-sm max-w-sm mb-6">Direct your funds across peer networks, pay utility bills, or convert to pure 24K Gold seamlessly.</p>
                        <div className="flex space-x-3">
                            <button onClick={() => navigate('/send')} className="bg-indigo-500 hover:bg-indigo-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/30">Transfer Money</button>
                            <button onClick={() => navigate('/wallet')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-white/10">Add Funds</button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                        <ShortcutBtn icon={<TrendingUp/>} label="Buy Gold" onClick={() => navigate('/gold')} />
                        <ShortcutBtn icon={<QrCode/>} label="Scan QR" onClick={() => navigate('/qr')} />
                        <ShortcutBtn icon={<ReceiptText/>} label="Pay Bills" onClick={() => navigate('/bills')} />
                        <ShortcutBtn icon={<PiggyBank/>} label="Savings" onClick={() => navigate('/savings')} />
                    </div>
                </div>
            </div>

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Module */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-slate-900 text-lg">Cashflow Analytics</h3>
                    <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500">
                        <option>This Week</option>
                        <option>Last Month</option>
                    </select>
                </div>
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradientFlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} />
                            <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4'}}
                                     contentStyle={{backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '13px', padding: '10px 14px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                                     itemStyle={{color: '#fff', fontWeight: 'bold'}} />
                            <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fill="url(#gradientFlow)" activeDot={{r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3}} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Insights & Recent Activity Block */}
            <div className="flex flex-col gap-6">
                
                {/* Insights Mini Card */}
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-start space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><Sparkles className="w-5 h-5"/></div>
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm mb-1">Smart Digest</h4>
                        <p className="text-xs text-indigo-700/80 leading-relaxed font-medium">
                            {insights.length > 0 ? insights[0] : "You are currently optimizing your recurring expenditures successfully."}
                        </p>
                    </div>
                </div>

                {/* Ledger Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900">Recent Ledger</h3>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 transition-colors">See all</span>
                    </div>
                    <div className="flex-1 overflow-auto space-y-1">
                        {history.length === 0 ? <p className="text-slate-400 font-medium text-sm text-center pt-8">No transactions found.</p> : history.slice(0, 4).map((tx, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.senderId === user.id ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <Activity className="w-4 h-4"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm capitalize">{tx.transactionType.replace('_',' ')}</p>
                                        <p className="text-[11px] font-medium text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${tx.senderId === user.id ? 'text-slate-900' : 'text-emerald-600'}`}>
                                    {tx.senderId === user.id ? '-' : '+'}₹{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
      </div>
    </div>
  );
}

function NavItem({icon, label, active, onClick}) {
    return (
        <div onClick={onClick} className={`flex items-center w-full px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <span className={`mr-3 ${active ? 'text-indigo-400' : 'text-slate-400'}`}>{icon}</span>
            <span className="font-semibold text-sm">{label}</span>
            {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50"/>}
        </div>
    )
}

function ShortcutBtn({icon, label, onClick}) {
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl p-4 transition-all">
            <div className="text-indigo-300 mb-2">{icon}</div>
            <span className="text-xs font-semibold text-white tracking-wide">{label}</span>
        </button>
    )
}
