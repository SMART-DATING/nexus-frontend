# Nexus Frontend

React 19 + TypeScript + Vite. Русский адаптивный интерфейс: вход/регистрация, знакомства, публичность свойств профиля, интересы, возрастные предпочтения, match, чат и уведомления. Все данные приходят из backend, фиктивных ответов нет.

## Запуск
Node.js 22+, npm; сначала запустите соседний nexus-backend на localhost:8080.
```sh
npm ci
npm run dev
```
Открыть http://localhost:5173. Vite проксирует `/api` к backend. `npm run build` проверяет TypeScript и создаёт dist. `npm run preview` открывает production-сборку с тем же API proxy.

Демоаккаунты доступны только если backend запущен с `--nexus.demo=true`: demo@nexus.local, demo1@nexus.local; пароль NexusDemo2026!. Для взаимного like и чата используйте две вкладки с разными аккаунтами. Токены находятся в sessionStorage, срок действия 24 часа.

Чат обновляется каждые 2 секунды, уведомления — 7. Маршрут чата `/match/{id}` сохраняется при обновлении страницы. Процент на карточке — пересечение интересов, не вероятность успешных отношений. Вместо фото используются декоративные инициалы.

## Контейнер / единое приложение
Dockerfile собирает dist и отдаёт его nginx. Для полного запуска используйте compose.yaml соседнего nexus-docs. Чтобы раздавать UI из Java, см. build-demo.ps1 в docs.

Справочник API и сценарий защиты — [nexus-docs](https://github.com/SMART-DATING/nexus-docs). До слияния используйте ветку feature/working-prototype во всех репозиториях.
