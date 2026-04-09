import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Lock, Mail, ShieldAlert } from 'lucide-react';
import api from '../api/axiosConfig';

export default function Settings() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    // MPIN State
    const [mpinMode, setMpinMode] = useState('oldMpin'); // 'oldMpin' or 'password'
    const [oldMpin, setOldMpin] = useState('');
    const [mpinPassword, setMpinPassword] = useState('');
    const [newMpin, setNewMpin] = useState('');
    
    // Pass State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    // Recovery State
    const [recoveryEmail, setRecoveryEmail] = useState(user?.email || '');
    const [recoveryStep, setRecoveryStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [resetPassword, setResetPassword] = useState('');

    const changeMpin = async (e) => {
        e.preventDefault();
        if (newMpin.length !== 6) return alert("New MPIN must be 6 digits.");
        try {
            await api.post('/security/change-mpin', {
                userId: user.id,
                oldMpin: mpinMode === 'oldMpin' ? oldMpin : '',
                password: mpinMode === 'password' ? mpinPassword : '',
                newMpin: newMpin
            });
            alert("MPIN Successfully Updated!");
            setOldMpin(''); setMpinPassword(''); setNewMpin('');
        } catch (err) {
            alert(err.response?.data?.message || "MPIN shift failed.");
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        try {
            await api.post('/security/change-password', {
                userId: user.id,
                oldPassword,
                newPassword
            });
            alert("Password updated securely!");
            setOldPassword(''); setNewPassword('');
        } catch (err) {
            alert(err.response?.data?.message || "Password update failed.");
        }
    };

    const requestReset = async (e) => {
        e.preventDefault();
        try {
            await api.post('/security/request-reset', { email: recoveryEmail });
            alert("Security sequence initialized! Check your Email for the OTP.");
            setRecoveryStep(2);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to trigger reset.");
        }
    };

    const confirmReset = async (e) => {
        e.preventDefault();
        try {
            await api.post('/security/confirm-reset', {
                email: recoveryEmail,
                otp,
                newPassword: resetPassword
            });
            alert("Password Recovery Successful! Database overwritten.");
            setRecoveryStep(1); setOtp(''); setResetPassword('');
        } catch (err) {
            alert(err.response?.data?.message || "Invalid OTP payload.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-6 flex items-center space-x-4 text-white">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft /></button>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Security Command Center</h2>
                        <p className="text-emerald-400 text-sm font-bold flex items-center mt-1"><ShieldAlert className="w-4 h-4 mr-1"/> Protected Architecture</p>
                    </div>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8">
                    {/* MPIN TERMINAL */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-black text-slate-800 mb-4 flex items-center"><Key className="w-5 h-5 mr-2 text-indigo-600"/> Change MPIN</h3>
                        <div className="flex bg-slate-200 p-1 rounded-lg mb-4">
                            <button onClick={() => setMpinMode('oldMpin')} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${mpinMode === 'oldMpin' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Use Old MPIN</button>
                            <button onClick={() => setMpinMode('password')} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${mpinMode === 'password' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Use Password</button>
                        </div>
                        <form onSubmit={changeMpin} className="space-y-3">
                            {mpinMode === 'oldMpin' ? (
                                <input type="password" placeholder="Old MPIN" maxLength="6" className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center tracking-[0.3em] focus:border-indigo-500 focus:ring-1"
                                    value={oldMpin} onChange={e => setOldMpin(e.target.value)} required />
                            ) : (
                                <input type="password" placeholder="Account Password" className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-500 focus:ring-1"
                                    value={mpinPassword} onChange={e => setMpinPassword(e.target.value)} required />
                            )}
                            <input type="password" placeholder="New 6-Digit MPIN" maxLength="6" className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-black text-center tracking-[0.3em] text-indigo-900 focus:border-indigo-500 focus:ring-1"
                                value={newMpin} onChange={e => setNewMpin(e.target.value)} required />
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">Apply MPIN Route</button>
                        </form>
                    </div>

                    {/* PASSWORD TERMINAL */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-black text-slate-800 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-rose-600"/> Change Password</h3>
                        <form onSubmit={changePassword} className="space-y-3">
                            <input type="password" placeholder="Old Password" className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-rose-500 focus:ring-1"
                                value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                            <input type="password" placeholder="New Password" className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:border-rose-500 focus:ring-1"
                                value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg shadow-md hover:bg-slate-800 transition-colors">Execute Override</button>
                        </form>
                    </div>

                    {/* SMTP RECOVERY TERMINAL */}
                    <div className="md:col-span-2 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <h3 className="font-black text-indigo-900 mb-4 flex items-center"><Mail className="w-5 h-5 mr-2 text-indigo-600"/> Forgot Password Recovery</h3>
                        {recoveryStep === 1 ? (
                            <form onSubmit={requestReset} className="flex space-x-3">
                                <input type="email" placeholder="Registered Email" className="flex-1 p-3 bg-white border border-indigo-200 rounded-lg text-sm font-bold focus:border-indigo-500 focus:ring-1"
                                    value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} required />
                                <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors whitespace-nowrap">Send Vault Hook</button>
                            </form>
                        ) : (
                            <form onSubmit={confirmReset} className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-[fadeIn_0.4s_ease]">
                                <input type="text" placeholder="6-Digit Setup OTP" maxLength="6" className="w-full p-3 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-center tracking-[0.3em] focus:border-indigo-500 focus:ring-1"
                                    value={otp} onChange={e => setOtp(e.target.value)} required />
                                <input type="password" placeholder="Define New Password" className="w-full p-3 bg-white border border-indigo-200 rounded-lg text-sm font-bold focus:border-indigo-500 focus:ring-1"
                                    value={resetPassword} onChange={e => setResetPassword(e.target.value)} required />
                                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-emerald-700 transition-colors">Decrypt & Reassign</button>
                            </form>
                        )}
                        <p className="text-xs font-bold text-indigo-500 mt-4 uppercase text-center tracking-wide">Requires active SMTP verification routing</p>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
