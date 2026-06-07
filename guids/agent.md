# Ziratstan.kz — актуальный гайд по проекту

Обновлено: 2026-06-07 (05:00 UTC+5)

## Суть проекта

Ziratstan.kz — платформа для поиска захоронений, публикации мемориальных профилей, QR-мемориалов и заказа услуг по уходу за могилами в Казахстане.

Проект находится в переходном состоянии. В репозитории одновременно существуют:

1. legacy-frontend на корневых HTML-страницах;
2. новый Next.js App Router-контур в корне через `src/`;
3. дополнительный вложенный контур `ziratstan-app/`;
4. Firebase Hosting / Firebase Functions;
5. Supabase как база данных, auth-слой и часть backend-контрактов.

Главный риск проекта сейчас — не отдельные синтаксические ошибки, а конфликт архитектур, схем данных и runtime-контрактов между legacy-частью, новым Next.js и Supabase-миграциями.

---

## Что сейчас является основным

### Прод-контур

Продакшен-хостинг настроен через [firebase.json](/d:/User/Desktop/Programms/Ziratstan.kz/firebase.json) с `public: "."`, то есть фактическая публикация идет из корня репозитория и опирается на legacy-страницы.

Ключевые страницы текущего прод-контура:

- [index.html](/d:/User/Desktop/Programms/Ziratstan.kz/index.html) — лендинг + auth modal
- [map.html](/d:/User/Desktop/Programms/Ziratstan.kz/map.html) — карта захоронений
- [profile.html](/d:/User/Desktop/Programms/Ziratstan.kz/profile.html) — профиль человека
- [qr.html](/d:/User/Desktop/Programms/Ziratstan.kz/qr.html) — QR-страница
- [services.html](/d:/User/Desktop/Programms/Ziratstan.kz/services.html) — услуги
- [admin.html](/d:/User/Desktop/Programms/Ziratstan.kz/admin.html) — админка
- [dashboard.html](/d:/User/Desktop/Programms/Ziratstan.kz/dashboard.html) — личный кабинет пользователя

### Next.js-контур

Современный стек расположен в корне репозитория:

- `src/app/`
- `src/components/`
- `src/hooks/`
- `src/lib/`
- `src/utils/`
- корневые `package.json`, `next.config.ts`, `tsconfig.json`

Этот контур активен для разработки, но еще не стабилизирован как единственный production runtime.

### Вложенный `ziratstan-app/`

Папку `ziratstan-app/` нельзя считать безопасно выведенной из игры:

- она все еще существует в репозитории;
- попадает в часть инструментального контура;
- создает конфликты двух Next.js-приложений;
- ломает достоверный typecheck и усложняет сопровождение.

Пока репозиторий явно не очищен, `ziratstan-app/` нужно считать источником технического долга.

---

## Бэкенд и данные

- Supabase используется как основная база данных.
- Firebase Functions используется как серверный API-слой, особенно для admin и части legacy flow.
- В проекте есть статические датасеты, SQL-схемы, миграции и локальные утилиты импорта/подготовки данных.

### Текущее состояние модели данных

Ключевой архитектурный дефект:

- [supabase/schema.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql) использует `profiles` как доменную таблицу мемориалов;
- [20260312_user_auth_rls.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/migrations/20260312_user_auth_rls.sql) использует `public.profiles` как таблицу профилей пользователей.

Это означает, что auth-модель и доменная модель сейчас не согласованы.

Нельзя исходить из предположения, что текущая схема уже корректно разделяет:

- пользовательские профили;
- мемориальные профили;
- ownership;
- collaborators;
- visibility / RLS.

---

## Система авторизации и RLS

В проекте есть попытка внедрить полноценный контур **Supabase Auth + Row Level Security**, но его нужно считать частично внедренным и требующим стабилизации.

### Файлы

| Файл | Назначение |
| --- | --- |
| `src/js/auth/supabase-auth.js` | Модуль авторизации: login/register/logout/session/UI |
| `dashboard.html` | Личный кабинет, управление связанными сущностями и пользовательскими данными |
| `supabase/migrations/20260312_user_auth_rls.sql` | Миграция auth/RLS-контура |
| `supabase/admin_security.sql` | Отдельные admin security-настройки |

