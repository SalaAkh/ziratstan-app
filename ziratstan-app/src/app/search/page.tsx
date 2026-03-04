import Link from 'next/link'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { globalSearch, type SearchResult } from '../actions/search.actions'

export const metadata = {
    title: 'Поиск захоронений | Зиратстан',
    description: 'Найдите место захоронения вашего близкого по всей базе данных Казахстана.',
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const query = typeof params.q === 'string' ? params.q : ''
    const page = typeof params.p === 'string' ? parseInt(params.p, 10) : 1

    let results: SearchResult[] = []
    let totalCount = 0

    if (query) {
        const searchRes = await globalSearch(query, page)
        results = searchRes.data || []
        totalCount = searchRes.count || 0
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Глобальный поиск</h1>
                <p className="text-[#71717a] max-w-2xl mx-auto">
                    Найдите место захоронения родственника. Введите имя, фамилию или отчество.
                </p>
            </div>

            <form className="relative mb-12" action="/search" method="GET">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 text-[#71717a]" size={20} />
                    <input
                        type="text"
                        name="q"
                        defaultValue={query}
                        placeholder="Фамилия Имя Отчество..."
                        className="w-full bg-[#111113] border border-white/10 rounded-2xl py-4 pl-12 pr-32 text-lg text-[#f4f4f5] focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all shadow-xl"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 bg-[#d4af37] text-[#09090b] px-6 rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Найти
                    </button>
                </div>
            </form>

            {query && (
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Результаты по запросу «<span className="text-[#d4af37]">{query}</span>»
                    </h2>
                    <span className="text-[#71717a] text-sm bg-white/5 px-3 py-1 rounded-full">
                        Найдено: {totalCount}
                    </span>
                </div>
            )}

            {query && results.length > 0 && (
                <div className="grid gap-4">
                    {results.map((profile) => (
                        <Link
                            href={`/profile/${profile.id}`}
                            key={profile.id}
                            className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-[#d4af37] font-bold text-xl">
                                {profile.main_photo_url ? (
                                    <Image src={profile.main_photo_url} alt="Photo" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                                ) : (
                                    profile.first_name?.[0] || '?'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate group-hover:text-[#d4af37] transition-colors">
                                    {profile.last_name ? `${profile.last_name} ` : ''}{profile.first_name} {profile.patronymic || ''}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-[#71717a]">
                                    <span>📅 {profile.birth_date ? new Date(profile.birth_date).getFullYear() : '?'} — {profile.death_date ? new Date(profile.death_date).getFullYear() : '?'}</span>
                                    {profile.cemeteries && (
                                        <span>📍 {profile.cemeteries.name}, {profile.cemeteries.city}</span>
                                    )}
                                </div>
                            </div>
                            <div className="hidden sm:flex text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 pr-4">
                                →
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {query && results.length === 0 && (
                <div className="bg-[#111113] border border-white/5 rounded-2xl p-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
                    <p className="text-[#71717a] max-w-sm mx-auto">
                        По вашему запросу «{query}» не найдено ни одного профиля. Попробуйте изменить параметры поиска или ввести только фамилию.
                    </p>
                </div>
            )}

            {!query && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                    <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl text-center">
                        <div className="text-2xl mb-3">📝</div>
                        <h3 className="font-semibold mb-2">Точный поиск</h3>
                        <p className="text-sm text-[#71717a]">Введите точное ФИО для быстрого нахождения профиля</p>
                    </div>
                    <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl text-center">
                        <div className="text-2xl mb-3">📅</div>
                        <h3 className="font-semibold mb-2">Поиск по датам</h3>
                        <p className="text-sm text-[#71717a]">Скоро появится фильтрация по годам жизни</p>
                    </div>
                    <div className="bg-[#111113] border border-white/5 p-6 rounded-2xl text-center">
                        <div className="text-2xl mb-3">📍</div>
                        <h3 className="font-semibold mb-2">Поиск по регионам</h3>
                        <p className="text-sm text-[#71717a]">Скоро появится возможность искать по конкретному кладбищу</p>
                    </div>
                </div>
            )}
        </div>
    )
}
