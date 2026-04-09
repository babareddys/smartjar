import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PiggyBank, Settings, ShieldCheck, Zap } from 'lucide-react';
import api from '../api/axiosConfig';

export default function Savings() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [totalSaved, setTotalSaved] = useState(0);
    const [rules, setRules] = useState([
        { id: 1, type: "Round-up to Nearest ₹10", active: true, tag: "POPULAR" },
        { id: 2, type: "Daily ₹50 Auto-Save", active: false },
        { id: 3, type: "Save 5% of Spend", active: false }
    ]);

    const toggleRule = (id) => {
        const newRules = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
        setRules(newRules);
        localStorage.setItem('savingsRules', JSON.stringify(newRules));
    }

    useEffect(() => {
        const stored = localStorage.getItem('savingsRules');
        if (stored) setRules(JSON.parse(stored));
        
        api.get(`/savings/total/${user.id}`).then(res => {
            setTotalSaved(res.data.total); 
        });
    }, [user.id]);

    return (
        <div className="min-h-screen bg-[#F4F7FD] flex flex-col items-center py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative">
                
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-white relative">
                    <button onClick={() => navigate('/dashboard')} className="absolute top-4 left-4 hover:bg-white/20 p-2 rounded-full transition-colors"><ArrowLeft /></button>
                    
                    <div className="absolute right-[-20%] top-[-20%] opacity-10">
                        <PiggyBank className="w-64 h-64" />
                    </div>

                    <div className="mt-8 relative z-10 flex flex-col items-start">
                        <span className="bg-emerald-500/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-emerald-400">Micro Savings Engine</span>
                        <p className="text-emerald-100 font-medium mb-1">Total Spare Change Saved</p>
                        <h2 className="text-5xl font-black tracking-tighter">₹{totalSaved.toLocaleString()}</h2>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-xl font-extrabold text-gray-900">Active Autopilot Rules</h3>
                        <Settings className="w-5 h-5 text-gray-400 hover:text-gray-900 cursor-pointer transition-colors" />
                    </div>

                    <div className="space-y-4">
                        {rules.map((rule) => (
                            <div key={rule.id} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${rule.active ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`} onClick={() => toggleRule(rule.id)}>
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.active ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${rule.active ? 'text-emerald-900' : 'text-gray-600'}`}>{rule.type}</h4>
                                        {rule.tag && <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block">{rule.tag}</span>}
                                    </div>
                                </div>
                                <div className={`w-14 h-8 rounded-full p-1 transition-colors ${rule.active ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${rule.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start space-x-4">
                        <ShieldCheck className="w-8 h-8 text-blue-600 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">Military Grade Encryption</h4>
                            <p className="text-xs text-blue-700 leading-relaxed mt-1">Your auto-savings logic is tied instantly bypassing third-party queues directly securely to your Gold Vault portfolio.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
