'use client';

import { Share2, Check, Link2 } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
}

/**
 * Кнопка «Поделиться» с поддержкой Web Share API + clipboard fallback.
 * На мобильных откроется нативная шторка (WhatsApp, Telegram и т.д.).
 * На десктопе — копирует ссылку в буфер обмена.
 */
export default function ShareButton({ title, text, url }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

        // Проверяем поддержку Web Share API (мобильные браузеры)
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title, text, url: shareUrl });
                return;
            } catch (err) {
                // Пользователь отменил — ничего страшного
                if ((err as Error).name === 'AbortError') return;
            }
        }

        // Fallback: копируем в буфер обмена
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Последний fallback — prompt
            prompt('Скопируйте ссылку:', shareUrl);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 border border-primary/20 rounded-full font-medium hover:bg-primary/5 transition-all"
        >
            {copied ? (
                <>
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-green-500">Скопировано!</span>
                </>
            ) : (
                <>
                    <Share2 className="w-5 h-5" />
                    <span>Поделиться страницей</span>
                </>
            )}
        </button>
    );
}
