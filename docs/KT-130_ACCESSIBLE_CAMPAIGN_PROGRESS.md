# KT-130 — доступная семантика прогресса кампании

**Дата:** 17 ноября 2026  
**База:** 02107ca9b67c74d8877fadf73218f72a25fd3de4 (KT-129)

## Что исправлено

Карта кампании уже показывала количество пройденных полянок и процент прохождения каждой главы, но сами полосы прогресса были обычными div с aria-label. Для вспомогательных технологий они не объявляли семантику индикатора и его числовое значение.

Теперь общий индикатор кампании и индикатор каждой главы:
- имеют роль progressbar;
- объявляют aria-valuemin="0", фактическое aria-valuemax и текущее aria-valuenow;
- содержат локализованное aria-valuetext, например «2 из 5 полянок пройдено».

Видимые счётчики, геометрия карты, палитра, навигация, правила разблокировки и хранение прогресса не меняются.

## Регрессия

Добавлен DOM-contract тест, проверяющий наличие роли и всех значений у обеих полос. Старые проверки app-version синхронизированы с KT-130, чтобы исторические тесты не блокировали CI после обновления версии.

## Версия и кэш

- App version: **KT-130**
- Service Worker shell cache: **v98** в service-worker.js и public/service-worker.js.

## Файлы

- src/app.js
- tests/dom-contract.test.js
- index.html
- service-worker.js
- public/service-worker.js
- README.md
- docs/CURRENT_STATE.md
- docs/KT_LOG.md
- docs/KT-130_ACCESSIBLE_CAMPAIGN_PROGRESS.md

## Проверки

- Первый Pages прогон #44055497489 и Android прогон #44055497485: 134/135 тестов; единственный отказ был в новом контрактном тесте — он считал все aria-valuetext в app.js и захватил ещё существующий индикатор скорости. Это ошибка точности matcher, не дефект приложения.
- Исправление сужает проверки до двух конкретных элементов: общего track и chapterTrack. Повторный прогон ожидается.
- Первый кодовый commit: b85463c39d691d3f5a835f0195429b057374a626; первый прогон выявил только ошибку тестового matcher (134/135), затем он был сужен.
- Финальный проверенный code/test SHA: 31564820b1fa2f9afd99f90a109db237b8a767e6.
- Pages run #44055693646: success; npm test 135/135; npm run build; Pages artifact upload и deploy success.
- Godot run #44055693444: success; import, gameplay rules tests и project smoke test success.
- Android run #44055693603: success; npm test 135/135, npm run build, Capacitor sync, debug APK artifact #14315274358 (3,850,431 bytes).
- Локальный npm test/build, экранный диктор, ручной visual QA и физические устройства не проверялись. Прямое открытие публичного URL браузерным инструментом не удалось, но Pages deploy workflow завершился success.
