# Ziratstan.kz

**Production URL:** [https://ziratstan-app.web.app/index.html](https://ziratstan-app.web.app/index.html)

Репозиторий проекта `ziratstan.kz` c двумя основными частями:

- корневой сайт на статических HTML-страницах, которые публикуются через Firebase Hosting;
- отдельное приложение `ziratstan-app/` на Next.js 16, где ведется более современная версия интерфейса.

## Что находится в корне

- `index.html`, `map.html`, `profile.html`, `services.html`, `admin.html`, `dashboard.html`, `qr.html` — основные страницы текущего сайта.
- `src/js/` — клиентская логика для карты, профиля, админки и авторизации через Supabase.
  - `src/js/auth/supabase-auth.js` — **модуль авторизации**: login, register, logout, управление сессией, обновление UI.
- `data/` — исходные JS-датасеты (включают расширенный список профилей исторических ханов). В `public-api.js` реализована регистронезависимая обработка UUID/slug для совместимости легаси-роутов.
- `public/data/profiles/` — верифицированные JSON-профили VIP и исторических личностей. Содержат достоверные данные о происхождении (`zhuz`, `tribe`), генеалогии (`shezhire`), и двуязычные биографии. Неподтвержденные профили («фейки») строго удаляются из этой базы для сохранения исторической точности.
- `functions/` — Firebase Functions для admin API.
- `supabase/` — SQL-схемы, миграции и утилиты для базы.
  - `supabase/migrations/20260312_user_auth_rls.sql` — **RLS-миграция**: таблицы `profiles`, `deceased_collaborators`, политики безопасности Row Level Security.
- `scripts/` — скрипты импорта, чистки данных и служебной миграции.
- `testsprite_tests/` — e2e-сценарии для пользовательских потоков.

## Архитектура

Текущий production-хостинг в корне настроен через [firebase.json](firebase.json). В Hosting публикуется весь корень репозитория, при этом из деплоя исключены служебные директории, markdown-файлы, скрипты и `ziratstan-app/`.

Данные и backend сейчас распределены так:

- публичные профили лежат в `public/data/profiles/*.json`;
- часть legacy-данных остается в `data/profiles_data.js` и `data/cemeteries_data.js`;
- **авторизация пользователей** через Supabase Auth (email + пароль) — `src/js/auth/supabase-auth.js`;
- **личный кабинет** — `dashboard.html` (просмотр/управление своими профилями усопших, переключение visibility);
- защищенные admin-endpoint'ы вынесены в Firebase Functions.

## Система авторизации и приватности

Реализована полная система **User Auth + Row Level Security**:

1. **Регистрация / Вход** — модальное окно на `index.html` (вкладки Login / Register).
2. **Dashboard** (`dashboard.html`) — личный кабинет с карточками профилей пользователя.
3. **RLS-политики** в Supabase — каждый `deceased`-профиль имеет `owner_id`. Политики:
   - `SELECT`: публичные профили видны всем, закрытые — только владельцу и коллаборантам.
   - `INSERT/UPDATE/DELETE`: только авторизованный пользователь, только свои записи.
4. **Visibility**: `public` | `family_only` | `private` — переключается в дашборде.
5. **Collaborators**: таблица `deceased_collaborators` позволяет нескольким родственникам управлять одним профилем.

> ⚠️ Перед использованием нужно запустить `supabase/migrations/20260312_user_auth_rls.sql` в Supabase SQL Editor.

## Локальная работа

Для корневого сайта отдельного `npm run dev` сейчас нет. Для локальной проверки:

```bash
firebase emulators:start
```

или любого простого статического сервера, запущенного из корня репозитория.

## Firebase Functions

В [functions/index.js](functions/index.js) реализованы admin API-маршруты:

- `GET /api/admin/bootstrap`
- `GET /api/admin/profiles`
- `POST /api/admin/profiles`
- `POST /api/admin/status`

Для них требуется `SUPABASE_SERVICE_ROLE_KEY`, а доступ ограничен admin-пользователями Supabase с MFA (`aal2`).

## Supabase

В папке `supabase/` лежат:

- `schema.sql` — базовая схема (включает создание схемы `extensions` для PostGIS согласно требованиям безопасности);
- `migrations/` — миграции (включая `20260312_user_auth_rls.sql` — авторизация и RLS, а также `20260315_move_postgis.sql` — исправление RLS для системных таблиц);
- дополнительные SQL-файлы для доработок и безопасности.

> 🛡️ **Важно по безопасности:** Расширения вроде PostGIS и `uuid-ossp` должны устанавливаться строго в схему `extensions` (как прописано в `schema.sql`), а не в `public`. Иначе Supabase Security Advisor будет выдавать критические ошибки об отсутствии RLS на системных гео-таблицах типа `spatial_ref_sys`.

## Скрипты и данные

Подробное описание утилит находится в [scripts/README.md](scripts/README.md).

## Отдельное Next.js-приложение

Папка [ziratstan-app/README.md](ziratstan-app/README.md) описывает отдельное приложение на Next.js 16.