### Что важно понимать

Миграция `20260312_user_auth_rls.sql` сама по себе не гарантирует корректную безопасность проекта, потому что она конфликтует с текущей доменной схемой.

То есть:

- применять миграцию нужно, если задача связана с auth/RLS тестированием;
- но считать, что после применения модель уже корректна, нельзя;
- любые изменения в auth и ownership нужно сверять сразу с обеими SQL-точками: схемой и миграциями.

### Настройка Google OAuth (АКТУАЛЬНО на 2026-03-13)

Для корректной работы входа через Google на боевом домене:

1. В Google Cloud Console добавить точный URI: `https://[PROJECT_REF].supabase.co/auth/v1/callback`.
2. В Supabase Dashboard (`Authentication → URL Configuration`) указать:
   - Site URL: `https://ziratstan-app.web.app/`
   - Redirect URLs: `https://ziratstan-app.web.app/*`
3. **Confirm email — ДОЛЖЕН БЫТЬ ВЫКЛЮЧЕН** (`Authentication → Sign In / Providers → Confirm email = OFF`). Если включён — Supabase создаёт сессию для нового Google-пользователя, но через ~2 секунды её инвалидирует. В логах это видно как `/callback → /logout` с задержкой 2с.
4. Supabase JS SDK настроен на **PKCE flow** (не implicit). Менять `flowType` в `createClient()` и `signInWithOAuth()` нельзя — это критично для работы OAuth с новыми аккаунтами.

### Intended security model

В кодовой базе прослеживается такой целевой замысел:

```text
Supabase Auth -> auth.users
             -> user profile extension
             -> memorial ownership / collaborators
             -> RLS policies for read/write access
```

Но этот замысел пока не доведен до консистентного состояния в SQL и runtime-коде.

### UI-слой auth

Сейчас auth UI завязан на:

- `index.html` — кнопка входа / регистрации;
- `src/js/auth/supabase-auth.js` — клиентская логика сессии;
- `dashboard.html` — пользовательский кабинет.

При изменениях здесь важно помнить, что UI уже существует, но его backend-контракт нестабилен.

---

## Критичные проблемы проекта

### 1. Конфликт схемы данных Supabase

Файлы:

- [supabase/schema.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql)
- [20260312_user_auth_rls.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/migrations/20260312_user_auth_rls.sql)

Проблема:

- `public.profiles` используется и как таблица мемориалов, и как таблица профилей пользователей.

Последствия:

- ломается доменная модель;
- RLS-политики становятся недостоверными;
- frontend и backend могут ожидать разные структуры одной и той же таблицы.

### 2. Сломанный поток заказа услуг

Файлы:

- [services.actions.ts](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/actions/services.actions.ts)
- [services/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/services/page.tsx)
- [cabinet/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/cabinet/page.tsx)

Проблема:

- схема, server action и UI не согласованы;
- `profile_id` и `customer_email` обрабатываются некорректно;
- интерфейс может показывать успех даже при ошибке записи.

### 3. Некорректная Next.js-страница профиля

Файл:

- [profile/[id]/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/profile/[id]/page.tsx)

Проблема:

- для отсутствующего профиля отдаются mock-данные вместо `404`;
- ссылка на дерево собрана с ошибкой и ведет на битый путь.

### 4. Legacy dashboard не соответствует текущей схеме

Файл:

- [dashboard.html](/d:/User/Desktop/Programms/Ziratstan.kz/dashboard.html)

Проблема:

- legacy UI ожидает старые имена полей;
- текущая схема использует другую модель колонок.

### 5. Сломанный UGC rename flow

Файлы:

- [map.js](/d:/User/Desktop/Programms/Ziratstan.kz/src/js/map.js)
- [functions/index.js](/d:/User/Desktop/Programms/Ziratstan.kz/functions/index.js)

Проблема:

- frontend и backend ожидают разные payload-структуры.

### 6. Неверный slug resolution (Частично решено 2026-03-13)

Файлы:

