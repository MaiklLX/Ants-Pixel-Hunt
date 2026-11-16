# KT-100 — регрессионная защита отправки после размещения бокса

**Дата:** 16 ноября 2026.
**Кодовый HEAD после исправления теста:** 5a645534ecb68e6a0667e6127a415d28b4cec597.
**Статус:** Pages tests/build/deploy и Godot check подтверждены; Android debug APK ещё выполнялся на момент записи.

## Зачем нужен тест

В KT-099 бокс или связанная пара сначала анимированно перемещается из очереди в стартовые отсеки. Муравьи не должны начинать выходить из слота, пока соответствующие боксы ещё находятся в пути. При связанной паре важно дождаться обоих перелётов, иначе один участник мог бы начать работу раньше второго.

## Регрессионный контракт

В tests/dom-contract.test.js добавлен тест KT-100 waits for all crate-loading animations before dispatching ants. Он проверяет порядок в onChoose:

1. Все целевые слоты добавляются в loadingSlots.
2. Promise.all ожидает все animateBoxLoading для выбранного бокса или пары.
3. Блокировки снимаются только после завершения общего ожидания.
4. Затем вызываются kickColony и settleColony.

Это source/DOM-contract проверка последовательности, а не полноценный browser interaction test.

## Коммиты и исправление теста

- Первый test-only commit: cf1b5afe283cf47fb4d43b1dbe00cd100f8c356b.
- Его первый CI выявил ошибку matcher: регулярное выражение было чрезмерно экранировано и не находило обычный вызов kickColony(). Это была ошибка нового теста, не дефект runtime: 91 из 92 тестов прошли.
- Исправленный matcher использует подсчёт точного подстрочного вызова; commit: 5a645534ecb68e6a0667e6127a415d28b4cec597.
- Изменённый файл: tests/dom-contract.test.js.
- App version остаётся KT-099; PWA cache остаётся v68, так как runtime-код и precache assets не менялись.

## GitHub Actions для SHA 5a6455

- Pages [run #43851392070](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43851392070) — success: npm test 92/92, npm run build, Pages artifact upload и deploy.
- Godot [run #43851391110](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43851391110) — success: project import, gameplay rules tests и smoke test.
- Android [run #43851391164](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/43851391164) — на момент фиксации: npm test, npm run build, Capacitor generation/sync прошли; Build debug APK ещё выполнялся, artifact не подтверждён.

## Ограничения

- Локальные npm test и npm run build не запускались; использованы GitHub Actions.
- Не проводились физическое тестирование телефона, ручной visual QA, browser screenshot QA или performance profiling.
- Следующий документационный commit запускает новые workflows; их результаты нужно сверить по новому SHA, не переносить статусы с SHA 5a6455.

## Следующая точка

Проверить Android artifact для SHA 5a6455 и CI для документационного HEAD. Затем зафиксировать продуктовое решение по конвейеру/норе до следующей визуальной перестройки арены.