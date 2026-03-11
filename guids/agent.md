# Ziratstan.kz — актуальный гайд по проекту

## Суть проекта

Ziratstan.kz — платформа для поиска захоронений, публикации мемориальных профилей, QR-мемориалов и заказа услуг по уходу за могилами в Казахстане.

В проекте сейчас одновременно существуют два контура:

1. Основной прод-контур — статический сайт в корне репозитория, который деплоится на Firebase Hosting.
2. Параллельный Next.js-контур — App Router код в `src/` и отдельный workspace `ziratstan-app/`, который отражает направление миграции/развития продукта.

Из-за этого нельзя описывать репозиторий как "только Vanilla JS" или "полностью без Next.js" — это уже не соответствует реальному состоянию.

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

### Контур Next.js

В репозитории есть Next.js/App Router код:

- [src/app](d:/User/Desktop/Programms/Ziratstan.kz/src/app)
- [src/components](d:/User/Desktop/Programms/Ziratstan.kz/src/components)
- [src/lib](d:/User/Desktop/Programms/Ziratstan.kz/src/lib)
- [ziratstan-app](d:/User/Desktop/Programms/Ziratstan.kz/ziratstan-app)

На текущий момент этот контур не является тем, что публикуется в Firebase Hosting из корня. В [firebase.json](d:/User/Desktop/Programms/Ziratstan.kz/firebase.json) папка `ziratstan-app/**` явно исключена из деплоя.

---

## Система авторизации (NEW — март 2026)

В прод-контуре реализована полноценная система **User Auth + Row Level Security**:

### Файлы

| Файл | Назначение |
|---|---|
| `src/js/auth/supabase-auth.js` | Модуль авторизации: login/register/logout/session/UI |
| `dashboard.html` | Личный кабинет: мои профили, видимость, настройки |
| `supabase/migrations/20260312_user_auth_rls.sql` | SQL-миграция: таблицы + RLS политики |

### Схема безопасности

```
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
|-- index.html              (лендинг + auth modal)
|-- map.html
|-- profile.html
|-- qr.html
|-- services.html
|-- admin.html
|-- dashboard.html          ← НОВЫЙ (личный кабинет)
|-- 404.html
|-- data/
|   |-- cemeteries_data.js
|   |-- profiles_data.js
|-- assets/
|   |-- images/
|-- src/
|   |-- js/
|   |   |-- core/
|   |   |   |-- i18n.js
|   |   |   `-- locales.js
|   |   `-- auth/
|   |       `-- supabase-auth.js   ← НОВЫЙ (auth модуль)
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   `-- utils/
|-- public/
|   |-- data/profiles/*.json
|   `-- icons/, manifest, assets
|-- functions/
|   |-- index.js
|   `-- package.json
|-- supabase/
|   |-- client.js
|   |-- schema.sql
|   |-- migrations/
|   |   `-- 20260312_user_auth_rls.sql   ← НОВЫЙ (RLS)
|   `-- *.sql
|-- testsprite_tests/
|   `-- e2e/python test cases
|-- ziratstan-app/
|   `-- отдельный Next.js workspace
`-- guids/agent.md
```

---

## Технологический стек

| Слой | Текущее состояние |
| --- | --- |
| Прод-фронтенд | Статические HTML/CSS/JS страницы в корне |
| Авторизация | Supabase Auth (email+пароль) via `supabase-auth.js` |
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

### Статический контур

```bash
# Локальный запуск
python -m http.server 3000

# Деплой прод-контура
firebase deploy --only hosting
```

### Firebase Functions

Если меняются функции, нужен отдельный деплой функций.

### Next.js workspace

```bash
cd ziratstan-app
npm install
npm run dev
```

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

Если задача касается **текущего сайта** → смотри в корневые HTML/JS-файлы, `src/js/`.

Если задача касается **авторизации или кабинета** → `src/js/auth/supabase-auth.js`, `dashboard.html`, `supabase/migrations/`.

Если задача касается **новой архитектуры, дерева, server actions** → `src/app/`, `ziratstan-app/`.

Если задача касается **модерации, ролей, bootstrap** → `functions/index.js` и Supabase SQL.
