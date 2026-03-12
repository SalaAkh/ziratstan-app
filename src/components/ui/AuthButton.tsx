'use client'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { LogIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function AuthButton() {
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        fetchUser()
    }, [supabase])

    if (loading) {
        return <div className="ml-4 w-20 h-9 bg-white/5 rounded-xl animate-pulse"></div>
    }

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
