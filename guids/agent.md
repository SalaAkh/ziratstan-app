# Ziratstan.kz — актуальный гайд по проекту

## Суть проекта

Ziratstan.kz — платформа для поиска захоронений, публикации мемориальных профилей, QR-мемориалов и заказа услуг по уходу за могилами в Казахстане.

В проекте сейчас объединенный контур:

1. **Единый репозиторий**: Стандартизированный Next.js App Router проект в корне (`src/app/`).
2. **Legacy-статика**: Старые HTML-файлы (напр., `index.html`, `map.html`) по-прежнему живут в корне и раздаются через Firebase Hosting.
3. *Архитектурный сдвиг*: Ранее существовала папка `ziratstan-app/` с Next.js, но теперь весь код и зависимости Next.js консолидированы в корне. Папка `ziratstan-app/` устарела и ее можно игнорировать/удалить.

---

## Что сейчас является основным

### Прод

Продакшен-хостинг настроен через [firebase.json](d:/User/Desktop/Programms/Ziratstan.kz/firebase.json) с `public: "."`, то есть основная публикация идет из корня репозитория.

Ключевые страницы прод-контура:

- [index.html](d:/User/Desktop/Programms/Ziratstan.kz/index.html) — лендинг + **auth modal (login/register)**
- [map.html](d:/User/Desktop/Programms/Ziratstan.kz/map.html) — карта захоронений
- [profile.html](d:/User/Desktop/Programms/Ziratstan.kz/profile.html) — профиль человека
- [qr.html](d:/User/Desktop/Programms/Ziratstan.kz/qr.html) — QR-страница
- [services.html](d:/User/Desktop/Programms/Ziratstan.kz/services.html) — услуги
- [admin.html](d:/User/Desktop/Programms/Ziratstan.kz/admin.html) — админка
- [dashboard.html](d:/User/Desktop/Programms/Ziratstan.kz/dashboard.html) — **личный кабинет пользователя** (NEW, март 2026)

### Бэкенд и данные

- Supabase используется как основная база данных.
- Firebase Functions используется как серверный API-слой для админских операций.
- В корне есть статические датасеты и утилиты импорта/миграции.

### Контур Next.js (Основной)

Весь современный стек (Next.js 16, React 19, Tailwind) теперь живёт в корне репозитория:

- `src/app/` — основные роуты
- `src/components/` — React-компоненты
- `src/hooks/`, `src/lib/`, `src/utils/`
- `package.json`, `next.config.ts`, `tsconfig.json` (в корне)

Настройки Firebase Hosting временно откачены к раздаче статики (legacy HTML) из-за тарифных ограничений Blaze-плана на Cloud Functions для Next.js SSR. Однако разработка идет в `src/`.

---

## Система авторизации (NEW — март 2026)

В прод-контуре реализована полноценная система **User Auth + Row Level Security**:

### Файлы

| Файл | Назначение |
| --- | --- |
| `src/js/auth/supabase-auth.js` | Модуль авторизации: login/register/logout/session/UI |
| `dashboard.html` | Личный кабинет: мои профили, видимость, настройки |
| `supabase/migrations/20260312_user_auth_rls.sql` | SQL-миграция: таблицы + RLS политики |

### Настройка Google OAuth (Важные нюансы)
Для корректной работы входа через Google на боевом домене:
1. В Google Cloud Console добавить точный URI: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
2. В Supabase Dashboard (`Authentication -> URL Configuration`) обязательно указать:
   - Site URL: `https://ziratstan-app.web.app/`
   - Redirect URLs: `https://ziratstan-app.web.app/*`
3. Учитывать **Google Server Cache**: обновления ключей в Google Cloud Console могут занимать **от 5 до 60 минут**. Если вы уверены в ключах, но получаете ошибку `400: redirect_uri_mismatch` — подождите.

### Схема безопасности

```text
Supabase Auth → auth.users (встроенная)
           ↓
     public.profiles (расширение пользователя)
           ↓
 public.deceased.owner_id → RLS-политики
           ↓
 public.deceased_collaborators (совместное владение)
```

### RLS-политики (ключевые)

- `SELECT`: `visibility='public'` ИЛИ `owner_id = auth.uid()` ИЛИ пользователь в `deceased_collaborators`
- `INSERT`: только `auth.uid() IS NOT NULL` и `owner_id = auth.uid()`
- `UPDATE/DELETE`: только владелец или editor-коллаборатор

### UI

