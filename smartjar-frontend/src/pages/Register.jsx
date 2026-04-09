import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [mpin, setMpin] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert('Security protocol activated: OTP sent to your Email!');
            setStep(2);
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/auth/verify?email=${encodeURIComponent(formData.email)}&otp=${otp}`);
            // JWT loaded to local storage natively bridging login
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            alert('Identity Verified! Welcome to the vault.');
            setStep(3); // Shift abruptly into MPIN configuration
        } catch (err) {
            alert('Invalid OTP. Please check your Email again.');
        }
    };

    const handleSetupMpin = async (e) => {
        e.preventDefault();
        if (mpin.length !== 6) {
            alert('Your Secure MPIN must be exactly 6 Digits.');
            return;
        }
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post('/security/setup-mpin', { userId: user.id, mpin: mpin });
            alert('Cryptographic MPIN Authorized! Core systems online.');
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || 'MPIN mapping failed.');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
                {step === 1 && (
                    <>
                        <h2 className="text-3xl font-black mb-6 text-center text-slate-900 tracking-tight">Sign Up Securely</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <input type="text" placeholder="Full Name" className="w-full p-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                   onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <input type="email" placeholder="Verification Email" className="w-full p-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                   onChange={e => setFormData({...formData, email: e.target.value})} required />
                            <input type="tel" placeholder="Phone Number" className="w-full p-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                   onChange={e => setFormData({...formData, phone: e.target.value})} required />
                            <input type="password" placeholder="Password Payload" className="w-full p-4 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                   onChange={e => setFormData({...formData, password: e.target.value})} required />
                            <button type="submit" className="w-full bg-slate-900 text-white p-4 mt-2 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors">
                                Generate Identity
                            </button>
                        </form>
                        <p className="mt-6 text-center text-slate-500 font-medium">
                            Already exist? <a href="/login" className="text-indigo-600 font-bold hover:text-indigo-800">Boot Login</a>
                        </p>
                    </>
                )}
                
                {step === 2 && (
                    <>
                        <h2 className="text-3xl font-black mb-2 text-center text-slate-900 tracking-tight">Verify Email Tracker</h2>
                        <p className="text-center text-slate-500 font-medium mb-8">We routed a native 6-Digit OTP securely to your inbox. Check spam.</p>
                        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                            <div className="flex justify-center mb-6">
                                <input type="text" placeholder="000000" maxLength="6" className="w-2/3 text-center tracking-[0.5em] text-3xl p-4 border-2 border-slate-300 rounded-xl font-black text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                       onChange={e => setOtp(e.target.value)} required />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95">
                                Verify Cryptographic Hook
                            </button>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2 className="text-3xl font-black mb-2 text-center text-indigo-900 tracking-tight">Set Secure MPIN</h2>
                        <p className="text-center text-indigo-500 font-bold mb-8">Required for all wallet transactions.</p>
                        <form onSubmit={handleSetupMpin} className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                            <div className="flex justify-center mb-6">
                                <input type="password" placeholder="••••••" maxLength="6" className="w-2/3 text-center tracking-[0.5em] text-3xl p-4 border-2 border-indigo-300 rounded-xl font-black text-indigo-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-400/20 transition-all bg-indigo-50"
                                       onChange={e => setMpin(e.target.value)} required />
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold shadow-lg shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-95">
                                Formulate MPIN
                            </button>
                        </form>
                    </>
                )}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
  );
}

export default Register;
