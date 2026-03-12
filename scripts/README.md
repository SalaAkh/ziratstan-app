# Scripts

Здесь лежат служебные утилиты для наполнения данных, чистки датасетов и работы с Supabase.

Запускать их нужно из корня репозитория:

```bash
node scripts/<file>.js
python scripts/generate_og.py
```

## Что меняют скрипты

- `data/profiles_data.js`
- `data/cemeteries_data.js`
- `public/data/profiles/`
- `map.html`
- Supabase Auth и таблицы проекта

Перед запуском стоит открыть нужный файл и проверить, не зашиты ли внутри project URL, ключи или assumptions о формате данных.

## Скрипты

- `fetch_cemeteries.js` — загружает кладбища Казахстана из Overpass API и пересобирает `data/cemeteries_data.js`.
- `rename_cemeteries.js` — пытается переименовать безымянные кладбища по ближайшим населенным пунктам из OSM.
- `fetch_wiki_bios.js` — тянет краткие биографии из Wikipedia и генерирует JSON-профили в `public/data/profiles/`.
- `generate_og.py` — генерирует OG-изображения для публичных страниц.
- `clean_profiles.js` — удаляет дубликаты из `data/profiles_data.js`.
- `find_dupes.js` — ищет дубли по `fullName`, сохраняет список id и готовит очищенную копию датасета.
- `find.js` — вспомогательный локальный поиск по данным.
- `add_vips.js` — legacy-скрипт, который дописывает VIP-записи прямо в `map.html`.
- `migrate_profiles.js` — переносит профили из `data/profiles_data.js` в Supabase. При миграции теперь важно также задавать `owner_id` и `visibility` для каждой записи (см. RLS-политики).
- `push_schema.js` — читает `supabase/schema.sql` и напоминает, что схему нужно применять через Supabase SQL Editor.
- `register_admin_email.js` — создает или обновляет admin-пользователя в Supabase Auth.

## Переменные окружения

Часть скриптов работает только при наличии переменных окружения:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

For static pages (`index.html`, `map.html`, etc.), generate `src/js/config.js` before deploy:

```bash
node scripts/generate_client_config.js
```

Минимально это требуется для `register_admin_email.js`. Скрипты миграции и старые интеграционные утилиты стоит отдельно перепроверять перед запуском: часть из них писалась как одноразовые и не всегда безопасна для повторного применения без ревью.

## Supabase-миграции

После добавления системы авторизации (март 2026) в `supabase/migrations/` появился новый файл:

- `20260312_user_auth_rls.sql` — создает таблицы `profiles`, `deceased_collaborators`, добавляет колонки `owner_id` и `visibility` в `deceased`, включает Row Level Security и настраивает политики доступа.

**Запустить обязательно**: открыть Supabase SQL Editor → вставить содержимое файла → нажать Run.

## Рекомендации

- Сначала делайте бэкап файлов в `data/` и `public/data/profiles/`.
- Для сетевых скриптов учитывайте, что Overpass API и Wikipedia могут отвечать медленно или временно ограничивать запросы.
- Скрипты, которые пишут в Supabase, лучше запускать только с тестовыми или явно проверенными ключами.
- При `migrate_profiles.js` не забудьте задать `owner_id` для каждой мигрируемой записи, иначе RLS-политики не дадут пользователям редактировать эти профили.
