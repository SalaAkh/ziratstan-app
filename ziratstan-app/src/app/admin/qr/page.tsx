import { createClient } from '@/utils/supabase/server'
// Import the newly created client component
import QrGeneratorClient from './QrGeneratorClient'

export const metadata = {
    title: 'QR Генератор | Админ Зиратстан',
    description: 'Создание QR-кодов для мемориальных табличек',
}

export default async function AdminQrPage() {
    const supabase = await createClient()

    // Fetch recent profiles for the dropdown
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, patronymic')
        .order('created_at', { ascending: false })
        .limit(100)

    return <QrGeneratorClient initialProfiles={profiles || []} />
}
