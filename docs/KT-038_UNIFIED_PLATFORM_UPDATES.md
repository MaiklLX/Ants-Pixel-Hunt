# KT-038 — единое обновление Web/PWA и Android

**Цель:** одна актуальная версия для ПК-браузера, мобильного браузера, установленной PWA и Android debug APK.

## Причина
- PWA регистрирует `./service-worker.js`, который на GitHub Pages берётся из `public/service-worker.js`.
- Корневой `service-worker.js` не является production worker: Vite копирует в dist содержимое public/.
- Фактический worker оставался на cache v7, поэтому изменение root worker не обновляло PWA cache на телефоне.

## Реализация
- `public/service-worker.js` и root reference обновлены до cache v8.
- При установке worker получает свежий production HTML, извлекает реальные JS/CSS bundle paths и кэширует их вместе с manifest/icons.
- Навигация network-first с offline fallback; статические bundles cache-first.
- PWA регистрирует worker с `updateViaCache: none`, вызывает `registration.update()` и перезагружает клиент после `controllerchange`.
- Android APK workflow запускается на push в `main`, собирает Capacitor debug APK и публикует Actions artifact.

## Платформы
- Desktop browsers: GitHub Pages web build.
- Android browser/PWA: тот же web build; отдельный debug APK создаётся workflow.
- iPhone/iPad: Safari/PWA использует тот же web build. Подписанный App Store IPA требует Apple signing/macOS build.

## Проверки
- Проверить Pages deployment и Android workflow на одном SHA.
- Проверить worker activation/update и offline fallback.
- Физические устройства не заявлять проверенными без реального теста.
