'use server';

import { createClient } from '@/utils/supabase/server';

interface ServiceOrderInput {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceType: string; // 'cleaning' | 'painting' | 'quran_reading'
    price: number;
    profileId: string;
    comment?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function resolveProfileId(supabase: Awaited<ReturnType<typeof createClient>>, rawValue: string) {
    const value = String(rawValue || '').trim();
    if (!value) return null;
    if (UUID_REGEX.test(value)) return value;

    const { data, error } = await supabase
        .from('qr_codes')
        .select('profile_id, status')
        .eq('slug', value.toUpperCase())
        .maybeSingle();

    if (error || !data || data.status !== 'active') {
        return null;
    }

    return data.profile_id as string;
}

/**
 * Создаёт заказ услуги ухода и сохраняет в services_orders.
 */
export async function createServiceOrder(input: ServiceOrderInput) {
    const supabase = await createClient();
    const auth = await supabase.auth.getUser();

    const customerName = String(input.customerName || '').trim();
    const customerPhone = String(input.customerPhone || '').trim();
    const customerEmail = String(input.customerEmail || auth.data.user?.email || '').trim().toLowerCase();
    const serviceType = String(input.serviceType || '').trim();
    const comment = String(input.comment || '').trim();

    if (!customerName || !customerPhone || !customerEmail || !serviceType) {
        return { success: false, error: 'Заполните обязательные поля заказа.' };
    }

    if (!isValidEmail(customerEmail)) {
        return { success: false, error: 'Введите корректный email для отслеживания заказа в кабинете.' };
    }

    const profileId = await resolveProfileId(supabase, input.profileId);
    if (!profileId) {
        return { success: false, error: 'Профиль не найден. Укажите UUID профиля или активный QR slug.' };
    }

    const { data, error } = await supabase
        .from('services_orders')
        .insert([
            {
                profile_id: profileId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                service_type: serviceType,
                price: input.price,
                report_notes: comment || null,
            },
        ])
        .select('id, profile_id, customer_email, service_type, status, created_at')
        .single();

    if (error) {
        console.error('Service order create error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

