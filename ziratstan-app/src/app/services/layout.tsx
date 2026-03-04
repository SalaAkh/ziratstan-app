import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Услуги по уходу за могилой',
    description: 'Закажите уборку, покраску или чтение Корана у могилы из любого города. Фотоотчёт после выполнения.',
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
