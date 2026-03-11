import Link from "next/link";
import { QrCode, Heart, ShieldCheck, Map, Shovel, Paintbrush, BookOpen, Dna, WifiOff, Lock, Mail, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* ─── HERO ─── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 lg:px-24 pt-24 pb-16 relative">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,175,55,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(45,55,72,0.15) 0%, transparent 50%)'
        }} />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] font-semibold text-sm mb-8 animate-fade-in">
            Цифровой архив Казахстана
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-foreground mb-2 leading-[1.05]">
            Цифровая Память
          </h1>
          <p className="text-xl lg:text-2xl text-foreground/50 font-medium mb-8">
            Зиратстан — Архив захоронений Казахстана
          </p>

          <p className="text-lg text-foreground/60 max-w-xl mb-10 leading-relaxed">
            Найдите, оцифруйте и сохраните память о близких. Отсканируйте QR-код на надгробии —
            и перед вами откроется полная биография, фотографии и голос человека.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <Link
              href="/map"
              className="flex-1 flex justify-center items-center gap-2 bg-primary text-background px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/20"
            >
              <Map className="w-5 h-5" />
              Открыть карту
            </Link>
            <Link
              href="/profile/test-id"
              className="flex-1 flex justify-center items-center gap-2 border-2 border-primary/20 text-primary bg-transparent px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/5 transition-all"
            >
              <QrCode className="w-5 h-5" />
              Демо QR-профиля
            </Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div className="flex flex-wrap justify-center gap-12 py-16 border-y border-primary/10 px-6">
        {[
          { value: '150+', label: 'Кладбищ в Казахстане' },
          { value: '2M+', label: 'Захоронений для оцифровки' },
          { value: 'PWA', label: 'Работает без интернета' },
          { value: 'QR', label: 'Табличка на каждом надгробии' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-4xl font-extrabold text-accent tracking-tight">{stat.value}</p>
            <p className="text-sm text-foreground/50 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24" id="features">
        <p className="text-center text-accent text-xs font-bold tracking-widest uppercase mb-3">Возможности платформы</p>
        <h2 className="text-center text-3xl lg:text-4xl font-extrabold tracking-tight mb-16">Всё для сохранения памяти</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: QrCode, title: 'QR-Мемориал', desc: 'Уникальный QR-код на надгробной табличке открывает полную страницу памяти: биография, фото, видео, аудио голос.' },
            { icon: Map, title: 'Карта захоронений', desc: 'Интерактивная карта с точными координатами каждой могилы. Геолокация поможет найти нужное место на кладбище.' },
            { icon: Heart, title: 'Уход на расстоянии', desc: 'Закажите уборку, покраску ограды или чтение Корана из любой точки мира. Исполнитель пришлёт фотоотчёт.' },
            { icon: WifiOff, title: 'Работает без интернета', desc: 'PWA-технология позволяет сохранять координаты новых могил даже без связи. Данные синхронизируются автоматически.' },
            { icon: Lock, title: 'Приватные профили', desc: 'Выберите уровень доступа: публичный для всех или приватный — только для семьи по пин-коду.' },
            { icon: Dna, title: 'Генеалогическое древо', desc: 'Свяжите профили между собой. Изучайте историю семьи через поколения с визуальным родословным деревом.' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-primary/5 border border-primary/10 rounded-2xl p-6 transition-all hover:border-accent/25 hover:-translate-y-1">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-primary/10" id="services">
        <p className="text-center text-accent text-xs font-bold tracking-widest uppercase mb-3">Монетизация</p>
        <h2 className="text-center text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Услуги по уходу за могилой</h2>
        <p className="text-center text-foreground/60 max-w-lg mx-auto mb-12">
          Закажите из любой точки мира. Исполнитель пришлёт фотоотчёт «До/После» после выполнения.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shovel, title: 'Уборка могилы', desc: 'Профессиональная уборка территории, прополка, подметание, мытьё памятника.', price: '5 000 ₸', time: '1–2 часа' },
            { icon: Paintbrush, title: 'Покраска ограды', desc: 'Покраска металлической оградки, обновление цвета памятника, нанесение защитного лака.', price: '12 000 ₸', time: '2–4 часа' },
            { icon: BookOpen, title: 'Чтение Корана', desc: 'Приглашение имама для чтения Корана и молитвы у могилы с видео-подтверждением.', price: '8 000 ₸', time: '30–60 минут' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col transition-all hover:border-accent/25 hover:-translate-y-1">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed mb-5 flex-1">{s.desc}</p>
                <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                  <span className="text-xl font-extrabold text-accent">{s.price}</span>
                  <span className="text-xs text-foreground/40">{s.time}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-accent text-background px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-accent/20"
          >
            🤲 Заказать услугу
          </Link>
        </div>
      </section>

      {/* ─── QR SHOWCASE ─── */}
      <section className="max-w-4xl mx-auto px-6 py-24" id="qr">
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center gap-10">
          {/* QR Visual */}
          <div className="w-36 h-36 rounded-2xl bg-white flex-shrink-0 flex items-center justify-center">
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="40" height="40" rx="4" fill="#2d3748" />
              <rect x="12" y="12" width="26" height="26" rx="2" fill="white" />
              <rect x="17" y="17" width="16" height="16" rx="1" fill="#2d3748" />
              <rect x="65" y="5" width="40" height="40" rx="4" fill="#2d3748" />
              <rect x="72" y="12" width="26" height="26" rx="2" fill="white" />
              <rect x="77" y="17" width="16" height="16" rx="1" fill="#2d3748" />
              <rect x="5" y="65" width="40" height="40" rx="4" fill="#2d3748" />
              <rect x="12" y="72" width="26" height="26" rx="2" fill="white" />
              <rect x="17" y="77" width="16" height="16" rx="1" fill="#2d3748" />
              <rect x="52" y="52" width="8" height="8" fill="#d4af37" />
              <rect x="63" y="52" width="8" height="8" fill="#2d3748" />
              <rect x="74" y="52" width="8" height="8" fill="#2d3748" />
              <rect x="85" y="52" width="8" height="8" fill="#d4af37" />
              <rect x="52" y="63" width="8" height="8" fill="#2d3748" />
              <rect x="52" y="74" width="8" height="8" fill="#d4af37" />
              <rect x="63" y="74" width="8" height="8" fill="#2d3748" />
              <rect x="74" y="74" width="8" height="8" fill="#d4af37" />
              <rect x="85" y="74" width="8" height="8" fill="#2d3748" />
              <rect x="85" y="85" width="8" height="8" fill="#d4af37" />
              <rect x="74" y="85" width="8" height="8" fill="#2d3748" />
              <rect x="63" y="85" width="8" height="8" fill="#d4af37" />
              <rect x="52" y="85" width="8" height="8" fill="#2d3748" />
            </svg>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-3">От камня к истории 📲</h2>
            <p className="text-foreground/60 leading-relaxed mb-6">
              Одно движение камерой — и перед вами открывается вся жизнь человека.
              Фотографии, биография, воспоминания близких, аудиозаписи голоса.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'Наведите камеру телефона на QR-код',
                'Откроется страница памяти с биографией',
                'Оставьте соболезнование или закажите уход',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="text-center py-24 px-6 border-t border-primary/10" id="contact">
        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Готовы сохранить память навечно?</h2>
        <p className="text-foreground/60 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
          Свяжитесь с нами для оцифровки кладбищ вашего города или заказа QR-табличек оптом.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <Link href="/map" className="inline-flex items-center gap-2 bg-primary text-background px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20">
            <Map className="w-5 h-5" />
            Открыть карту
          </Link>
          <a href="mailto:info@ziratstan.kz" className="inline-flex items-center gap-2 border border-primary/20 px-8 py-4 rounded-xl font-semibold hover:bg-primary/5 transition-all">
            <Mail className="w-5 h-5" />
            info@ziratstan.kz
          </a>
          <a href="https://wa.me/77770000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent text-background px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20">
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="text-center py-10 px-6 border-t border-primary/10">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/map" className="text-sm text-foreground/50 hover:text-foreground transition-colors">Карта</Link>
          <Link href="/services" className="text-sm text-foreground/50 hover:text-foreground transition-colors">Услуги</Link>
          <Link href="/admin/qr" className="text-sm text-foreground/50 hover:text-foreground transition-colors">QR-Генератор</Link>
          <Link href="/profile/test-id" className="text-sm text-foreground/50 hover:text-foreground transition-colors">Демо</Link>
        </div>
        <p className="mb-1">
          <strong><span className="text-accent">З</span>иратстан</strong> — Цифровой архив захоронений Казахстана
        </p>
        <p className="text-sm text-foreground/40">Память о близких живёт вечно · © 2025</p>
      </footer>
    </main>
  );
}
