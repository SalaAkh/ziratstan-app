'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createProfile(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const patronymic = formData.get('patronymic') as string;
    const epitaph = formData.get('epitaph') as string;
    const biography = formData.get('biography') as string;

    const { data, error } = await supabase
        .from('profiles')
        .insert([
            {
                first_name: firstName,
                last_name: lastName,
                patronymic: patronymic,
                epitaph: epitaph,
                biography: biography,
                // Опциональные поля и загрузка файлов пока опущены
            },
        ])
        .select();

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/'); // Обновляем кэш главной после добавления
    return data ? data[0] : null;
}

export async function searchProfiles(query: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, main_photo_url')
        .ilike('last_name', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    return data;
}
