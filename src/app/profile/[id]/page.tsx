import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Heart, BookOpen, Music, ImageIcon, Network } from "lucide-react";

import { supabase } from "@/lib/supabase";
import ShareButton from "@/components/ui/ShareButton";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15+: params — это Promise, нужно await
    const { id: profileId } = await params;

    let profile = null;
    let mediaItems: { id: string; media_type: string; file_url: string; title: string | null }[] = [];

    // Пытаемся получить профиль из Supabase по ID
    if (profileId !== 'test-id') {
        const { data, error } = await supabase
            .from('profiles')
            .select('*, cemeteries(name, city)')
            .eq('id', profileId)
            .single();

        if (!error && data) {
            profile = data;

            // Загружаем медиа-вложения
            const { data: media } = await supabase
                .from('media_attachments')
                .select('id, media_type, file_url, title')
                .eq('profile_id', profileId)
                .order('uploaded_at', { ascending: false });

            if (media) {
                mediaItems = media;
            }
        }
    }

    // Fallback на mock-данные для демо или если не найдено в БД
    const mockProfile = profile || {
        firstName: "Динмухамед",
        patronymic: "Ахмедович",
        lastName: "Кунаев",
        birthDate: "12.01.1912",
        deathDate: "22.08.1993",
        cemetery: "Кенсай-1",
        city: "Алматы",
        epitaph: "\"Менің өмірім – халқымның өмірі\" (Моя жизнь – жизнь моего народа)",
        biography: "Советский партийный и государственный деятель, Первый секретарь ЦК Компартии Казахстана. Трижды Герой Социалистического Труда. Внес огромный вклад в развитие экономики и культуры Казахстана.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Dinmukhamed_Kunayev_1982.jpg",
    };

    // Mock-медиа для демо профиля
    const mockMedia = profileId === 'test-id' ? [
        { id: 'mock-1', media_type: 'image', file_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Dinmukhamed_Kunayev_1982.jpg', title: 'Официальное фото, 1982' },
        { id: 'mock-2', media_type: 'image', file_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Dinmuhamed_Kunayev_and_Leonid_Brezhnev_1981.jpg/800px-Dinmuhamed_Kunayev_and_Leonid_Brezhnev_1981.jpg', title: 'С Л.И. Брежневым, 1981' },
    ] : [];

    const displayMedia = mediaItems.length > 0 ? mediaItems : mockMedia;

    // Адаптируем данные под UI в зависимости от того, откуда они пришли
    const isRealData = !!profile;
    const firstName = isRealData ? profile.first_name : mockProfile.firstName;
    const lastName = isRealData ? profile.last_name : mockProfile.lastName;
    const patronymic = isRealData ? profile.patronymic : mockProfile.patronymic;
    const birthDate = isRealData ? profile.birth_date : mockProfile.birthDate;
    const deathDate = isRealData ? profile.death_date : mockProfile.deathDate;
    const city = isRealData ? profile.cemeteries?.city || 'Неизвестно' : mockProfile.city;
    const cemeteryName = isRealData ? profile.cemeteries?.name || 'Неизвестно' : mockProfile.cemetery;
    const photoUrl = isRealData ? (profile.main_photo_url || '/placeholder.jpg') : mockProfile.photoUrl;
    const epitaph = isRealData ? profile.epitaph : mockProfile.epitaph;
    const biography = isRealData ? profile.biography : mockProfile.biography;

    const fullName = `${lastName} ${firstName} ${patronymic || ''} `.trim();

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header / Hero Section (Главное фото) */}
            <div className="relative h-[50vh] w-full">
                {/* Градиент для затемнения фона, чтобы текст читался лучше */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />

                {/* Можно использовать реальное фото или заглушку */}
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center overflow-hidden">
                    <Image
                        src={photoUrl}
                        alt={`${firstName} ${lastName} `}
                        fill
                        className="object-cover opacity-80"
                        unoptimized // Для Википедии
                    />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20 flex flex-col gap-2">
                    <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                        {lastName} <br />
                        <span className="text-accent">{firstName} {patronymic}</span>
                    </h1>
                    <div className="flex items-center gap-2 text-foreground/80 font-medium text-lg mt-2">
                        <Calendar className="w-5 h-5 text-accent" />
                        <span>{birthDate} — {deathDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground/80 mt-1">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>{city}, {cemeteryName}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 lg:px-12 mt-8 space-y-12">
                {/* Эпитафия */}
                <section className="text-center italic text-xl lg:text-3xl font-serif text-foreground/70 relative">
                    <span className="text-accent text-6xl absolute -top-6 -left-4 opacity-30">&quot;</span>
                    {epitaph}
                    <span className="text-accent text-6xl absolute -bottom-10 -right-4 opacity-30">&quot;</span>
                </section>

                {/* Action Buttons */}
                <section className="flex flex-wrap justify-center gap-4 border-y border-primary/10 py-6">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-background rounded-full font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                        <Heart className="w-5 h-5" />
                        <span>Оставить соболезнование</span>
                    </button>
                    <Link href={`/ profile / ${profileId} /tree`} className="flex items-center gap-2 px-6 py-3 bg-transparent border border-primary/20 text - foreground rounded - full font - medium hover: bg - primary / 5 transition - colors">
                        < Network className="w-5 h-5 text-accent" />
                        <span>Генеалогическое древо</span>
                    </Link >
                    <ShareButton
                        title={`${fullName} — Зиратстан`}
                        text={`Мемориальная страница: ${fullName}. ${epitaph || ''}`}
                    />
                </section >

                {/* Biography */}
                < section >
                    <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
                        <BookOpen className="w-6 h-6 text-accent" />
                        Биография
                    </h2>
                    <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
                        {biography}
                    </p>
                </section >

                {/* Media Gallery */}
                {
                    displayMedia.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                                <ImageIcon className="w-6 h-6 text-accent" />
                                Фотогалерея
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {displayMedia
                                    .filter(m => m.media_type === 'image')
                                    .map((m) => (
                                        <div key={m.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-primary/10">
                                            <Image
                                                src={m.file_url}
                                                alt={m.title || 'Фотография'}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                            {m.title && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                                    <p className="text-white text-sm font-medium">{m.title}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </section>
                    )
                }

                {/* Memory Audio/Video */}
                <section className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                    <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
                        <Music className="w-6 h-6 text-accent" />
                        Голос памяти
                    </h2>
                    <p className="text-foreground/70 mb-4">
                        Послушайте аудиозапись, оставленную близкими, или реальный голос человека.
                    </p>
                    <div className="bg-background rounded-full p-2 flex items-center gap-4">
                        <button className="w-12 h-12 bg-accent text-background rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            ▶
                        </button>
                        <div className="flex-1 h-2 bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-accent rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium mr-4 text-foreground/50">0:42</span>
                    </div>
                </section>
            </div >
        </div >
    );
}
