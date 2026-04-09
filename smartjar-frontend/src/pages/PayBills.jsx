import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Droplet, MonitorPlay, Wifi, ShieldCheck, Phone } from 'lucide-react';
import api from '../api/axiosConfig';

export default function PayBills() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [billType, setBillType] = useState('');
    const [billerName, setBillerName] = useState('');
    const [amount, setAmount] = useState('');
    const [mpin, setMpin] = useState('');
    const [loading, setLoading] = useState(false);
    const [walletBal, setWalletBal] = useState(0);

    useEffect(() => {
        api.get(`/wallet/${user.id}`).then(res => setWalletBal(res.data.balance));
    }, []);

    const executePayment = async () => {
        if(!billType || !billerName || !amount) return alert("Fill out all billing details");
        if(mpin.length !== 6) return alert("Enter valid 6-digit MPIN");
        setLoading(true);
        try {
            const defaultRules = [
                { id: 1, active: true },
                { id: 2, active: false },
                { id: 3, active: false }
            ];
            const storedRules = JSON.parse(localStorage.getItem('savingsRules')) || defaultRules;
            const applyRoundUp = storedRules.find(r => r.id === 1)?.active || false;
            const applyFivePercent = storedRules.find(r => r.id === 3)?.active || false;

            const res = await api.post('/bills/pay', { 
                userId: user.id, 
                billType, 
                billerName, 
                mpin,
                amount: parseFloat(amount),
                applyRoundUp,
                applyFivePercent
            });
            alert(res.data.message + (res.data.savingsApplied && parseFloat(res.data.savingsApplied) > 0 ? ` Additionally, ₹${res.data.savingsApplied} was auto-saved as 24K Gold!` : ""));
            navigate('/dashboard');
        } catch (e) {
            alert(e.response?.data?.message || "Execution failed. Check wallet bounds.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                
                <div className="bg-slate-900 p-8 text-white relative">
                    <button onClick={() => navigate('/dashboard')} className="absolute top-4 left-4 hover:bg-white/10 p-2 rounded-full transition-colors"><ArrowLeft /></button>
                    <div className="mt-8">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300 border border-white/5">Utility Hub</span>
                        <h2 className="text-3xl font-black mt-3">Pay Bills</h2>
                        <p className="text-slate-400 text-sm mt-1 font-medium">Available Balance: ₹{walletBal.toLocaleString()}</p>
                    </div>
                </div>

                <div className="p-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Category</p>
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <CategoryBtn icon={<Lightbulb/>} label="Electric" val="Electricity" current={billType} set={setBillType} />
                        <CategoryBtn icon={<Droplet/>} label="Water" val="Water" current={billType} set={setBillType} />
                        <CategoryBtn icon={<Wifi/>} label="Broadband" val="Internet" current={billType} set={setBillType} />
                        <CategoryBtn icon={<MonitorPlay/>} label="DTH" val="DTH" current={billType} set={setBillType} />
                        <CategoryBtn icon={<Phone/>} label="Postpaid" val="Mobile" current={billType} set={setBillType} />
                    </div>

                    {billType && (
                        <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biller ID / Account Number</label>
                                <input type="text" placeholder="Eg: 1029384812" className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                                    value={billerName} onChange={e => setBillerName(e.target.value)} />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                                <input type="number" placeholder="₹0" className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white shadow-inner" 
                                    value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">6-Digit MPIN</label>
                                <input type="password" placeholder="••••••" maxLength="6" className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-black tracking-[0.5em] text-center text-slate-900 bg-white" 
                                    value={mpin} onChange={e => setMpin(e.target.value)} />
                            </div>

                            <button onClick={executePayment} disabled={loading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 mr-2" />
                                {loading ? 'Processing...' : `Pay ₹${amount || 0} Securely`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function CategoryBtn({icon, label, val, current, set}) {
    const active = current === val;
    return (
        <button onClick={() => set(val)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${active ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            <div className={`mb-2 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{icon}</div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    )
}