- [functions/index.js](/d:/User/Desktop/Programms/Ziratstan.kz/functions/index.js)
- [public-api.js](/d:/User/Desktop/Programms/Ziratstan.kz/src/js/api/public-api.js)

Проблема:

- slug резолвится через `epitaph`, что логически неверно.
- **Обновление (2026-03-13):** В `public-api.js` добавлена строгая проверка UUID и case-insensitive поиск slug (вроде `kerey_khan`) напрямую через таблицу `qr_codes`. Это устраняет ошибки 400 при загрузке статических ханов.

### 7. Скрытые build/typecheck-проблемы

Файлы:

- [next.config.ts](/d:/User/Desktop/Programms/Ziratstan.kz/next.config.ts)
- [tsconfig.json](/d:/User/Desktop/Programms/Ziratstan.kz/tsconfig.json)

Проблема:

- `ignoreBuildErrors` скрывает реальные дефекты;
- корневой typecheck контур подтягивает `ziratstan-app/`.

### 8. Сборка зависит от внешнего Google Fonts fetch

Файл:

- [layout.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/layout.tsx)

Проблема:

- build ломается в средах без нормального доступа наружу.

### 9. Новый Next.js-контур частично demo

Файлы:

- [page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/page.tsx)
- [map/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/map/page.tsx)
- [search/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/search/page.tsx)

Проблема:

- присутствуют mock-данные, `test-id` и продуктовые заглушки.

---

## Что уже проверялось

- `npm.cmd run build` ранее падал из-за загрузки Google Fonts в [layout.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/layout.tsx).
- `npx.cmd tsc --noEmit` ранее падал из-за конфликта root app и `ziratstan-app/`.
- `npx.cmd eslint src functions --ext .ts,.tsx,.js` ранее давал `4 errors` и `54 warnings`.

Эти результаты нужно считать индикатором того, что quality gates пока не очищены.

---

## Структура репозитория

```text
Ziratstan.kz/
|-- package.json
|-- next.config.ts
|-- tsconfig.json
|-- firebase.json
|-- index.html
|-- map.html
|-- profile.html
|-- services.html
|-- dashboard.html
|-- admin.html
|-- qr.html
|-- assets/
|-- data/
|-- public/
|-- src/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- utils/
|   `-- js/
|       |-- api/
|       |-- auth/
|       `-- core/
|-- functions/
|-- supabase/
|   |-- migrations/
|   |-- schema.sql
|   |-- client.js
|   `-- admin_security.sql
|-- testsprite_tests/
|-- ziratstan-app/
`-- guids/
```

---

## Технологический стек

| Слой | Текущее состояние |
| --- | --- |
| Прод-фронтенд | Статические HTML/CSS/JS страницы в корне |
| Новый фронтенд | Next.js 16 + React 19 + TypeScript |
| Авторизация | Supabase Auth через `src/js/auth/supabase-auth.js` |
| База данных | Supabase / PostgreSQL |
| Безопасность | Частично внедренный RLS-контур |
| Серверная логика | Firebase Functions v2 |
| Локализация | `src/js/core/i18n.js` + `locales.js` |
| Карта | Leaflet / React-Leaflet |
| QR | `qrcode` / `react-qrcode-logo` |
| PWA | manifest + next-pwa в Next.js-контуре |

---

## Актуальные важные директории и файлы

### Статический контур

- [index.html](/d:/User/Desktop/Programms/Ziratstan.kz/index.html)
- [map.html](/d:/User/Desktop/Programms/Ziratstan.kz/map.html)
- [profile.html](/d:/User/Desktop/Programms/Ziratstan.kz/profile.html)
- [services.html](/d:/User/Desktop/Programms/Ziratstan.kz/services.html)
- [dashboard.html](/d:/User/Desktop/Programms/Ziratstan.kz/dashboard.html)
- [admin.html](/d:/User/Desktop/Programms/Ziratstan.kz/admin.html)
- [qr.html](/d:/User/Desktop/Programms/Ziratstan.kz/qr.html)

### Legacy JS / auth

