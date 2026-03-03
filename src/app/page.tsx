import Link from "next/link";
import { QrCode, Search, Heart, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 lg:p-24 bg-background">
      {/* Hero Section */}
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-center mt-12 lg:mt-24">
        <div className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent font-medium mb-6">
          Бисмиллях • Қазақстан
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
          Зиратстан <br />
          <span className="text-primary/70 text-4xl lg:text-5xl">Цифровая Память</span>
        </h1>
        <p className="text-xl text-foreground/70 max-w-2xl mb-12">
          Глобальная платформа для поиска, оцифровки и сохранения памяти об ушедших.
          Наведите камеру на QR-код на надгробии — и перед вами откроется целая жизнь.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/profile/test-id"
            className="flex-1 flex justify-center items-center gap-2 bg-primary text-background px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            <QrCode className="w-5 h-5" />
            Демо Профиля
          </Link>
          <button className="flex-1 flex justify-center items-center gap-2 border-2 border-primary/20 text-primary bg-transparent px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary/5 transition-all">
            <Search className="w-5 h-5" />
            Поиск
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mt-32">
        <div className="flex flex-col items-center text-center p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-background mb-6">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Технология Памяти</h3>
          <p className="text-foreground/70">
            Сканируйте QR-коды на памятниках, чтобы мгновенно увидеть детальную биографию, фото и услышать голос.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-background mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Уход на расстоянии</h3>
          <p className="text-foreground/70">
            Заказывайте уборку могил и чтение Корана онлайн из любой точки мира с детальными фотоотчетами.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-background mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-3">Вечный Архив</h3>
          <p className="text-foreground/70">
            Надежное облачное хранение всех данных. Интеграция с PWA позволяет сохранять координаты даже без интернета (SurviveKit).
          </p>
        </div>
      </div>
    </main>
  );
}
