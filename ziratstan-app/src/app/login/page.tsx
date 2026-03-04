import { login, signup } from './actions'
import { AlertCircle } from 'lucide-react'

// In Next.js App Router, SearchParams must be awaited in async components in Next 15
export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const isError = params.error === 'true';
    const msg = params.msg as string | undefined;

    return (
        <div className="min-h-screen flex items-center justify-center pt-16 px-4">
            <div className="bg-[#111113] border border-white/5 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Decorative blur */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-[64px] pointer-events-none"></div>

                <div className="relative z-10">
                    <h1 className="text-2xl font-bold mb-2">Добро пожаловать</h1>
                    <p className="text-[#71717a] text-sm mb-6">
                        Войдите или зарегистрируйтесь, чтобы создать профиль
                    </p>

                    {msg && (
                        <div className={`mb-6 p-4 rounded-xl flex gap-3 text-sm ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                            {isError && <AlertCircle size={18} className="shrink-0" />}
                            <p>{msg}</p>
                        </div>
                    )}

                    <form className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#71717a] mb-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="почта@example.com"
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 text-[#f4f4f5] placeholder:text-[#71717a]/50 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#71717a] mb-1" htmlFor="password">
                                Пароль
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 text-[#f4f4f5] placeholder:text-[#71717a]/50 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                formAction={login}
                                className="w-full bg-[#f4f4f5] text-[#09090b] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Войти
                            </button>
                            <button
                                formAction={signup}
                                className="w-full bg-transparent border border-white/10 text-[#f4f4f5] font-semibold py-3 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                Зарегистрироваться
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
