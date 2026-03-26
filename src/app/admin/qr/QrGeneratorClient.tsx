'use client'

import { useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Download, Printer, QrCode } from 'lucide-react'

type ProfileInfo = {
    id: string
    first_name: string
    last_name: string | null
    patronymic: string | null
}

export default function QrGeneratorClient({ initialProfiles }: { initialProfiles: ProfileInfo[] }) {
    const [profileId, setProfileId] = useState(initialProfiles[0]?.id || '')

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ziratstan.kz'
    const qrUrl = profileId ? `${baseUrl}/profile/${profileId}` : baseUrl

    const selectedProfile = initialProfiles.find(p => p.id === profileId)
    const profileName = selectedProfile
        ? `${selectedProfile.last_name || ''} ${selectedProfile.first_name} ${selectedProfile.patronymic || ''}`.trim()
        : 'Тестовый профиль'

    const handleDownload = () => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
            const link = document.createElement('a')
            link.download = `ziratstan-qr-${profileId || 'empty'}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-full text-center mb-10 print:hidden">
                <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-[#d4af37]" />
                </div>
                <h1 className="text-3xl font-bold mb-2">QR-Генератор табличек</h1>
                <p className="text-[#71717a]">
                    Выберите мемориал и распечатайте готовый PDF макет
                </p>
            </div>

            <div className="w-full bg-[#111113] border border-white/5 rounded-2xl p-6 mb-8 print:hidden shadow-xl">
                <label htmlFor="qr-profile-select" className="block text-sm font-medium text-[#71717a] mb-2">Выберите профиль из базы</label>
                <select
                    id="qr-profile-select"
                    name="qr-profile-select"
                    value={profileId}
                    onChange={e => setProfileId(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all text-[#f4f4f5] appearance-none"
                >
                    <option value="" disabled>-- Выберите мемориал --</option>
                    {initialProfiles.map(p => (
                        <option key={p.id} value={p.id}>
                            {`${p.last_name || ''} ${p.first_name} ${p.patronymic || ''}`.trim()}
                        </option>
                    ))}
                </select>

                <div className="mt-4 pt-4 border-t border-white/5">
                    <label htmlFor="manual-profile-uuid" className="block text-sm font-medium text-[#71717a] mb-2">Или введите ID вручную</label>
                    <input
                        id="manual-profile-uuid"
                        name="manual-profile-uuid"
                        type="text"
                        value={profileId}
                        onChange={e => setProfileId(e.target.value)}
                        placeholder="UUID профиля"
                        className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#d4af37]/50 transition-colors text-sm font-mono text-[#f4f4f5]"
                    />
                </div>
            </div>

            {/* QR Print Layout Area */}
            <div className="w-full flex justify-center print:block print:w-full">
                <div className="bg-white rounded-3xl p-10 flex flex-col items-center justify-center border-[8px] border-[#2d3748] shadow-2xl relative print:shadow-none print:border-4 print:mx-auto mt-2" style={{ width: '300px', height: '400px' }}>

                    <div className="absolute top-4 left-0 w-full flex justify-center">
                        <h2 className="text-[#2d3748] font-bold tracking-widest uppercase text-xs opacity-50">Memory Portal</h2>
                    </div>

                    <div className="mb-4">
                        <QRCode
                            value={qrUrl}
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#2d3748"
                            qrStyle="fluid"
                            eyeRadius={8}
                        />
                    </div>

                    <div className="text-center font-serif text-[#2d3748] mt-2">
                        <p className="font-bold text-lg leading-tight uppercase mb-1">{profileName}</p>
                        <div className="w-12 h-px bg-[#d4af37] mx-auto my-3"></div>
                        <p className="text-xs font-sans opacity-70">Наведите камеру смартфона</p>
                        <p className="text-xs font-sans opacity-70">чтобы открыть мемориал</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 w-full max-w-sm print:hidden">
                <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#111113] border border-white/10 text-[#f4f4f5] px-6 py-4 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                    <Download className="w-5 h-5" />
                    PNG
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#d4af37] text-[#09090b] px-6 py-4 rounded-xl font-bold hover:opacity-90 shadow-lg shadow-[#d4af37]/20 transition-all"
                >
                    <Printer className="w-5 h-5" />
                    Печать PDF
                </button>
            </div>

        </div>
    )
}