- [supabase-auth.js](/d:/User/Desktop/Programms/Ziratstan.kz/src/js/auth/supabase-auth.js)
- [map.js](/d:/User/Desktop/Programms/Ziratstan.kz/src/js/map.js)
- [public-api.js](/d:/User/Desktop/Programms/Ziratstan.kz/src/js/api/public-api.js)

### Файлы Next.js-контура

- [page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/page.tsx)
- [layout.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/layout.tsx)
- [map/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/map/page.tsx)
- [profile/[id]/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/profile/[id]/page.tsx)
- [services.actions.ts](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/actions/services.actions.ts)
- [cabinet/page.tsx](/d:/User/Desktop/Programms/Ziratstan.kz/src/app/cabinet/page.tsx)

### Supabase

- [schema.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql)
- [20260312_user_auth_rls.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/migrations/20260312_user_auth_rls.sql)
- [client.js](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/client.js)
- [admin_security.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/admin_security.sql)

### Firebase Functions

- [index.js](/d:/User/Desktop/Programms/Ziratstan.kz/functions/index.js)

Сейчас там реализованы admin и service-level маршруты, которые нужно читать вместе со схемой Supabase, а не изолированно.

---

## Доменные сущности

В проекте встречаются следующие основные сущности:

- `cemeteries`
- memorial profiles / memorial records
- user profiles
- ownership / collaborators
- `ugc_submissions`
- `ugc_profile_submissions`
- `ugc_bio_submissions`
- `qr_codes`
- service leads / service orders
- `profile_relations`

Важно: этот список отражает смысловую модель проекта, но не гарантирует, что текущая SQL-реализация уже согласована по именам таблиц и колонок.

---

## Тесты и артефакты QA

- [testsprite_tests](/d:/User/Desktop/Programms/Ziratstan.kz/testsprite_tests)

Там лежат Python-сценарии для поиска, карты, профилей, QR и сервисных заявок. Использовать их как вспомогательный smoke-слой, но не как доказательство полной готовности проекта.

---

## Разработка и деплой

### Локальный запуск Next.js

```bash
npm install
npm run dev
```

### Typecheck / lint / build

```bash
npx.cmd tsc --noEmit
npx.cmd eslint src functions --ext .ts,.tsx,.js
npm.cmd run build
```

### Деплой Firebase Hosting

```bash
firebase deploy --only hosting
```

Важно: деплой статики не означает, что Next.js-контур уже готов к полноценному production запуску.

---

## Приоритетный план стабилизации

### Этап 1. Зафиксировать единый контур запуска

Нужно определить, что является основным runtime для первого тестового запуска:

- либо legacy-контур;
- либо root Next.js.

### Этап 2. Развести user и memorial сущности в Supabase

Нужно явно разделить:

- user profiles;
- memorial profiles;
- ownership;
- collaborators;
- visibility / access policies.

### Этап 3. Починить critical user flows

В первую очередь:

- services submit;
- cabinet orders view;
- profile page;
- slug resolve;
- QR resolve;
- UGC rename submit.

### Этап 4. Вернуть честные quality gates

Нужно:

- убрать маскирующие build-настройки;
- изолировать active app от `ziratstan-app/`;
- сделать сборку предсказуемой;
- перестать прятать типовые ошибки конфигом.

### Этап 5. Убрать demo/mocks из пользовательских маршрутов

Минимум:

- убрать `test-id`;
- убрать fallback на mock profile;
- перевести map/search на реальные данные или честный restricted mode.

### Этап 6. Подготовить первый test launch

Нужно иметь:

- проверяемый auth flow;
- рабочий кабинет;
- рабочий сервисный заказ;
- корректный profile route;
- рабочий QR flow;
- smoke-сценарии на основные пользовательские потоки.

---

## Что важно помнить при правках

1. Не считать, что проект уже полностью мигрировал на Next.js.
2. Не считать, что `dashboard.html` уже согласован с текущей схемой данных.
3. Не считать, что `public.profiles` уже окончательно определена как таблица пользователей.
4. Перед изменениями в auth/RLS всегда сверять [schema.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql) и [20260312_user_auth_rls.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/migrations/20260312_user_auth_rls.sql) вместе.
5. При изменениях в `src/js/auth/supabase-auth.js` проверять, что `window.ZiratAuth` продолжает корректно экспортироваться.
6. При изменениях в admin API проверять связку Firebase Functions + Supabase auth/role/MFA.
7. Перед выводом "все работает" прогонять build, typecheck и lint.
8. Если build/typecheck ломаются, не скрывать проблему флагами, а чинить источник конфликта.

