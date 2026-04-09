import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, ImageUp } from 'lucide-react';
import jsQR from 'jsqr';

export default function QrScanner() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    parseUpiUrl(code.data);
                } else {
                    alert("No valid QR code found in this image.");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const parseUpiUrl = (url) => {
        try {
            // e.g., upi://pay?pa=merchant@sbi&pn=John&am=500
            if (url.toLowerCase().startsWith("upi://pay")) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const upiId = urlParams.get('pa');
                const name = urlParams.get('pn');
                const amount = urlParams.get('am') || '';

                if (upiId) {
                    alert(`Authentic Merchant Decoded: ${name || upiId}`);
                    // Forward natively to P2P Send with populated state payload.
                    navigate('/send', { state: { predefinedUpi: upiId, predefinedAmount: amount } });
                } else {
                    alert("QR Code does not contain a valid Payment Address (pa).");
                }
            } else {
                alert(`Decoded Text: ${url}\n(Not a standard UPI format)`);
            }
        } catch (e) {
            alert("Failed to parse QR data.");
        }
    };

    const runDemo = () => {
        navigate('/send', { state: { predefinedUpi: 'merchant@jar' } });
    }

    return (
        <div className="h-screen bg-slate-900 flex flex-col relative overflow-hidden">
            <div className="absolute top-6 left-6 z-20">
                <button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"><ArrowLeft /></button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center z-10 px-6">
                <div className="relative w-72 h-72 rounded-3xl border-2 border-indigo-500/50 flex flex-col items-center justify-center bg-black/40 overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                    <ScanLine className="w-16 h-16 text-slate-500 opacity-30 cursor-pointer object-cover" />
                    
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white translate-x-4 translate-y-4 rounded-tl-xl opacity-80"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -translate-x-4 translate-y-4 rounded-tr-xl opacity-80"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white translate-x-4 -translate-y-4 rounded-bl-xl opacity-80"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -translate-x-4 -translate-y-4 rounded-br-xl opacity-80"></div>
                </div>

                <h3 className="text-white text-xl font-bold mt-10 tracking-wide mb-6">NPCI Auth Scanner</h3>

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                <div className="flex flex-col space-y-4 w-full max-w-xs">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-xl shadow-lg flex justify-center items-center">
                        <ImageUp className="w-5 h-5 mr-3" />
                        Upload QR Image
                    </button>
                    
                    <button onClick={runDemo} className="w-full border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold p-4 rounded-xl">
                        Simulate Scan Demo
                    </button>
                </div>
            </div>
        </div>
    )
}
