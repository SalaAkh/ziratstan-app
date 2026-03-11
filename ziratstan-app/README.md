# ziratstan-app

Отдельное приложение Ziratstan на `Next.js 16` + `React 19` + `Tailwind CSS 4`.

Это не корневой production-хостинг Firebase, а самостоятельная версия интерфейса в папке `ziratstan-app/`. По структуре она повторяет основные пользовательские сценарии проекта: поиск, карта, профиль, QR, услуги, кабинет и admin QR.

## Запуск

Установить зависимости и поднять dev-сервер:

```bash
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:3000`.

## Переменные окружения

Сейчас приложение ожидает как минимум:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Они используются в клиенте и server-side утилитах Supabase.

## Основные маршруты

- `/` — главная страница
- `/search` — поиск по профилям
- `/map` — карта захоронений
- `/profile/[id]` — страница профиля
- `/profile/[id]/tree` — схема родословной
- `/qr/[slug]` — генерация QR
- `/services` — услуги
- `/login` — вход (соответствует `auth-modal` на прод-контуре)
- `/cabinet` — кабинет пользователя (соответствует `dashboard.html` на прод-контуре)
- `/admin/qr` — админская генерация QR

## Структура

- `src/app/` — маршруты App Router, layout и server actions
- `src/components/` — UI, карта и family tree
- `src/lib/` и `src/utils/supabase/` — клиенты Supabase для browser/server/middleware
- `public/` — статические ассеты

## Технологии

- `next@16`
- `react@19`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `leaflet` + `react-leaflet`
- `@xyflow/react` + `dagre`
- `next-pwa`

## Команды

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Авторизация и приватность

В корневом прод-контуре реализована система авторизации через Supabase Auth:
- Модуль `src/js/auth/supabase-auth.js` — login/register/logout/session
- Страница `dashboard.html` — личный кабинет
- Supabase RLS — `owner_id` + `visibility` (`public`/`family_only`/`private`) на таблице `deceased`

В Next.js-контуре (`/login`, `/cabinet`) используется аналогичная Supabase Auth логика через `@supabase/ssr`.

## Примечание по репозиторию

В корне репозитория есть реализация тех же сценариев на статических HTML и vanilla JS. Эта папка нужна для Next.js-версии приложения и документируется отдельно от корневого [README.md](../README.md).
