import { getFamilyTree } from '@/app/actions/tree.actions'
import FamilyTree from '@/components/tree/FamilyTree'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;
    const treeData = await getFamilyTree(resolvedParams.id)

    if (!treeData) return { title: 'Древо не найдено | Зиратстан' }

    return {
        title: `Генеалогическое древо — ${treeData.mainProfile.last_name || ''} ${treeData.mainProfile.first_name} | Зиратстан`,
        description: 'Интерактивная визуализация родственных связей и предков.',
    }
}

export default async function ProfileTreePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;
    const treeData = await getFamilyTree(resolvedParams.id)

    if (!treeData) {
        notFound()
    }

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 max-w-7xl mx-auto flex flex-col">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href={`/profile/${resolvedParams.id}`}
                        className="inline-flex items-center gap-2 text-[#71717a] hover:text-[#d4af37] transition-colors mb-2 text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Назад к профилю
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                        Генеалогическое древо
                    </h1>
                    <p className="text-[#d4af37] mt-1 font-semibold">
                        {treeData.mainProfile.last_name || ''} {treeData.mainProfile.first_name}
                    </p>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-sm text-[#71717a] border border-white/10 rounded-xl px-4 py-2 bg-[#111113]">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#d4af37]"></div> Основной</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/20"></div> Родственник</span>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                {treeData.relations.length > 0 ? (
                    <FamilyTree mainProfile={treeData.mainProfile} relations={treeData.relations} />
                ) : (
                    <div className="w-full h-[500px] border border-white/5 bg-[#111113] rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-xl">
                        <div className="text-4xl mb-4">🌳</div>
                        <h3 className="text-xl font-bold mb-2">Древо пока пусто</h3>
                        <p className="text-[#71717a] max-w-md mx-auto mb-6">
                            У этого мемориала еще не отмечены родственные связи. Пользователи с доступом могут добавлять родителей, детей и супругов.
                        </p>
                        <button className="bg-[#d4af37] text-[#09090b] px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            + Добавить родственника
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