---

## Короткое резюме для агента

Если задача касается legacy-сайта, сначала смотреть корневые HTML-файлы и `src/js/`.

Если задача касается нового frontend-контура, смотреть `src/app/`, `src/components/`, `src/lib/`, но всегда учитывать, что этот контур еще не является единственным production runtime.

Если задача касается модерации, ролей, bootstrap, ownership или auth, смотреть одновременно:

- [functions/index.js](/d:/User/Desktop/Programms/Ziratstan.kz/functions/index.js)
- [schema.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql)
- [20260312_user_auth_rls.sql](/d:/User/Desktop/Programms/Ziratstan.kz/supabase/migrations/20260312_user_auth_rls.sql)

Если задача касается сборки, отдельно проверять влияние `ziratstan-app/` на корневой toolchain.

---

## Жесткие системные правила (Hard Rules)

1. **Никаких упоминаний SurviveKit.** Слово `SurviveKit` (или `survilkit`) строго запрещено к упоминанию в коде, комментариях, UI или документации этого проекта (Ziratstan). Оно может упоминаться исключительно в своей собственной папке/проекте.
2. **Тестирование только на проде.** Если требуется протестировать функционал сайта (через браузер или запросы), тестирование должно проводиться **исключительно на боевом сайте** `https://ziratstan-app.web.app`. Локальное тестирование (`localhost`, `npm run dev`, `firebase emulators:start`) запрещено, если пользователь не дал на это прямого указания.

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
   - key is wrong, usually anon/publishable;
   - replace with real `service_role` or `sb_secret_*` key from Supabase API settings.
7. `AuthSessionMissingError` after failed sign-in means no active session; treat as auth-state fallback, not DB corruption.
8. Security: if keys or passwords were exposed in terminal/chat logs, rotate keys and reset admin password immediately.

Quick key-role check for JWT-like keys:

```bash
node -e "const t=process.env.SUPABASE_SERVICE_ROLE_KEY||'';const p=t.split('.')[1];if(!p){console.log('non-JWT key format');process.exit(0)};console.log(JSON.parse(Buffer.from(p,'base64url').toString()).role)"
```

Expected for admin scripts: `service_role` or non-JWT `sb_secret_*` key.

---

## OAuth / Google Sign-In Troubleshooting (2026-03-13)

### Диагностированные причины немедленного SIGNED_OUT после SIGNED_IN

Если в консоли видно:

```text
onAuthStateChange → SIGNED_IN user@gmail.com
onAuthStateChange → INITIAL_SESSION user@gmail.com
onAuthStateChange → SIGNED_OUT (no user)
```

— это серверная инвалидация сессии Supabase. Причины в порядке убывания вероятности:

| # | Причина | Признак | Фикс |
| - | ------- | ------- | ---- |
| 1 | **`Confirm email` включён** | В логах сервера: `/callback → /logout` через ~2с | Dashboard: `Auth → Sign In/Providers → Confirm email = OFF` |
| 2 | **Implicit flow + refresh\_token rotation** | Логи: SIGNED\_IN → мгновенный SIGNED\_OUT | `flowType: 'pkce'` в `createClient()` |
| 3 | **Двойной `setSession()` вызов** | Старый код `processOAuthRedirect` вызывал `setSession` вручную, SDK делал то же самое | Убран ручной `setSession` из `processOAuthRedirect` |
| 4 | **Триггер `handle_new_user` без EXCEPTION** | Новые пользователи не создаются | `SECURITY DEFINER` + `EXCEPTION WHEN OTHERS THEN RETURN NEW` |

### Текущее состояние auth-кода (2026-03-13)

**`supabase-auth.js`:**

