# KT-076 — паузоустойчивые часы анимаций колонии

## Обнаруженная проблема
Анимации муравьёв и боксов рассчитывали фазу по абсолютному времени `performance.now()` / timestamp из `requestAnimationFrame`. Когда браузер скрывает вкладку или переводит PWA в фон, RAF может быть приостановлен. После возвращения разница timestamp резко увеличивается: муравьи могли перескочить к pickup/возврату/завершению за один кадр, а анимация бокса — сразу закончиться. Это вывод из временной модели исходного кода; ручной браузерный тест до исправления не выполнялся.

## Реализация
- В `src/ant-animation.js` добавлен `createPausableClock`: логическое время останавливается на событии скрытия и исключает длительность скрытого периода после возобновления.
- `src/app.js` подключает часы к `visibilitychange` и использует их для рейсов муравьёв, походки, pickup-эффектов, загрузки бокса в слот и ухода боксов на конвейер.
- Все три RAF-цикла используют одну временную шкалу; ограничение частоты кадров остаётся основано на исходном RAF timestamp.
- Сохранены индивидуальные траектории, длительности активного движения, лимит 36 муравьёв, правила сбора и игровая логика.
- Добавлены unit-тесты паузы/возобновления и повторных событий, а также DOM-contract проверка подключения всех трёх циклов.
- App version KT-076; PWA shell cache v46. `service-worker.js` и `public/service-worker.js` идентичны.

## Файлы
- `src/ant-animation.js`
- `src/app.js`
- `tests/ant-animation.test.js`
- `tests/dom-contract.test.js`
- `index.html`
- `service-worker.js`
- `public/service-worker.js`

## Коммиты
- Основное изменение KT-076: `2eb6b27dd8c7f31079ce12a33b13ff90bc6a7f06`.
- Минимальная коррекция устаревшего DOM-теста версии приложения: `03ef6bb4ccd1f2f85c0e87924452c2271f0f99da`.
- Проверенный кодовый HEAD: `03ef6bb4ccd1f2f85c0e87924452c2271f0f99da`.

## Проверки GitHub Actions для проверенного SHA
- GitHub Pages [43000997858](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43000997858): 66/66 тестов PASS, Vite production build PASS, Pages deploy PASS.
- Godot [43000997759](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43000997759): resource import, gameplay rules tests и project smoke test PASS.
- Android debug APK [43000997894](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43000997894): 66/66 тестов PASS, production build PASS, `assembleDebug` PASS, artifact upload PASS.

## Ограничения проверки
- Первичный CI на основном code commit обнаружил устаревшее ожидание `KT-075` в DOM-тесте. Оно было исправлено минимально: проверка версии перенесена в контракт KT-076, а тест KT-075 оставлен проверкой меню. После этого все три workflow прошли.
- Локальный `npm test` и `npm run build` не запускались в этой среде; их выполнили GitHub Actions.
- Браузерный скриншот, ручное переключение вкладки и физическое тестирование Android-устройства не проводились. Debug APK workflow успешно собрал и загрузил артефакт, но это не проверка на телефоне.
- Прямое чтение публичного URL из текущего web-инструмента недоступно; успешный Pages deploy подтверждён шагом GitHub Actions.
