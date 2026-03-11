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

- [index.html](d:/User/Desktop/Programms/Ziratstan.kz/index.html) — лендинг
- [map.html](d:/User/Desktop/Programms/Ziratstan.kz/map.html) — карта захоронений
- [profile.html](d:/User/Desktop/Programms/Ziratstan.kz/profile.html) — профиль человека
- [qr.html](d:/User/Desktop/Programms/Ziratstan.kz/qr.html) — QR-страница
- [services.html](d:/User/Desktop/Programms/Ziratstan.kz/services.html) — услуги
- [admin.html](d:/User/Desktop/Programms/Ziratstan.kz/admin.html) — админка

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

## Структура репозитория

```text
Ziratstan.kz/
|-- index.html
|-- map.html
|-- profile.html
|-- qr.html
|-- services.html
|-- admin.html
|-- 404.html
|-- data/
|   |-- cemeteries_data.js
|   |-- profiles_data.js
|-- assets/
|   |-- images/
|-- src/
|   |-- js/core/
|   |   |-- i18n.js
|   |   |-- locales.js
|-- public/
|   |-- data/profiles/*.json
|   `-- icons/, manifest, assets
|-- src/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   `-- utils/
|-- functions/
|   |-- index.js
|   `-- package.json
|-- supabase/
|   |-- client.js
|   |-- schema.sql
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
| Локализация | [i18n.js](d:/User/Desktop/Programms/Ziratstan.kz/i18n.js) + [locales.js](d:/User/Desktop/Programms/Ziratstan.kz/locales.js) |
| База данных | Supabase / PostgreSQL |
| Серверная логика | Firebase Functions v2 |
| Доп. фронтенд-контур | Next.js 16 + React 19 + TypeScript |
| Карта | Leaflet / React-Leaflet |
| QR | `qrcode` / `react-qrcode-logo` |
| PWA | manifest + next-pwa в Next.js-контуре |

---

## Актуальные важные директории

### Статический контур

- [index.html](d:/User/Desktop/Programms/Ziratstan.kz/index.html)
- [map.html](d:/User/Desktop/Programms/Ziratstan.kz/map.html)
- [profile.html](d:/User/Desktop/Programms/Ziratstan.kz/profile.html)
- [admin.html](d:/User/Desktop/Programms/Ziratstan.kz/admin.html)
- [services.html](d:/User/Desktop/Programms/Ziratstan.kz/services.html)
- [qr.html](d:/User/Desktop/Programms/Ziratstan.kz/qr.html)

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

### Supabase

- [supabase/schema.sql](d:/User/Desktop/Programms/Ziratstan.kz/supabase/schema.sql)
- [supabase/client.js](d:/User/Desktop/Programms/Ziratstan.kz/supabase/client.js)
- [supabase/admin_security.sql](d:/User/Desktop/Programms/Ziratstan.kz/supabase/admin_security.sql)

---

## Доменные сущности

Проект опирается на следующие основные сущности:

- `cemeteries` — кладбища
- `profiles` — мемориальные профили
- `ugc_submissions` — предложения по исправлению/уточнению данных
- `ugc_profile_submissions` — пользовательские заявки на новые профили
- `ugc_bio_submissions` — дополнения к биографиям
- `qr_codes` — QR-коды и их привязки
- `services_leads` — заявки на услуги
- `profile_relations` — семейные связи для дерева

---

## Тесты и артефакты QA

В репозитории уже есть набор e2e-сценариев:

- [testsprite_tests](d:/User/Desktop/Programms/Ziratstan.kz/testsprite_tests)

Там лежат Python-сценарии для поиска, карты, профилей, QR и сервисных заявок. Это полезный ориентир при регрессии даже если тесты не запускаются в каждом изменении.

---

## Разработка и деплой

### Статический контур

Для локальной проверки достаточно простого статического сервера:

```bash
python -m http.server 3000
```

Деплой прод-контура:

```bash
firebase deploy --only hosting
```

### Firebase Functions

Если меняются функции, нужен отдельный деплой функций.

### Next.js workspace

Отдельный Next.js workspace живет в [ziratstan-app/package.json](d:/User/Desktop/Programms/Ziratstan.kz/ziratstan-app/package.json).

Базовый локальный запуск для него:

```bash
cd ziratstan-app
npm install
npm run dev
```

---

## Что важно помнить при правках

1. Не считать, что проект уже полностью мигрировал на Next.js.
2. Не считать, что Next.js в репозитории "мертвый" или неиспользуемый артефакт — он уже оформлен как отдельный рабочий контур.
3. При изменениях в прод-части сначала проверять корневые HTML-файлы и [firebase.json](d:/User/Desktop/Programms/Ziratstan.kz/firebase.json).
4. При изменениях админского API проверять связку Firebase Functions + Supabase auth/role/MFA.
5. Не удалять папки `src/` или `ziratstan-app/` как "лишние" без явного решения о миграции.
6. Проверять, какой контур меняется: статический прод, serverless API или Next.js.

---

## Короткое резюме для агента

Если задача касается текущего сайта, сначала смотри в корневые HTML/JS-файлы.

Если задача касается новой архитектуры, личного кабинета, дерева, server actions или App Router, смотри в `src/` и `ziratstan-app/`.

Если задача касается модерации, ролей, bootstrap админки или статусов UGC, смотри в [functions/index.js](d:/User/Desktop/Programms/Ziratstan.kz/functions/index.js) и Supabase SQL.
