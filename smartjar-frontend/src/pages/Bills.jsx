import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Wifi, Tv, Droplet, Home, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axiosConfig';

export default function Bills() {
    const [step, setStep] = useState(1);
    const [selectedBiller, setSelectedBiller] = useState(null);
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('ONCE'); // ONCE, DAILY, MONTHLY
    const [mpin, setMpin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));

    const billers = [
        { id: 'elec', name: 'Electricity Board', icon: <Zap className="text-amber-500 w-8 h-8"/>, bg: 'bg-amber-100' },
        { id: 'wifi', name: 'Broadband / WiFi', icon: <Wifi className="text-blue-500 w-8 h-8"/>, bg: 'bg-blue-100' },
        { id: 'dth', name: 'DTH / Cable TV', icon: <Tv className="text-purple-500 w-8 h-8"/>, bg: 'bg-purple-100' },
        { id: 'water', name: 'Water Utility', icon: <Droplet className="text-cyan-500 w-8 h-8"/>, bg: 'bg-cyan-100' },
        { id: 'rent', name: 'House Rent', icon: <Home className="text-emerald-500 w-8 h-8"/>, bg: 'bg-emerald-100' },
    ];

    const handlePayBill = async () => {
        if (mpin.length !== 6) return alert("6-Digit MPIN Required");
        setLoading(true);
        try {
            await api.post('/bills/pay', {
                userId: user.id,
                billerName: selectedBiller.name,
                amount: amount,
                mpin: mpin,
                frequency: frequency
            });
            setStep(4);
        } catch (e) {
            alert(e.response?.data?.message || "Payment Failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-6 flex items-center space-x-4 text-white">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft /></button>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Utility Hub</h2>
                        <p className="text-slate-400 text-sm font-medium">Auto-Pay Supported</p>
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                            <h3 className="text-slate-500 font-bold tracking-widest text-xs uppercase">Select Category</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {billers.map(b => (
                                    <button key={b.id} onClick={() => { setSelectedBiller(b); setStep(2); }} 
                                            className="flex flex-col items-center p-6 border-2 border-slate-100 rounded-2xl hover:border-slate-900 transition-all active:scale-95 bg-white">
                                        <div className={`p-4 rounded-full mb-3 ${b.bg}`}>{b.icon}</div>
                                        <span className="font-bold text-slate-800 text-sm text-center">{b.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && selectedBiller && (
                        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
                            <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className={`p-3 rounded-full mr-4 ${selectedBiller.bg}`}>{selectedBiller.icon}</div>
                                <div>
                                    <h3 className="font-black text-slate-900">{selectedBiller.name}</h3>
                                    <p className="text-xs font-bold text-emerald-600">Verified Biller</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Invoice Amount (₹)</label>
                                <input type="number" placeholder="0.00" className="w-full p-4 border-2 border-slate-200 rounded-xl text-3xl font-black text-slate-900 focus:border-slate-900 focus:ring-0 text-center transition-colors bg-slate-50 focus:bg-white"
                                       value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                <label className="block text-xs font-bold text-indigo-800 uppercase mb-3 flex items-center"><Clock className="w-4 h-4 mr-1"/> Autonomous Recurring Pay</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['ONCE', 'DAILY', 'MONTHLY'].map(freq => (
                                        <button key={freq} onClick={() => setFrequency(freq)} 
                                                className={`p-2 text-xs font-bold rounded-lg border-2 transition-all ${frequency === freq ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}>
                                            {freq}
                                        </button>
                                    ))}
                                </div>
                                {frequency !== 'ONCE' && <p className="text-[10px] uppercase font-bold text-indigo-500 mt-3 text-center">SmartJar will autonomously deduct this bill {frequency.toLowerCase()}.</p>}
                            </div>

                            <button onClick={() => setStep(3)} disabled={!amount} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95">
                                INITIATE PAYMENT
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-[fadeIn_0.5s_ease]">
                            <div className="text-center mb-6">
                                <h3 className="font-black text-xl text-slate-900">Authorize Transaction</h3>
                                <p className="text-slate-500 text-sm font-medium mt-2">Paying <span className="font-bold text-slate-800">₹{amount}</span> to <span className="font-bold text-slate-800">{selectedBiller?.name}</span></p>
                                <p className="text-rose-500 font-bold text-xs mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">Take a moment to verify details. Avoid fraud.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase mb-2 text-center">6-Digit MPIN</label>
                                <input type="password" placeholder="••••••" maxLength="6" className="w-full p-4 border-2 border-slate-200 rounded-xl text-2xl font-black tracking-[0.5em] text-center text-slate-900 focus:border-slate-900 transition-colors"
                                       value={mpin} onChange={e => setMpin(e.target.value)} />
                            </div>

                            <button onClick={handlePayBill} disabled={loading || mpin.length !== 6} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95">
                                {loading ? 'Authorizing...' : 'CONFIRM & PAY'}
                            </button>
                            <button onClick={() => { setStep(2); setMpin(''); }} className="w-full text-slate-500 font-bold text-sm mt-3 hover:text-slate-700">Go Back</button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-10 animate-[fadeIn_0.5s_ease]">
                            <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Payment Cleared!</h2>
                            <p className="text-slate-500 font-medium mb-2">₹{amount} successfully paid to {selectedBiller?.name}.</p>
                            
                            {frequency !== 'ONCE' && (
                                <p className="text-indigo-600 font-bold bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-8 max-w-sm mx-auto text-sm">
                                    Autonomous Auto-Pay enabled ({frequency}). SmartJar will handle this next cycle.
                                </p>
                            )}

                            <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 mt-6">
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
