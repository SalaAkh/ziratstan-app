import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Карта Захоронений',
    description: 'Интерактивная карта кладбищ Казахстана. Найдите могилу по имени или определите своё местоположение GPS.',
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