- `getSupabase()` создаёт клиент с `{ auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } }`
- `processOAuthRedirect()` — только детектирует URL, НЕ вызывает `setSession()` или `exchangeCodeForSession()`. SDK делает это сам через `detectSessionInUrl: true`.
- `initAuth()` — ждёт 1000ms после детектирования OAuth редиректа, потом проверяет сессию через `getSession()`
- `onAuthStateChange` — логирует все события: `console.log('[Auth] onAuthStateChange →', event, ...)`
- `signInWithGoogle()` — `redirectTo: window.location.origin + '/'` (всегда на главную)

**`supabase/client.js`:**

- Также использует `flowType: 'pkce'` и переиспользует `window._sb` если клиент уже создан в `supabase-auth.js`

**Supabase Dashboard (проект `atxqjzjerdvpiampxamk`):**

- `Confirm email`: **OFF** ✅
- `Allow new users to sign up`: **ON** ✅
- Site URL: `https://ziratstan-app.web.app/` ✅
- Redirect URLs: `https://ziratstan-app.web.app/*` ✅
- Auth Hooks: **нет** ✅
- Trigger `handle_new_user`: содержит `EXCEPTION WHEN OTHERS THEN RETURN NEW` ✅

### Как работает PKCE flow

1. `signInWithGoogle()` → SDK генерирует `code_verifier`, сохраняет в localStorage, отправляет `code_challenge` в Supabase
2. Supabase → Google OAuth → пользователь логинится
3. Google → Supabase → наш сайт перенаправляется с `?code=...` в URL (НЕ `#access_token=` в хэше)
4. SDK обнаруживает `?code=` + находит `code_verifier` в localStorage → вызывает `exchangeCodeForSession` внутри
5. Supabase возвращает `access_token` + `refresh_token` → SIGNED_IN
6. `initAuth` через 1000ms проверяет сессию → `cleanupOAuthRedirectUrl()` → UI обновляется

**Важно:** `code_verifier` хранится в localStorage. Если localStorage очищен между п.1 и п.4 (разные браузеры, extensions, private mode без сохранения) — PKCE не сработает.

---

## Исторические профили (VIP / Батыры / Ханы) (Обновлено 2026-03-15)

В системе `public/data/profiles/*.json` хранятся только строго **верифицированные профили реальных исторических личностей**.
Любые тестовые (вроде `*_new_*.json`) или неподтвержденные (без надежных биографий) профили массово и безвозвратно удаляются из этой базы (проведена зачистка со 189 до 103 персон).

**Требования к историческому профилю:**

1. Обязательны достоверные поля `zhuz` (Жүз) и `tribe` (Ру / Тайпа) для всех. Для чингизидов добавляется приписка `Жошы тұқымы (Чингизид)` в ру, а в жуз — тот, которым правили (или `Барлық жүз`).
2. Обязательна структура для генеалогического древа: `shezhire: { parents: [], children: [] }`. Это задел под самую важную фичу для вовлечения пользователей и связывания локальной специфики.
3. Данные выводятся в боковой панели (`.vip-sidebar` в `profile.html` или его аналоге в Next.js) с указанием Жүза и Ру. См. логику в `src/js/profile.js`.

---

## Утилиты и Скрипты (Node.js)

### `scripts/localize_cemeteries.js`

**Суть:** Скрипт массовой локализации (перевода с русского на казахский) базы данных кладбищ (`data/cemeteries_data.js`). Добавляет поля `n_ru` и `n_kk` к каждому объекту.

**Важный нюанс (ESLint):**
При разработке Node.js утилит в корне проекта ESLint жестко ругается на использование `require()` (ошибка: `A require() style import is forbidden.`).

- *Обычные директивы `eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs` не работают* и вызывают warning об unused directive (потому что правило кастомное или настроено иначе).
- **Решение:** Для утилит, предназначенных только для backend/терминала (не идущих в frontend bundle), в начало файла добавляется глобальная директива `/* eslint-disable */`. Это полностью решает проблему линтера.

---

## Supabase Security Troubleshooting (2026-03-15)

### Ошибка: RLS Disabled on `public.spatial_ref_sys`

