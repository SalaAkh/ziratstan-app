import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { LogIn } from 'lucide-react'

export default async function AuthButton() {
    const supabase = await createClient()

    // Safely check for user session without redirecting
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 bg-[#d4af37]/10 text-[#d4af37] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#d4af37]/20 transition-colors ml-4"
            >
                <LogIn size={16} />
                Войти
            </Link>
        )
    }

    return (
        <Link
            href="/cabinet"
            className="flex items-center gap-2 bg-white/10 text-[#f4f4f5] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors ml-4"
        >
            <div className="w-5 h-5 bg-[#d4af37] text-[#09090b] rounded-full flex items-center justify-center text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
            </div>
            Кабинет
        </Link>
    )
}
