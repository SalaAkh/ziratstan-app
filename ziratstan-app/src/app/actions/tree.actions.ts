'use server'

import { createClient } from '@/utils/supabase/server'

export type TreeProfile = {
    id: string
    first_name: string
    last_name: string | null
    birth_date: string | null
    death_date: string | null
    main_photo_url: string | null
}

export type TreeRelation = {
    id: string
    profile_id_1: string
    profile_id_2: string
    relation_type: 'parent' | 'child' | 'spouse' | 'sibling'
    profile1?: TreeProfile
    profile2?: TreeProfile
}

export async function getFamilyTree(profileId: string) {
    const supabase = await createClient()

    // In a robust genealogy app, this would be a recursive CTE (GraphQL/PostgreSQL).
    // For standard V1: 1 degree of separation (parents, children, spouses, siblings).

    // 1. Get the main profile
    const { data: mainProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, birth_date, death_date, main_photo_url')
        .eq('id', profileId)
        .single()

    if (!mainProfile) {
        return null
    }

    // 2. Get relations where profileId is either side
    const { data: relations } = await supabase
        .from('profile_relations')
        .select(`
      id, profile_id_1, profile_id_2, relation_type,
      profile1:profiles!profile_relations_profile_id_1_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url),
      profile2:profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)
    `)
        .or(`profile_id_1.eq.${profileId},profile_id_2.eq.${profileId}`)

    return {
        mainProfile: mainProfile as TreeProfile,
        relations: (relations || []) as unknown as TreeRelation[]
    }
}
