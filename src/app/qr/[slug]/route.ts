import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * GET /qr/ZRT-1234
 * Ищем slug в таблице qr_codes → редиректим на /profile/{profile_id}
 * Это главная точка входа при сканировании QR-таблички на надгробии
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const normalizedSlug = String(slug || '').trim().toUpperCase();

    const { data, error } = await supabase
        .from('qr_codes')
        .select('profile_id, status')
        .eq('slug', normalizedSlug)
        .single();

    if (error || !data) {
        // QR-код не найден — редиректим на 404
        redirect('/not-found');
    }

    if (data.status !== 'active') {
        // QR-код деактивирован
        redirect('/not-found');
    }

    // Редирект на профиль усопшего
    redirect(`/profile/${data.profile_id}`);
}
