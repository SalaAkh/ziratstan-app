import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Heart, BookOpen, Music, ImageIcon, MapPin, Network } from 'lucide-react';
import { notFound } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import ShareButton from '@/components/ui/ShareButton';

type ProfileRow = {
    id: string;
    first_name: string;
    last_name: string | null;
    patronymic: string | null;
    birth_date: string | null;
    death_date: string | null;
    epitaph: string | null;
    biography: string | null;
    main_photo_url: string | null;
    visibility_status: 'public' | 'private' | 'family_only';
    cemeteries: { name: string | null; city: string | null } | { name: string | null; city: string | null }[] | null;
};

type MediaItem = {
    id: string;
    media_type: string;
    file_url: string;
    title: string | null;
};

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: profileId } = await params;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, visibility_status, cemeteries(name, city)')
        .eq('id', profileId)
        .eq('visibility_status', 'public')
        .maybeSingle();

    if (error || !profile) {
        notFound();
    }

    const { data: media } = await supabase
        .from('media_attachments')
        .select('id, media_type, file_url, title')
        .eq('profile_id', profileId)
        .order('uploaded_at', { ascending: false });

    const memorial = profile as ProfileRow;
    const mediaItems = (media || []) as MediaItem[];
    const cemetery = Array.isArray(memorial.cemeteries) ? memorial.cemeteries[0] : memorial.cemeteries;

    const firstName = memorial.first_name || '';
    const lastName = memorial.last_name || '';
    const patronymic = memorial.patronymic || '';
    const fullName = [lastName, firstName, patronymic].filter(Boolean).join(' ').trim();
    const cemeteryCity = cemetery?.city || 'Неизвестно';
    const cemeteryName = cemetery?.name || 'Неизвестно';
    const photoUrl = memorial.main_photo_url || '/favicon.ico';

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="relative h-[50vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center overflow-hidden">
                    <Image src={photoUrl} alt={fullName || 'Мемориал'} fill className="object-cover opacity-80" />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20 flex flex-col gap-2">
                    <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                        {lastName}
                        <br />
                        <span className="text-accent">
                            {firstName} {patronymic}
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 text-foreground/80 font-medium text-lg mt-2">
                        <Calendar className="w-5 h-5 text-accent" />
                        <span>{memorial.birth_date || '—'} — {memorial.death_date || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80 mt-1">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>{cemeteryCity}, {cemeteryName}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 lg:px-12 mt-8 space-y-12">
                {memorial.epitaph && (
                    <section className="text-center italic text-xl lg:text-3xl font-serif text-foreground/70 relative">
                        <span className="text-accent text-6xl absolute -top-6 -left-4 opacity-30">&quot;</span>
                        {memorial.epitaph}
                        <span className="text-accent text-6xl absolute -bottom-10 -right-4 opacity-30">&quot;</span>
                    </section>
                )}

                <section className="flex flex-wrap justify-center gap-4 border-y border-primary/10 py-6">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-background rounded-full font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        <Heart className="w-5 h-5" />
                        <span>Оставить соболезнование</span>
                    </button>
                    <Link
                        href={`/profile/${profileId}/tree`}
                        className="flex items-center gap-2 px-6 py-3 border border-primary/20 rounded-full font-medium hover:bg-primary/5 transition-colors"
                    >
                        <Network className="w-5 h-5 text-accent" />
                        <span>Генеалогическое древо</span>
                    </Link>
                    <ShareButton
                        title={`${fullName} — Зиратстан`}
                        text={`Мемориальная страница: ${fullName}. ${memorial.epitaph || ''}`}
                    />
                </section>

                <section>
                    <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
                        <BookOpen className="w-6 h-6 text-accent" />
                        Биография
                    </h2>
                    <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
                        {memorial.biography || 'Биография пока не заполнена.'}
                    </p>
                </section>

                {mediaItems.some((item) => item.media_type === 'image') && (
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                            <ImageIcon className="w-6 h-6 text-accent" />
                            Фотогалерея
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {mediaItems
                                .filter((item) => item.media_type === 'image')
                                .map((item) => (
                                    <div key={item.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-primary/10">
                                        <Image
                                            src={item.file_url}
                                            alt={item.title || 'Фотография'}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {item.title && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                                <p className="text-white text-sm font-medium">{item.title}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </section>
                )}

                <section className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                    <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
                        <Music className="w-6 h-6 text-accent" />
                        Голос памяти
                    </h2>
                    <p className="text-foreground/70">
                        Здесь будет доступен аудиофрагмент воспоминаний семьи.
                    </p>
                </section>
            </div>
        </div>
    );
}
