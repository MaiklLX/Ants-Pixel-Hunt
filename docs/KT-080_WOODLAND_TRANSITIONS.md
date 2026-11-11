# KT-080 — общий лесной почерк и мягкие переходы

**Статус:** source, DOM-contract tests, production build, Pages deploy и Android debug APK build подтверждены.  
**Дата:** 11 ноября 2026.  
**Контрольный HEAD серии:** `9a524e3b3f93e2e7ecbfb1fb4fbfd6f5133a7eb4`.

## Изменение

- В верхней части главного меню, карты приключений и муравейника добавлена единая тонкая декоративная метка из трёх приглушённых огоньков в оливково-янтарной гамме.
- Для карты и муравейника добавлено спокойное появление затемнения и панели; главное меню получает короткое плавное проявление при открытии.
- Все новые переходы отключаются при `prefers-reduced-motion`.
- Переходы не меняют обработчики, состояние экранов, игровые правила, экономику, прогресс, очередь или прокрутку.

## Изменённые файлы

- `src/styles.css`
- `index.html`
- `tests/dom-contract.test.js`
- `service-worker.js`
- `public/service-worker.js`
- `README.md`
- `docs/CURRENT_STATE.md`
- `docs/KT_LOG.md`
- `docs/KT-080_WOODLAND_TRANSITIONS.md`

## Версия и проверки

- App version KT-080; PWA shell cache v50; оба service worker файла идентичны.
- [Pages run 43005475246](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43005475246): 72/72 tests PASS, Vite production build PASS, Pages artifact upload PASS, deploy PASS.
- [Android run 43005475169](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43005475169): 72/72 tests PASS, production build PASS, Gradle debug APK PASS, artifact upload PASS.
- [Godot run 43005475184](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43005475184): resource import, gameplay rules tests и project smoke test PASS.

## Не проверено

- Браузерный screenshot и ручная визуальная проверка не проводились.
- APK не устанавливался; физическое тестирование Android/iOS не выполнялось.
- GitHub Pages deploy подтверждён Actions; прямой запрос публичного URL через текущий браузерный инструмент недоступен.

## Следующий шаг

Продолжить кампанию: довести первую главу до 20 полянок с уникальными пиксельными рисунками, точным цветовым бюджетом боксов и автоматическими тестами стартовой доступности/решаемости. Новые механики добавлять только после отдельной проверки баланса.