Если Supabase Security Advisor (или линтер) выдает критическую ошибку об отключенном RLS на таблице `spatial_ref_sys`, **не пытайтесь включить RLS вручную или сменить владельца таблицы** (она принадлежит `supabase_admin`).

- **Причина:** Расширение PostGIS по умолчанию создает свои внутренние таблицы в той схеме, где оно инициализировано. Изначально в проекте оно инициализировалось в `public`, выставляя технические таблицы под API-доступ.
- **Решение (на миллиард):** Расширения должны лежать в выделенной непубличной схеме `extensions`.

**Как это уже исправлено в проекте:**

1. В `schema.sql` добавлено:

   ```sql
   CREATE SCHEMA IF NOT EXISTS "extensions";
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA "extensions";
   CREATE EXTENSION IF NOT EXISTS postgis SCHEMA "extensions";
   ```

2. Создана миграция `supabase/migrations/20260315_move_postgis.sql`, которая переносит существующие расширения:

   ```sql
   ALTER EXTENSION postgis SET SCHEMA "extensions";
   ```

**Действия:** Если ошибка всё еще висит в дашборде, просто выполните скрипт из миграции `20260315_move_postgis.sql` в SQL Editor'е, и безопасность будет восстановлена.

---

## Security Compliance & Data Architecture (Updated 2026-03-23)

В рамках соответствия Конституции РК (ст. 21) и Цифровому кодексу 2026 года, архитектура проекта была переработана для обеспечения изоляции персональных данных и защиты от утечек.

### 1. Offline-First Security (Secure Storage)

Реализован `SecureStorageAdapter` (`src/lib/secureStorage.ts`), использующий Web Crypto API (AES-GCM). Теперь все критичные кэшированные данные PWA шифруются на клиенте, исключая доступ в plain-text через DevTools.

### 2. Защита от Bruteforce (Rate Limiting)

В `src/middleware.ts` реализован Token Bucket Rate Limiter в памяти Edge/Node. Защищает эндпоинты `/api/profile/verify-pin` и `/api/auth` от подбора паролей. Действует жестко (настроено на ~5 попыток на IP в окно времени).

### 3. Data Residency & Abstraction (DAL)

Для подготовки к переносу персональных данных строго на сервера внутри РК реализован паттерн "Репозиторий".

- **Интерфейс:** `IProfileRepository` (`src/lib/dal/ProfileRepository.ts`)
- **Реализации:** `SupabaseProfileRepository` (облако) и `KZPostgresProfileRepository` (локальная БД).
- **Переключение:** Через переменную окружения `DATA_RESIDENCY_MODE` (установите `LOCAL_KZ` для перехода на локальную базу). Вся бизнес-логика теперь должна обращаться к `dbFactory.getProfileRepository()`, минуя прямые вызовы Supabase SDK для таблиц профилей.

### 4. Deny-by-Default (RLS)

И база Supabase, и Firebase Firestore (через `firestore.rules`) по умолчанию блокируют все операции. Все PWA клиенты обращаются к защищенным данным только через Next.js Route Handlers. Supabase RLS разрешает чтение/запись персональных профилей **только владельцам** (owner_id).

---

## Schema Sync & Accessibility Compliance (Updated 2026-03-25)

**Проблема 1: 400 Bad Request при создании/чтении профилей**
API Supabase стало отдавать ошибку `42703 (UNDEFINED COLUMN)`. Фронтенд (Next.js и Vanilla JS) пытался читать/писать колонку `shezhire_entries`, которой физически не было в базе.
**Решение:** Сгенерирована миграция `supabase/migrations/20260319_shezhire_entries.sql`. Эта SQL команда **обязательна для ручного исполнения в Supabase Dashboard**, иначе создание UGC-профилей и чтение списка предков не работает.

**Проблема 2: 403 Permission Denied на `user_profiles`**
**Решение:** Скрипт `supabase/fix_user_profiles_403.sql` исправляет политики RLS. Требуется ручной запуск в Supabase SQL Editor.

