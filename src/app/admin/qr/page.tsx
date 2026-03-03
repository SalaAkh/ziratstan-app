'use client';

import { useState } from 'react';
import QRCode from 'react-qrcode-logo';
import { Download, Printer, QrCode } from 'lucide-react';

export default function QRGeneratorPage() {
    const [profileId, setProfileId] = useState('test-id');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ziratstan.kz';
    const qrUrl = `${baseUrl}/profile/${profileId}`;

    const handleDownload = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `ziratstan-qr-${profileId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">QR-Генератор</h1>
                    <p className="text-foreground/60">
                        Создайте QR-код для печати на надгробной табличке
                    </p>
                </div>

                <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6 mb-6">
                    <label className="block text-sm font-medium mb-2">ID профиля</label>
                    <input
                        type="text"
                        value={profileId}
                        onChange={e => setProfileId(e.target.value)}
                        placeholder="test-id или UUID из базы данных"
                        className="w-full bg-background border border-primary/20 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors text-sm"
                    />
                    <p className="text-xs text-foreground/40 mt-2">
                        Ссылка: <span className="text-accent">{qrUrl}</span>
                    </p>
                </div>

                {/* QR Preview */}
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl shadow-primary/10 mb-6">
                    <QRCode
                        value={qrUrl}
                        size={220}
                        bgColor="#ffffff"
                        fgColor="#2d3748"
                        qrStyle="dots"
                        eyeRadius={6}
                        logoWidth={48}
                        logoHeight={48}
                    />
                    <div className="text-center text-gray-600 text-xs mt-2">
                        <p className="font-bold text-gray-800 text-base">Зиратстан</p>
                        <p>Наведите камеру для просмотра профиля</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-background px-6 py-4 rounded-xl font-bold hover:opacity-90 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Скачать PNG
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 border border-primary/20 px-6 py-4 rounded-xl font-bold hover:bg-primary/5 transition-all"
                    >
                        <Printer className="w-5 h-5" />
                        Печать
                    </button>
                </div>

                <p className="text-center text-xs text-foreground/40 mt-6">
                    Рекомендуем печатать на металлической или керамической табличке для долговечности
                </p>
            </div>
        </div>
    );
}
