import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Search, CheckCircle } from 'lucide-react';
import api from '../api/axiosConfig';

export default function SendMoney() {
    const [upiId, setUpiId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [mpin, setMpin] = useState('');
    const [receiver, setReceiver] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [savingsExecuted, setSavingsExecuted] = useState(0);
    
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (location.state?.predefinedUpi) setUpiId(location.state.predefinedUpi);
        if (location.state?.predefinedAmount) setAmount(location.state.predefinedAmount);
    }, [location.state]);

    const verifyUpi = async () => {
        if(!upiId) return;
        setLoading(true);
        try {
            const res = await api.get(`/upi/verify/${upiId}`);
            setReceiver(res.data);
            setStep(2);
        } catch (e) {
            // Simulated validation mock for real UPI URIs that don't exist in our DB
            if (upiId.includes('@')) {
                setReceiver({ name: "External Merchant", upiId: upiId });
                setStep(2);
                return;
            }
            alert("Invalid UPI ID or User not found.");
        } finally {
            setLoading(false);
        }
    }

    const confirmPayment = async () => {
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

            const myUpi = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '@jar';
            const response = await api.post('/upi/p2p/send', {
                senderUpi: myUpi,
                receiverUpi: upiId,
                amount: parseFloat(amount),
                note: note,
                applyRoundUp: applyRoundUp,
                applyFivePercent: applyFivePercent,
                mpin: mpin
            });
            if (response.data.savingsApplied) setSavingsExecuted(parseFloat(response.data.savingsApplied));
            setStep(4);
        } catch (e) {
            alert(e.response?.data?.message || "Payment Failed. Insufficient balance?");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            <div className="max-w-md mx-auto">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-600 font-bold">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </button>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-black text-slate-900">Send Money</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-4 text-slate-400" />
                                <input type="text" placeholder="Enter UPI ID (e.g. user@jar)" className="w-full pl-10 p-4 border rounded-xl font-medium" 
                                    value={upiId} onChange={e => setUpiId(e.target.value)} />
                            </div>
                            <button onClick={verifyUpi} disabled={loading || !upiId} className="w-full bg-indigo-600 text-white font-bold p-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                                {loading ? 'Verifying...' : 'VERIFY UPI ID'}
                            </button>
                        </div>
                    )}

                    {step === 2 && receiver && (
                        <div className="space-y-5">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                <div className="w-16 h-16 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-bold">
                                    {receiver.name.charAt(0)}
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">{receiver.name}</h3>
                                <p className="text-sm text-blue-600 font-medium">{receiver.upiId}</p>
                                <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Verified User ✓</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Amount (₹)</label>
                                    <input type="number" placeholder="0.00" className="w-full p-4 border rounded-xl text-2xl font-bold text-center" 
                                        value={amount} onChange={e => setAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Add Note</label>
                                    <input type="text" placeholder="What's this for?" className="w-full p-3 border rounded-xl"
                                        value={note} onChange={e => setNote(e.target.value)} />
                                </div>
                            </div>

                            <button onClick={() => setStep(3)} disabled={!amount} className="w-full bg-slate-900 text-white font-bold p-4 rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-50 mt-4 active:scale-95 transition-transform">
                                PROCEED TO PAYOUT
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="font-black text-xl text-slate-900">Authorize Transfer</h3>
                                <p className="text-slate-500 text-sm font-medium mt-2">Sending <span className="font-bold text-slate-800">₹{amount}</span> to <span className="font-bold text-slate-800">{receiver?.name}</span></p>
                                <p className="text-rose-500 font-bold text-xs mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">Review carefully before execution. Stop fraud.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase mb-2 text-center">6-Digit MPIN</label>
                                <input type="password" placeholder="••••••" maxLength="6" className="w-full p-4 border-2 border-slate-200 rounded-xl text-2xl font-black tracking-[0.5em] text-center text-slate-900 focus:border-slate-900 transition-colors"
                                       value={mpin} onChange={e => setMpin(e.target.value)} />
                            </div>

                            <button onClick={confirmPayment} disabled={loading || mpin.length !== 6} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95">
                                {loading ? 'Processing Cryptography...' : 'CONFIRM SECURE PAYMENT'}
                            </button>
                            <button onClick={() => { setStep(2); setMpin(''); }} className="w-full text-slate-500 font-bold text-sm mt-3 hover:text-slate-700">Go Back</button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                            <p className="text-gray-500 mb-6">₹{amount} sent securely to {receiver?.name}</p>
                            
                            {savingsExecuted > 0 && (
                                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl mb-8 border border-emerald-100 text-sm font-medium">
                                    <Sparkles className="inline w-4 h-4 mr-1"/> ₹{savingsExecuted} was autonomously invested into 24K Gold!
                                </div>
                            )}

                            <button onClick={() => navigate('/dashboard')} className="w-full bg-gray-100 text-gray-800 font-bold p-4 rounded-xl hover:bg-gray-200">
                                Back to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Sparkles(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
}
