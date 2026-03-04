'use server';

import { supabase } from '@/lib/supabase';

interface ServiceOrderInput {
    customerName: string;
    customerPhone: string;
    serviceType: string;  // 'cleaning' | 'painting' | 'quran_reading'
    price: number;
    profileId?: string;
    comment?: string;
}

/**
 * Создаёт заказ на услугу по уходу за могилой.
 * Записывает в таблицу services_orders в Supabase.
 */
export async function createServiceOrder(input: ServiceOrderInput) {
    const { data, error } = await supabase
        .from('services_orders')
        .insert([
            {
                customer_name: input.customerName,
                customer_phone: input.customerPhone,
                service_type: input.serviceType,
                price: input.price,
                profile_id: input.profileId || null,
                report_notes: input.comment || null,
            },
        ])
        .select();

    if (error) {
        console.error('Ошибка создания заказа:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data?.[0] || null };
}