**Проблема 3: Провалы Lighthouse Accessibility Audits**
Google Lighthouse ругался на отсутствие атрибутов `id` и `name` у тегов `<input>`, `<select>` и `<textarea>`, а также на отсутствие привязки `<label>` через `htmlFor`/`for`. Старые формы мешали автозаполнению.
**Решение:** Во всех HTML-файлах, а также в динамических React-компонентах (`services/page.tsx`, `search/page.tsx`, `map/page.tsx`, `admin.js`, `map.js`) были добавлены `name`, `id` и `aria-label`, восстановив 100% зелёный статус по доступности (A11y).

---

## Premium Profiles & Tariff Checkout via WhatsApp (Updated 2026-06-07)

Для монетизации и поддержки платформы внедрена система Premium-профилей и оформление платных услуг.

### 1. База данных и API
- В таблицу `profiles` добавлено поле `is_premium` (`BOOLEAN DEFAULT false`).
- Создана миграция `supabase/migrations/20260522_add_is_premium.sql`.
- Публичный API (`src/js/api/public-api.js`) возвращает флаг `isPremium` в объекте профиля.

### 2. Защита контента (Ограничения)
- На странице `profile.html` (`src/js/profile.js`) функция `isProfileLocked()` проверяет, является ли профиль созданным пользователем (ID в формате UUID) и имеет ли он `is_premium === false`.
- Если профиль заблокирован:
  - В фотогалерее (лайтбоксе) доступна только 1 фотография, навигация скрыта.
  - Шежіре (семейное древо) блокируется оверлеем `.tree-lock-overlay`, который перенаправляет на оплату.
  - Вверху страницы показывается кнопка «⭐ Premium белсендіру» (`#activatePremiumBtn`).

### 3. Процесс оплаты (Чек-аут)
- При клике на кнопку активации открывается модальное окно `#checkoutModal`.
- Доступные тарифы:
  - **Premium Мемориал (5 000 ₸):** Открытие био, галереи, шежіре и видео.
  - **Premium + QR-Табличка (15 000 ₸):** Цифровой премиум + изготовление акриловой/металлической таблички с доставкой Казпочтой.
- Оплата P2P-переводом на карту Kaspi Gold (номер карты `4400 4303 2098 5507`, получатель Нурлан А.). Предусмотрено копирование номера карты в один клик.
- Подтверждение согласия с условиями сервиса и обработкой персональных данных.
- Отправка заполненной формы перенаправляет пользователя в WhatsApp администратора (+77082373269) с предзаполненным текстовым шаблоном (ID профиля, ФИО, Email, выбранный тариф) для ручного подтверждения платежа и активации.

### 4. Панель управления администратора
- В админке (`admin.html`, `src/js/admin.js`) добавлен чекбокс управления премиумом `ep_isPremium` при создании и редактировании мемориалов.
- В списке профилей отображается золотой бейдж `Premium`, если у записи активирован премиум-статус.

---

## Legal Compliance, Bilingual Documentation & Consent (Updated 2026-06-07)

Платформа приведена в соответствие с законодательством Республики Казахстан о персональных данных.

### 1. Двуязычные юридические документы
- Документы `privacy.html` (Политика конфиденциальности), `terms.html` (Пользовательское соглашение) и `offer.html` (Договор оферты) были переведены на казахский язык и оформлены в виде структурированных двуязычных веб-страниц.
- В `offer.html` зафиксированы сроки изготовления таблички (3 рабочих дня) и доставки (3–7 рабочих дней по РК), правила возврата средств и требования соответствия Типовым правилам погребения РК.

### 2. Согласие на обработку данных (Consent Checkbox)
- В формы регистрации на главной (`index.html`) и странице карты (`map.html`) добавлен обязательный чекбокс `#reg-consent` с текстом согласия на обработку персональных данных согласно закону РК.
- Добавлено предупреждение для администраторов (`admin_lbl_heir_warning`) о необходимости получения согласия наследников умершего перед публикацией профиля согласно ст. 15 Закона РК о ПД.

### 3. Локализация данных (Data Residency)
- В Политике конфиденциальности четко зафиксирована политика локализации данных: на этапе MVP данные хранятся на серверах Supabase, но при достижении 5–10 платящих пользователей база будет полностью мигрирована на серверы внутри Республики Казахстан (PS.kz или Yandex Cloud Almaty).

