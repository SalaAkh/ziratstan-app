import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'QR-Генератор табличек',
    description: 'Создайте QR-код для надгробной таблички. Скачайте PNG или распечатайте для гравировки.',
};

export default function QRLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
