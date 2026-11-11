# KT-073 — доступное раскрытие правил на главном экране

**Дата:** 11 ноября 2026  
**Репозиторий:** MaiklLX/Ants-Pixel-Hunt  
**Ветка:** main  
**Кодовый commit:** `52ce3174ed06af1fb31515d59dd9eafaaab6f4cb`

## Цель

Сделать подсказку «Как играть?» доступной для скринридеров и других вспомогательных технологий, не меняя визуальную композицию меню и механику игры.

## Изменения

- Кнопка `#how-to-play` получила `aria-controls="how-panel"` и начальное `aria-expanded="false"`.
- Обработчик клика синхронизирует `aria-expanded` с фактическим `hidden` панели.
- Текст кнопки переключается между «Как играть?» и «Свернуть правила» вместе с состоянием панели.
- Добавлен DOM-контрактный тест для начального состояния, связи панели и обновления `aria-expanded`.
- Исправлен буквальный escape-перенос строки в списке README и добавлена регрессия.
- Обновлены app version KT-073 и PWA shell cache v43.

## Изменённые файлы

- `index.html`
- `src/app.js`
- `tests/dom-contract.test.js`
- `README.md`
- `service-worker.js`
- `public/service-worker.js`

## Проверки

- `npm test`: PASS в GitHub Pages workflow, run [42996419245](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/42996419245), шаг **Run gameplay tests**.
- `npm run build`: PASS в том же run, шаг **Build browser app**.
- Upload Pages artifact: PASS.
- GitHub Pages deploy: PASS; run [42996419245](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/42996419245), deployment job завершён успешно.
- Публичный URL, выведенный deployment action: https://maikllx.github.io/Ants-Pixel-Hunt/.
- Godot 4.3 project check: PASS, run [42996419111](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/42996419111): импорт ресурсов, rules tests и smoke test завершены успешно.
- Android debug APK run [42996419194](https://github.com/MaiklLX/Ants-Pixel-Hunt/actions/runs/42996419194) был в процессе выполнения при фиксации этой записи; результат не приписывается KT-073.

## Ограничения

- Не выполнялась ручная проверка браузерного скриншота.
- Не выполнялось тестирование на физическом телефоне.
- Успешный Pages deploy подтверждает публикацию, но не ручное UX-тестирование.

## Следующий шаг

Проверить публичное раскрытие подсказки и поведение установленной PWA с cache v43; затем продолжить аудит узких и невысоких экранов.
