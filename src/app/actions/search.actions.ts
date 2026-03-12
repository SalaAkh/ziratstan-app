'use server'

import { createClient } from '@/utils/supabase/server'

export type SearchResult = {
    id: string
    first_name: string
    last_name: string | null
    patronymic: string | null
    birth_date: string | null
    death_date: string | null
    main_photo_url: string | null
    cemeteries: {
        name: string
        city: string
    } | null
}

export async function globalSearch(query: string, page: number = 1, limit: number = 20) {
    if (!query || query.trim() === '') {
        return { data: [], count: 0 }
    }

    const supabase = await createClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Use ILIKE for partial matching on multiple fields (first_name, last_name)
    // In a real production setup with millions of rows, Full Text Search (to_tsvector) or Edge Functions with pgvector/Typesense might be needed.
    // For standard partial match:
    const searchTerm = `%${query}%`

    const { data, count, error } = await supabase
        .from('profiles')
        .select(`
      id,
      first_name,
      last_name,
      patronymic,
      birth_date,
      death_date,
      main_photo_url,
      cemeteries ( name, city )
    `, { count: 'exact' })
        .eq('visibility_status', 'public')
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},patronymic.ilike.${searchTerm}`)
        .order('last_name', { ascending: true })
        .range(from, to)

    if (error) {
        console.error('Search error:', error)
        return { data: [], count: 0, error: error.message }
    }

    return { data: (data as unknown) as SearchResult[], count: count || 0 }
}
