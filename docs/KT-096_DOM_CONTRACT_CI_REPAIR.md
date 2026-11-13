# KT-096 — восстановление CI после KT-095

**Дата:** 13 ноября 2026.  
**Статус:** исправление тестового контракта закоммичено в `main`; Pages build/test/deploy и Godot project check подтверждены успешно.

## Причина

После KT-095 production renderer передаёт переиспользуемый буфер позы в `getTrailPose(trail, phase.progress, ant.pose)`. Исторический DOM-contract тест KT-079 продолжал ожидать старый двухаргументный вызов. Поэтому 85 из 86 тестов проходили, а один устаревший source assertion блокировал и GitHub Pages, и Android workflow. Это была ошибка тестового ожидания, не runtime-дефект.

## Исправление

- В `tests/dom-contract.test.js` проверка KT-079 обновлена с `getTrailPose(trail,phase.progress)` на `getTrailPose(trail,phase.progress,ant.pose)`.
- Проверка теперь соответствует фактическому renderer KT-095 и одновременно требует передачу индивидуального pose buffer.
- Игровой код, математические траектории, скорость, визуальные эффекты и правила головоломки не менялись.

## Изменённые файлы

Кодовый commit:
- `tests/dom-contract.test.js`

Документационный checkpoint:
- `README.md`
- `docs/CURRENT_STATE.md`
- `docs/KT_LOG.md`
- `docs/KT-096_DOM_CONTRACT_CI_REPAIR.md`

`docs/ARCHITECTURE.md` не менялся: архитектура не изменилась.

## Коммит

- Базовый HEAD перед исправлением: `429851bf318fa6bdb3d5a96702631de48f74fc58`.
- Кодовый commit: `c496f506fd2e8146931c4e5f755dde251ecf510e`.
- Изменение ограничено одним assertion в тесте; diff проверен через GitHub commit API.

## Проверки GitHub Actions

- Pages run #647: https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43404895530 — **success**. Gameplay tests: 86 passed, 0 failed; production build: success; Pages artifact upload: success; deploy job: success.
- Godot project check #703: https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43404895471 — **success**. Import, gameplay rules tests и project smoke test прошли.
- Android debug APK run #617: https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43404895439 — на момент фиксации документа ещё выполнялся. `npm test`, `npm run build`, Android project generation и sync прошли; итог Build debug APK/artifact не подтверждён.
- Предыдущие Pages #646 и Android #616 для базового SHA завершились failure из-за того же устаревшего assertion; logs показали ровно один failing test.

## Версии и публикация

- Runtime app version остаётся **KT-095**.
- PWA shell cache остаётся **v65**; runtime и precache assets не менялись, поэтому bump не нужен.
- Корневой и public Service Worker синхронны (одинаковый blob SHA на проверенном HEAD).
- GitHub Pages deployment для кодового SHA подтверждён workflow #647. Web-инструмент не смог независимо загрузить публичный URL; ручной браузерный осмотр не заявляется.

## Что не проверялось

- Локальный `npm test` и `npm run build` в рабочей копии.
- Физическое Android/iOS устройство и сенсорное управление.
- Ручной visual QA в браузере или Godot Editor.
- FPS/CPU/memory benchmark.
- Финальный результат Android APK workflow #617 на момент записи.

## Следующий шаг

KT-097: создать одну авторскую седьмую полянку, затем добавить регрессионные проверки точного цветового бюджета, стартовой доступности и полной решаемости. Не добавлять новые препятствия или бонусы до отдельного этапа баланса.
