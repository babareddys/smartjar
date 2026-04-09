import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Sparkles, Activity } from 'lucide-react';
import api from '../api/axiosConfig';

export default function Gold() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [price, setPrice] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchGoldData = async () => {
            try {
                const [pRes, portRes] = await Promise.all([
                    api.get('/gold/price'),
                    api.get(`/gold/portfolio/${user.id}`)
                ]);
                setPrice(pRes.data);
                setPortfolio(portRes.data);
            } catch (err) {
                console.error("Gold metrics fetch failed");
            }
        };
        fetchGoldData();
    }, []);

    const [inputType, setInputType] = useState('inr'); // 'inr' or 'grams'
    const [mode, setMode] = useState('buy');

    // Auto-swap input defaults based on mode
    useEffect(() => {
        setInputType(mode === 'buy' ? 'inr' : 'grams');
        setAmount('');
    }, [mode]);

    const executeTrade = async () => {
        if(!amount || amount <= 0 || !price) return alert(`Enter valid amount. Waiting for live price...`);
        setLoading(true);
        try {
            if (mode === 'buy') {
                // Backend Buy expects INR
                let finalInr = inputType === 'inr' ? parseFloat(amount) : parseFloat(amount) * price.pricePerGram;
                const res = await api.post('/gold/buy', { userId: user.id, amount: finalInr });
                alert(`Success! You securely accumulated ${res.data.goldBoughtGrams}g of 24K Gold!`);
            } else {
                // Backend Sell expects Grams
                let finalGrams = inputType === 'grams' ? parseFloat(amount) : parseFloat(amount) / price.pricePerGram;
                const res = await api.post('/gold/sell', { userId: user.id, grams: finalGrams });
                alert(`Success! Liquidated ${res.data.goldSoldGrams}g for ₹${res.data.cashReceived} back to wallet.`);
            }
            navigate('/dashboard');
        } catch (e) {
            alert(e.response?.data?.message || "Trade failed - verify balance.");
        } finally {
            setLoading(false);
        }
    };

    const inrVal = inputType === 'inr' ? amount : (amount * price?.pricePerGram);
    const gramVal = inputType === 'grams' ? amount : (amount / price?.pricePerGram);

    return (
        <div className="min-h-screen bg-[#F4F7FD] flex flex-col items-center py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-8 text-white relative">
                    <button onClick={() => navigate('/dashboard')} className="absolute top-4 left-4 hover:bg-white/20 p-2 rounded-full transition-colors"><ArrowLeft /></button>
                    <div className="mt-8">
                        <p className="text-amber-100 text-sm font-semibold tracking-wider flex items-center mb-2">Live Gold Vault <Sparkles className="w-4 h-4 ml-2"/></p>
                        <h2 className="text-4xl font-black mb-1">{portfolio?.totalGrams ? parseFloat(portfolio.totalGrams).toFixed(4) : '0.000'}g</h2>
                        <h3 className="text-amber-200 font-bold tracking-wide">Current Value: ₹{portfolio?.currentValue || '0.00'}</h3>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl mb-6">
                        <button onClick={() => setMode('buy')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'buy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Invest (Buy)</button>
                        <button onClick={() => setMode('sell')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'sell' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Withdraw (Sell)</button>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-5 flex items-center justify-between border border-amber-100 mb-8">
                        <div>
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-1 leading-tight">Live Market</p>
                            <p className="text-sm font-medium text-amber-700">24K 99.9% Purity</p>
                        </div>
                        <div className="text-right flex items-center">
                            <Activity className="w-4 h-4 text-emerald-500 mr-2" />
                            <p className="text-xl font-bold text-amber-900">₹{price?.pricePerGram || '---'} <span className="text-sm font-semibold text-amber-700">/ g</span></p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Amount in {inputType === 'inr' ? 'INR (₹)' : 'Grams (g)'}</label>
                                <button onClick={() => setInputType(inputType === 'inr' ? 'grams' : 'inr')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                                    Switch to {inputType === 'inr' ? 'Grams' : 'INR'}
                                </button>
                            </div>
                            
                            <input type="number" placeholder="0.00" className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-bold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-shadow bg-white" 
                                value={amount} onChange={e => setAmount(e.target.value)} />
                                
                            <div className="flex space-x-2 mt-3">
                                {[10, 20, 50, 100].map(pct => (
                                    <button key={pct} onClick={() => {
                                        // Standard simplified UI mocking. If Buy->INR logic, if Sell->Gram logic
                                        if (mode === 'sell') {
                                            if (portfolio?.totalGrams) {
                                                let targetGrams = portfolio.totalGrams * (pct/100);
                                                setAmount(inputType === 'grams' ? targetGrams.toFixed(4) : (targetGrams * price.pricePerGram).toFixed(2));
                                            }
                                        } else {
                                            alert(`Simulating auto-filling ${pct}% of Wallet Balance. (Connect Wallet API for perfect math)`);
                                        }
                                    }} className="flex-1 py-1 px-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-amber-600 hover:border-amber-200 transition-colors bg-white">
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex justify-between text-sm font-bold bg-slate-50 px-4 py-3 rounded-xl text-slate-600 border border-slate-200 shadow-inner">
                            <span>You will {mode === 'buy' ? 'get' : 'receive'}:</span>
                            <span className="text-amber-600">
                                {amount && price?.pricePerGram ? (mode === 'buy' ? `${gramVal ? gramVal.toFixed(4) : '0.0000'} g` : `₹${inrVal ? inrVal.toFixed(2) : '0.00'}`) : '---'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-10">
                        <button onClick={executeTrade} disabled={loading} className={`w-full text-white font-bold p-5 rounded-2xl shadow-lg disabled:opacity-50 flex justify-center items-center overflow-hidden transition-transform active:scale-[0.98] ${mode === 'buy' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'}`}>
                            <TrendingUp className={`w-5 h-5 mr-3 ${mode === 'sell' && 'rotate-180'}`} />
                            {loading ? 'Executing Order...' : (mode === 'buy' ? `Buy ${gramVal ? gramVal.toFixed(4) : 0}g Gold` : `Liquidate ₹${inrVal ? inrVal.toFixed(2) : 0} to Wallet`)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