- **Nav (index.html)**: кнопка `🔑 Кіру / Тіркелу` (gold), при входе — имя + кнопка `Басқару →` + `Шығу`
- **Auth modal**: glassmorphism overlay, вкладки Кіру / Тіркелу, email + пароль, i18n-ошибки

### ⚠️ Важно для агента

Перед тем как создавать/тестировать любую MFA или RLS-логику — **убедиться, что `20260312_user_auth_rls.sql` был применён** в Supabase SQL Editor. Без этого RLS не существует и любой API-запрос пройдет без ограничений.

---

## Структура репозитория

```text
Ziratstan.kz/
|-- package.json            (Общие зависимости Next.js и проекта)
|-- next.config.ts
|-- tsconfig.json
|-- firebase.json
|-- index.html              (legacy лендинг + auth modal)
|-- map.html
|-- dashboard.html          ← НОВЫЙ (личный кабинет)
|-- data/
|   |-- cemeteries_data.js
|   |-- profiles_data.js
|-- assets/
|-- src/
|   |-- app/                ← Next.js App Router (основной код)
|   |-- components/
|   |-- utils/
|   |-- js/                 ← Legacy JavaScript
|   |   |-- core/
|   |   `-- auth/
|   |       `-- supabase-auth.js
|-- public/
|-- functions/
|-- supabase/
|   |-- migrations/
|   |   `-- 20260312_user_auth_rls.sql
|   `-- *.sql
|-- testsprite_tests/
`-- guids/agent.md
```

---

## Технологический стек

| Слой | Текущее состояние |
| --- | --- |
| Прод-фронтенд | Статические HTML/CSS/JS страницы в корне |
| Авторизация | Supabase Auth (email+пароль+Google) via `supabase-auth.js` |
| Локализация | `src/js/core/i18n.js` + `locales.js` |
| База данных | Supabase / PostgreSQL + RLS |
| Серверная логика | Firebase Functions v2 |
| Доп. фронтенд-контур | Next.js 16 + React 19 + TypeScript |
| Карта | Leaflet / React-Leaflet |
| QR | `qrcode` / `react-qrcode-logo` |
| PWA | manifest + next-pwa в Next.js-контуре |

---

## Актуальные важные директории

### Статический контур

- [index.html](d:/User/Desktop/Programms/Ziratstan.kz/index.html) — лендинг + auth modal
- [dashboard.html](d:/User/Desktop/Programms/Ziratstan.kz/dashboard.html) — кабинет **NEW**
- [map.html](d:/User/Desktop/Programms/Ziratstan.kz/map.html)
- [profile.html](d:/User/Desktop/Programms/Ziratstan.kz/profile.html)
- [admin.html](d:/User/Desktop/Programms/Ziratstan.kz/admin.html)
- [services.html](d:/User/Desktop/Programms/Ziratstan.kz/services.html)
- [qr.html](d:/User/Desktop/Programms/Ziratstan.kz/qr.html)

### Auth-модуль

- [src/js/auth/supabase-auth.js](d:/User/Desktop/Programms/Ziratstan.kz/src/js/auth/supabase-auth.js) **NEW**

### Supabase-миграции

- [supabase/migrations/20260312_user_auth_rls.sql](d:/User/Desktop/Programms/Ziratstan.kz/supabase/migrations/20260312_user_auth_rls.sql) **NEW**
- [supabase/schema.sql](d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql)
- [supabase/client.js](d:/User/Desktop/Programms/Ziratstan.kz/supabase/client.js)
- [supabase/admin_security.sql](d:/User/Desktop/Programms/Ziratstan.kz/supabase/admin_security.sql)

### Next.js-контур

- [src/app/page.tsx](d:/User/Desktop/Programms/Ziratstan.kz/src/app/page.tsx)
- [src/app/layout.tsx](d:/User/Desktop/Programms/Ziratstan.kz/src/app/layout.tsx)
- [src/app/map/page.tsx](d:/User/Desktop/Programms/Ziratstan.kz/src/app/map/page.tsx)
- [src/app/profile/[id]/page.tsx](d:/User/Desktop/Programms/Ziratstan.kz/src/app/profile/[id]/page.tsx)
- [src/components/map/GraveMap.tsx](d:/User/Desktop/Programms/Ziratstan.kz/src/components/map/GraveMap.tsx)
- [src/components/tree/FamilyTree.tsx](d:/User/Desktop/Programms/Ziratstan.kz/src/components/tree/FamilyTree.tsx)

### Firebase Functions

- [functions/index.js](d:/User/Desktop/Programms/Ziratstan.kz/functions/index.js)

Сейчас там реализованы админские API-маршруты:

- `GET /admin/bootstrap`
- `GET /admin/profiles`
- `POST /admin/profiles`
- `POST /admin/status`

Авторизация в этих обработчиках завязана на Supabase user session, admin role и `aal2`.

---

## Доменные сущности

Проект опирается на следующие основные сущности:

- `cemeteries` — кладбища
- `deceased` — профили усопших (добавлены `owner_id`, `visibility`) **UPDATED**
- `profiles` — пользователи (расширение auth.users) **NEW**
- `deceased_collaborators` — соавторы профиля **NEW**
- `ugc_submissions` — предложения по исправлению/уточнению данных
- `ugc_profile_submissions` — пользовательские заявки на новые профили
- `ugc_bio_submissions` — дополнения к биографиям
- `qr_codes` — QR-коды и их привязки
- `services_leads` — заявки на услуги
- `profile_relations` — семейные связи для дерева

---

## Тесты и артефакты QA

- [testsprite_tests](d:/User/Desktop/Programms/Ziratstan.kz/testsprite_tests)

Там лежат Python-сценарии для поиска, карты, профилей, QR и сервисных заявок.

---

## Разработка и деплой

### Локальный запуск Next.js

```bash
# Весь код теперь в корне
npm install
npm run dev
```

### Деплой Firebase Hosting (Статика)

```bash
firebase deploy --only hosting
```

*(Next.js Web Frameworks деплой временно приостановлен из-за несовместимости с бесплатным тарифом).*

---

## Что важно помнить при правках

1. Не считать, что проект уже полностью мигрировал на Next.js.
2. При изменениях в прод-части сначала проверять корневые HTML-файлы и [firebase.json](d:/User/Desktop/Programms/Ziratstan.kz/firebase.json).
3. **Файл `supabase/migrations/20260312_user_auth_rls.sql` должен быть применён в Supabase перед тестированием авторизации.**
4. При добавлении новых записей в `deceased` через код — всегда задавать `owner_id = auth.uid()`, иначе RLS заблокирует UPDATE/DELETE.
5. При изменениях в `src/js/auth/supabase-auth.js` — проверять, что `window.ZiratAuth` экспортируется корректно (используется inline в HTML).
6. При изменениях админского API проверять связку Firebase Functions + Supabase auth/role/MFA.

---

## Короткое резюме для агента

Если задача касается **legacy-сайта (HTML)** → смотри в корневые HTML-файлы и `src/js/`.
Если задача касается **новой архитектуры, компонентов** → всё теперь живет в корне: `src/app/`, `src/components/`. Не использовать папку `ziratstan-app/`.
Если задача касается **модерации, ролей, bootstrap** → `functions/index.js` и Supabase SQL.

---

## Admin Auth Troubleshooting (2026-03-13)

Use this checklist when admin sign-in or admin session tracking fails.

1. `scripts/register_admin_email.js` requires `SUPABASE_SERVICE_ROLE_KEY` with service privileges.
2. Do not use `sb_publishable_*` or JWT tokens with payload role `anon`.
3. In Git Bash, set env vars with `export VAR='value'`. In PowerShell, use `$env:VAR='value'`.
4. After running `register_admin_email.js`, force logout/login in admin page to refresh JWT claims.
5. If you see `42501 new row violates row-level security policy for table "admin_sessions"`:
   - verify user has `app_metadata.role = "admin"`;
   - re-login (new token);
   - ensure `supabase/admin_security.sql` is applied.
6. If you see `Failed to register admin email: User not allowed`:
   - key is wrong (usually anon/publishable);
   - replace with real `service_role` / `sb_secret_*` key from Supabase API settings.
7. `AuthSessionMissingError` after failed sign-in means no active session; treat as auth-state fallback, not DB corruption.
8. Security: if keys/password were exposed in terminal/chat logs, rotate keys and reset admin password immediately.

Quick key-role check for JWT-like keys:

```bash
node -e "const t=process.env.SUPABASE_SERVICE_ROLE_KEY||'';const p=t.split('.')[1];if(!p){console.log('non-JWT key format');process.exit(0)};console.log(JSON.parse(Buffer.from(p,'base64url').toString()).role)"
```

Expected for admin scripts: `service_role` (or non-JWT `sb_secret_*` key).
