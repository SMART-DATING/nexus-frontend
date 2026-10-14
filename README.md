# Nexus · Frontend

**Веб-интерфейс знакомств на одной волне.** Публичная главная, вход и регистрация, знакомство с Нексом, личные истории, анкеты, фотографии, взаимные симпатии, чаты и управление данными.

React 19 · TypeScript · Vite · Lucide · Vitest / Testing Library

[Документация](https://github.com/SMART-DATING/nexus-docs) · [Интерфейс](https://github.com/SMART-DATING/nexus-docs/blob/main/design/interface.md) · [API](https://github.com/SMART-DATING/nexus-docs/blob/main/architecture/api-contracts.md) · [Общий запуск](https://github.com/SMART-DATING/nexus-docs/blob/main/RUNBOOK.md)

## Быстрый запуск

Нужны Node.js 22.13+ и npm. Сначала запустите соседний [nexus-backend](https://github.com/SMART-DATING/nexus-backend) на 127.0.0.1:8080, затем из корня frontend:

```sh
npm ci
npm run dev
```

Откройте `http://127.0.0.1:5173/`. Vite проксирует `/api` к backend; реальный API и локальная модель обязательны для полного сценария. Mock-сервис автоматически не подставляется.

## Команды

| Команда | Результат |
| --- | --- |
| `npm run dev` | Разработка, фиксированный порт 5173 |
| `npm test` | Компонентные тесты Vitest в jsdom |
| `npm run build` | Проверка TypeScript и production-сборка в dist |
| `npm run preview` | Просмотр собранного dist на 4173 с API-прокси |
| `npm run smoke -- http://127.0.0.1:8088` | HTTP-сценарий с тестовыми аккаунтами на отдельно запущенной среде |

## Весь сайт через Docker

Рядом должны находиться каталоги `nexus-frontend` и `nexus-backend`:

```sh
docker compose up -d --build --wait --wait-timeout 180
```

Сайт: `http://127.0.0.1:8088/`. Compose собирает React/nginx, backend с моделью и PostgreSQL 16. Для остановки: `docker compose down`; без `-v`, если нужно сохранить данные. Та же общая конфигурация есть в nexus-docs; последовательно используйте один compose-проект.

Сборка единого JAR и остальные режимы — в [RUNBOOK](https://github.com/SMART-DATING/nexus-docs/blob/main/RUNBOOK.md).

## Основной путь

Регистрация → публичные интересы → основные сведения → вопросы/свободный рассказ → подтверждение текста → хотя бы одно фото → подбор → взаимность → чат. Подготовку можно отложить; checklist ведёт к конкретному недостающему действию.

Истории закрыты от других участников. Фото доступны в серверной квоте, заданной числом собственных снимков. Сходство относится к рассказам; город определяет приоритет группы. Некс использует подготовленные вопросы, а не генеративный диалог. Голос работает через возможности браузера и остаётся необязательным.

## Структура клиента

| Часть | Ответственность |
| --- | --- |
| `App.tsx`, `AppNavigation.tsx`, `api.ts` | Сессия, маршруты, загрузка и HTTP-контракты |
| `PublicHome`, `Landing*`, `landingMotion` | Публичная главная, примеры и переходы секций |
| `Onboarding`, `MatchingSetup`, `GuidedInterview`, `ContextEditor` | Темы, подготовка и личные истории |
| `PhotoUpload`, `PhotoGallery`, `PhotoViewer`, `useProfileMedia` | Управление своими фото, разрешённый просмотр и обновление ссылок |
| `SwipeDeck`, `ProfileCard`, `WelcomeSetup` | Подбор, реакции и недостающие шаги |
| `ChatMenu`, `ChatControls`, `DataControls` | Действия чата, блокировки и собственные данные |
| `Dialog`, `Toast`, `AmbientBackdrop`, `WaveGuide` | Общие состояния, диалоги, фон и персонаж |

Тесты расположены рядом с компонентами. Реализация в `src`; пустые ранние каталоги вне src не являются рабочими слоями приложения.

## Навигация и состояния

`/` — главная до входа / знакомства после входа; `/#login`, `/#register` — формы; `/#matches`, `/match/{id}` — беседы; `/#profile`, `/#profile/photos`, `/#profile/story` — анкета, фото и «Для подбора»; `/#notifications` — уведомления. Обновление и Back/Forward согласованы с экраном.

Сессия хранится в sessionStorage; текущие черновики — в памяти компонентов и не переживают перезагрузку. Доступ к ресурсам контролирует backend. Чат использует polling; скрытая вкладка не выполняет фоновые опросы. Анимация учитывает prefers-reduced-motion.

## Проверка

Выполните `npm test` и `npm run build`; затем ручной путь на широком и узком экране. HTTP smoke изменяет тестовую БД и не заменяет браузерную проверку. [Сценарии и ограничения](https://github.com/SMART-DATING/nexus-docs/blob/main/TESTING.md) · [CI](https://github.com/SMART-DATING/nexus-frontend/actions/workflows/ci.yml).

[Текущее состояние продукта](https://github.com/SMART-DATING/nexus-docs/blob/main/STATUS.md) · [Правила обработки данных](https://github.com/SMART-DATING/nexus-docs/blob/main/privacy/data-handling.md)
