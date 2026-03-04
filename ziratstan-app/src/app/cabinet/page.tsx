import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Settings, LogOut, FileText, QrCode } from 'lucide-react'
import { signOut } from '../login/actions'

export default async function CabinetPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch orders by user email
    const { data: orders } = await supabase
        .from('services_orders')
        .select('*, profiles(first_name, last_name)')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Sidebar */}
                <div className="w-full md:w-64 shrink-0">
                    <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 mb-6">
                        <div className="w-16 h-16 bg-[#d4af37]/20 text-[#d4af37] rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="font-bold text-lg truncate" title={user.email}>{user.email}</h2>
                        <p className="text-[#71717a] text-sm">Пользователь</p>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <Link href="/cabinet" className="flex items-center gap-3 px-4 py-3 bg-white/5 text-[#d4af37] rounded-xl font-medium">
                            <User size={18} /> Мой профиль
                        </Link>
                        <Link href="/admin/qr" className="flex items-center gap-3 px-4 py-3 text-[#71717a] hover:bg-white/5 hover:text-[#f4f4f5] rounded-xl transition-colors font-medium">
                            <QrCode size={18} /> QR-генератор
                        </Link>
                        <form action={signOut}>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors font-medium">
                                <LogOut size={18} /> Выйти
                            </button>
                        </form>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-8">

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="text-[#d4af37]" /> Мои Мемориалы
                            </h2>
                            <button className="bg-[#d4af37] text-[#09090b] px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                                + Создать профиль
                            </button>
                        </div>

                        <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🪦</div>
                            <h3 className="font-semibold mb-2">У вас пока нет профилей</h3>
                            <p className="text-[#71717a] text-sm max-w-sm mx-auto mb-6">
                                Создайте цифровой мемориал для вашего близкого, чтобы сохранить память и историю навсегда.
                            </p>
                            <button className="text-[#d4af37] font-semibold text-sm hover:underline">
                                Инструкция по созданию →
                            </button>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Settings className="text-[#d4af37]" /> Заказы на услуги
                        </h2>

                        {orders && orders.length > 0 ? (
                            <div className="grid gap-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold bg-white/10 px-2 py-0.5 rounded text-xs">
                                                    {order.service_type === 'cleaning' ? '🧹 Уборка' : order.service_type === 'painting' ? '🎨 Покраска' : '📖 Коран'}
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {order.profiles ? `${order.profiles.first_name} ${order.profiles.last_name || ''}` : 'Неизвестный профиль'}
                                                </span>
                                            </div>
                                            <p className="text-[#71717a] text-sm">
                                                Заказ от {new Date(order.created_at).toLocaleDateString('ru-RU')} • {order.price} ₸
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                                    order.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                                                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                                            'bg-[#d4af37]/10 text-[#d4af37]'
                                                }`}>
                                                {order.status === 'completed' ? 'Выполнено' :
                                                    order.status === 'in_progress' ? 'В процессе' :
                                                        order.status === 'cancelled' ? 'Отменено' :
                                                            'Ожидает'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 text-center text-[#71717a] text-sm">
                                Вы еще не заказывали услуги по уходу.
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </div>
    )
}
