import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Smartphone, ArrowRight } from 'lucide-react';
import api from '../api/axiosConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simple hardware fingerprint simulation
    let dId = localStorage.getItem('smartjar_device_id');
    if (!dId) {
      dId = 'browser_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('smartjar_device_id', dId);
    }
    setDeviceId(dId);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, deviceId });
      
      if (res.data.requiresDeviceVerification) {
        setShowOtp(true);
        alert('Unrecognized device detected. Please enter the OTP sent to your email.');
      } else {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/auth/verify-device?email=${email}&deviceId=${deviceId}&otp=${otp}`);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      alert('Invalid Device OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-3xl border border-slate-100">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
                <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">SmartJar Vault</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Enterprise Secure Access</p>
        </div>

        {!showOtp ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Account Email</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                    <input type="email" placeholder="name@example.com" className="w-full p-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                           onChange={e => setEmail(e.target.value)} required />
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
                <input type="password" placeholder="••••••••" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                       onChange={e => setPassword(e.target.value)} required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center space-x-2">
              <span>{loading ? 'Authorizing...' : 'Enter Vault'}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleDeviceVerify} className="space-y-6 animate-[fadeIn_0.4s_ease]">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
                <Smartphone className="text-amber-600 w-6 h-6 flex-shrink-0 mt-1" />
                <p className="text-sm font-bold text-amber-800 leading-tight">
                    New hardware signature identified. Check email for a 6-digit confirmation pin.
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-2 text-center tracking-widest">Device confirmation OTP</label>
                <input type="text" placeholder="••••••" maxLength="6" className="w-full p-4 border-2 border-indigo-200 bg-indigo-50 rounded-2xl text-2xl font-black tracking-[0.5em] text-center text-indigo-900 focus:border-indigo-500 transition-all outline-none"
                    value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">
               {loading ? 'Verifying Hardware...' : 'Confirm & Log In'}
            </button>
            <button type="button" onClick={() => setShowOtp(false)} className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">
                Cancel
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-500 font-medium">
              Don't have an account? <a href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 underline decoration-indigo-200 underline-offset-4">Join SmartJar</a>
            </p>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
