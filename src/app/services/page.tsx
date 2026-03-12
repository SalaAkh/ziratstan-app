'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Shovel, Paintbrush, BookOpen, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { createServiceOrder } from '@/app/actions/services.actions';

const SERVICES = [
    {
        id: 'cleaning',
        icon: Shovel,
        title: 'Уборка могилы',
        description: 'Уборка территории, прополка и очистка памятника.',
        price: 5000,
        duration: '1–2 часа',
    },
    {
        id: 'painting',
        icon: Paintbrush,
        title: 'Покраска ограды',
        description: 'Покраска металлической ограды и обновление памятника.',
        price: 12000,
        duration: '2–4 часа',
    },
    {
        id: 'quran',
        icon: BookOpen,
        title: 'Чтение Корана',
        description: 'Приглашение имама для молитвы и чтения Корана.',
        price: 8000,
        duration: '30–60 минут',
    },
];

export default function ServicesPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        profileId: '',
        comment: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedService = SERVICES.find((service) => service.id === selected);

    const handleSubmit = async () => {
        if (!selectedService) return;

        setSubmitting(true);
        setError(null);

        const result = await createServiceOrder({
            customerName: form.name,
            customerPhone: form.phone,
            customerEmail: form.email,
            serviceType: selectedService.id === 'quran' ? 'quran_reading' : selectedService.id,
            price: selectedService.price,
            profileId: form.profileId,
            comment: form.comment || undefined,
        });

        if (!result.success) {
            setSubmitting(false);
            setError(result.error || 'Не удалось оформить заказ. Попробуйте снова.');
            return;
        }

        setSubmitting(false);
        setStep('success');
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Заказ принят</h1>
                    <p className="text-foreground/70 text-lg mb-8">
                        Мы сохранили заявку и привязали её к вашему email. Статус заказа будет доступен в кабинете.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-primary text-background px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all"
                    >
                        На главную
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-primary/5 border-b border-primary/10 px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Услуги по уходу за могилой</h1>
                    <p className="text-foreground/70">
                        Закажите услугу и отслеживайте её статус в личном кабинете.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {step === 'select' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {SERVICES.map((service) => {
                                const Icon = service.icon;
                                const isSelected = selected === service.id;

                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelected(service.id)}
                                        className={`text-left p-6 rounded-2xl border-2 transition-all ${
                                            isSelected
                                                ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                                                : 'border-primary/10 bg-primary/5 hover:border-primary/30'
                                        }`}
                                    >
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                                                isSelected ? 'bg-accent text-background' : 'bg-primary/10 text-foreground'
                                            }`}
                                        >
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                                        <p className="text-sm text-foreground/60 mb-4">{service.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-accent font-bold text-lg">
                                                {service.price.toLocaleString()} ₸
                                            </span>
                                            <span className="text-xs text-foreground/40">{service.duration}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <button
                                disabled={!selected}
                                onClick={() => setStep('form')}
                                className="flex items-center gap-2 bg-primary text-background px-8 py-4 rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition-all"
                            >
                                Далее
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}

                {step === 'form' && selectedService && (
                    <div className="max-w-lg mx-auto">
                        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                                <selectedService.icon className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="font-bold">{selectedService.title}</p>
                                <p className="text-accent text-sm">{selectedService.price.toLocaleString()} ₸</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Ваше имя</label>
                                <input
                                    type="text"
                                    placeholder="Алихан Серикулы"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Телефон</label>
                                <input
                                    type="tel"
                                    placeholder="+7 707 000 00 00"
                                    value={form.phone}
                                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email для кабинета</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">UUID профиля или QR slug</label>
                                <input
                                    type="text"
                                    placeholder="UUID или ZRT-XXXXXX"
                                    value={form.profileId}
                                    onChange={(e) => setForm((prev) => ({ ...prev, profileId: e.target.value }))}
                                    className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Комментарий</label>
                                <textarea
                                    placeholder="Дополнительные пожелания исполнителю..."
                                    rows={3}
                                    value={form.comment}
                                    onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                                    className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 border border-primary/10 rounded-xl py-4 font-medium hover:bg-primary/5 transition-all"
                            >
                                Назад
                            </button>
                            <button
                                disabled={!form.name || !form.phone || !form.email || !form.profileId || submitting}
                                onClick={handleSubmit}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary text-background rounded-xl py-4 font-bold disabled:opacity-40 hover:opacity-90 transition-all"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Отправка...
                                    </>
                                ) : (
                                    'Оформить заказ'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
