# GanttNoob

**GanttNoob** — это веб-сервис для командной работы с диаграммами Гантта.  
Он позволяет создавать проекты, управлять задачами, устанавливать зависимости и визуализировать рабочий процесс на интерактивной диаграмме.

---

## 🚀 Основной функционал

✅ Авторизация и регистрация пользователей  
✅ Создание / удаление / редактирование проектов  
✅ Добавление и удаление участников проектов  
✅ Отображение у пользователя всех проектов, в которых он участвует  
✅ Создание, редактирование и удаление объектов (вехи, задачи, подзадачи)  
✅ Установка параметров объектов (даты, длительность, исполнители и т.д.)  
✅ Назначение участников на задачи и подзадачи  
✅ Установка зависимостей между объектами  
✅ Отображение объектов на диаграмме Гантта  

---

## 🛠️ Технологии и версии

### Backend:
- **Node.js**
- **Express 5.1.0**
- **Sequelize 6.37.7**
- **PostgreSQL** (через `pg` 8.16.3 и `pg-hstore` 2.3.4)
- **bcryptjs 3.0.2** (хэширование паролей)
- **jsonwebtoken 9.0.2** (JWT-авторизация)
- **express-validator 7.2.1** (валидация)
- **config 4.0.1**

### Frontend:
- **React 19.1.0**
- **React DOM 19.1.0**
- **React Router DOM 7.7.0**
- **MaterializeCSS 1.0.0-rc.2** (UI)
- **frappe-gantt 1.0.3** (диаграмма Гантта)
- **Framer Motion**:
  - Backend: 12.23.9
  - Frontend: 10.16.4 (UI-анимации)

### Dev Tools:
- **Nodemon 3.1.10**
- **Concurrently 9.2.0**
- **Sequelize CLI 6.6.3**

---

## ⚠️ Известные ограничения и баги

❌ Нет редактирования параметров проекта (название, статус, сроки).  
❌ Изменения внутри проекта не отображаются на карточке на странице "Все проекты".  
❌ Отсутствует строгая валидация сроков (сроки проектов, задач и подзадач не связаны).  
❌ Возможность создавать любое количество зависимостей между двумя задачами.  
❌ При удалении задачи её подзадачи не удаляются, а поднимаются на верхний уровень (дубли номеров).  
❌ Визуальные баги с `position` (Materialize, frappe-gantt): элементы перекрывают модальные окна.  
❌ Таблица не масштабируется при больших значениях в ячейках.  
❌ Шкала "Месяцы" и "Годы" не отображает реальные значения.  

---

## 📌 Как запустить проект (Dev-режим)

1. Клонировать репозиторий:
   ```bash
   git clone https://github.com/username/ganttnoob.git
   cd ganttnoob


2. установить зависимости:
   ```bash
   npm install
   cd client && npm install

3. Настроить конфигурацию:

   Создать файл config/default.json

   Указать параметры подключения к PostgreSQL, JWT секрет и порт сервера:
   ```bash
      {
        "port": 5000,
        "db": {
          "host": "localhost",
          "database": "ganttnoob",
          "user": "postgres",
          "password": "your_password"
        },
        "jwtSecret": "your_jwt_secret"
      }


4. Запустить сервер и клиент одновременно:
   ```bash
    npm run dev


5. Перейти в браузере:
   ```bash
    http://localhost:3000


## 📡 Backend — основные функции

- **Авторизация и безопасность**
  - JWT-аутентификация
  - Хэширование паролей (bcryptjs)
  - Middleware auth.js для проверки токенов

- **User.js** 
  - CRUD проектов
  - Профиль пользователя с проектами и задачами
  - Обновление данных (валидация, проверка прав)
  - Деактивация пользователя (только админ) (Не реализованно на фронте)

- **Project.js**
  - CRUD проектов
  - Добавление владельца в участники автоматически
  - Получение всех проектов пользователя (владелец/участник)
  - Доступ к проекту только участникам

- **Object.js**
  -  CRUD объектов
  - Назначение участников на задачи
  - Зависимости между задачами
  - Иерархическая структура подзадач
  - Поля: статус, приоритет, прогресс, даты

## 🗄️ Структура базы данных

Проект использует **PostgreSQL** с ORM **Sequelize**. Ниже приведены основные таблицы и их связи.

### 📌 Таблица `users`
- `id` (PK, int, autoIncrement)
- `email` (string, unique)
- `password` (string)
- `firstName` (string)
- `lastName` (string)
- `avatar` (string, nullable)
- `role` (enum: admin / manager / user, default: user)
- `isActive` (boolean, default: true)
- timestamps: createdAt, updatedAt

**Связи:**
- 1:N → `projects` (как владелец)
- M:N → `projects` через `project_members`
- 1:N → `objects` (как создатель)
- M:N → `objects` через `object_members`

---

### 📌 Таблица `projects`
- `id` (PK, int, autoIncrement)
- `name` (string, not null)
- `description` (string, nullable)
- `status` (enum: planning / active / on-hold / completed / cancelled, default: planning)
- `startDate` (date)
- `endDate` (date)
- `progress` (int, default: 0)
- `isPublic` (boolean, default: false)
- `allowMemberInvite` (boolean, default: true)
- timestamps: createdAt, updatedAt

**Связи:**
- N:1 → `users` (ownerId)
- M:N → `users` через `project_members`
- 1:N → `objects`

---

### 📌 Таблица `project_members`
- `projectId` (FK → projects.id)
- `userId` (FK → users.id)
- `role` (enum: manager / developer / designer / tester / analyst, default: developer)
- `joinedAt` (date, default: now)

**Связи:**
- N:1 → `projects`
- N:1 → `users`

---

### 📌 Таблица `objects`
- `id` (PK, int, autoIncrement)
- `projectId` (FK → projects.id)
- `creatorId` (FK → users.id)
- `parentId` (FK → objects.id, nullable)
- `type` (enum: задача / веха, default: задача)
- `number` (int, not null)
- `name` (string, not null)
- `startDate` (date)
- `endDate` (date)
- `status` (enum: Открыт / В работе / Выполнено / Закрыт, default: Открыт)
- `progress` (int, default: 0)
- `description` (text)
- `priority` (enum: Самый низкий / Низкий / Средний / Высокий / Самый высокий, default: Средний)
- timestamps: createdAt, updatedAt

**Связи:**
- N:1 → `projects`
- N:1 → `users` (creator)
- N:1 → `objects` (parent)
- 1:N → `objects` (children)
- M:N → `users` через `object_members`
- 1:N → `object_connections` (как исходная задача)
- 1:N → `object_connections` (как связанная задача)

---

### 📌 Таблица `object_members`
- `objectId` (FK → objects.id)
- `userId` (FK → users.id)

**Связи:**
- N:1 → `objects`
- N:1 → `users`

---

### 📌 Таблица `object_connections`
- `id` (PK, int, autoIncrement)
- `ObjectId` (FK → objects.id)
- `RelObjId` (FK → objects.id)
- `role` (enum: предшественник / последователь)
- `type` (enum: н-н / к-к / н-к / к-н)

**Связи:**
- N:1 → `objects` (ObjectId)
- N:1 → `objects` (RelObjId)
## 📌 Основные функции фронтенда и бэкенда
**🔹 Авторизация и регистрация**
 - Фронтенд (AuthPage.js)
-loginHandler() — логин пользователя.
-API: POST /api/auth/login
-Роут: auth.routes.js → проверка email/пароля, генерация JWT.

 - Фронтенд (RegistrationPage.js)
-registerHandler() — регистрация нового пользователя.
-API: POST /api/auth/register
-Роут: auth.routes.js → валидация, хэширование пароля, создание пользователя.

**🔹 Проекты (AllProjectsPage.jsx)**
 - fetchProjects() — загрузка проектов пользователя.
-API: GET /api/projects
-Роут: project.routes.js → выборка проектов пользователя.

 - handleCreateProject() — создание проекта.
-API: POST /api/projects
-Роут: project.routes.js → создание проекта, добавление владельца в участники.

 - handleDeleteProject() — удаление проекта.
-API: DELETE /api/projects/:id
-Роут: project.routes.js → проверка прав владельца, удаление проекта.

**🔹 Диаграмма и задачи**
 ## DiagramPage.jsx
 - fetchProjectData() — получение данных проекта.
-API: GET /api/projects/:id
-Роут: project.routes.js → проверка доступа, возврат проекта.

 - fetchObjects() — загрузка задач проекта.
-API: GET /api/objects/project/:projectId
-Роут: object.routes.js → проверка доступа, возврат задач.

 - renumberObjects() — пересчёт номеров задач.
-API: PATCH /api/objects/:id
-Роут: object.routes.js → обновление полей задачи.

 - handleDeleteObject(id) — удаление задачи.
-API: DELETE /api/objects/:id
-Роут: object.routes.js → проверка прав, удаление объекта.

 - handleAddConnection() — создание зависимости.
-API: POST /api/connections
-Роут: connection.routes.js → проверка доступа, создание связи.

 - handleDeleteConnection() — удаление зависимости.
-API: DELETE /api/connections
-Роут: connection.routes.js → удаление связи.

ObjectModal.jsx
 - handleCreateObject() — создание новой задачи.
-API: POST /api/objects
-Роут: object.routes.js → создание объекта, проверка участников.

 - handleSaveChanges() — редактирование задачи.
-API: PATCH /api/objects/:id
-Роут: object.routes.js → обновление данных задачи.

 ## GanttChart.jsx
- handleDateChange() — обновление дат задачи drag-and-drop.
-API: PATCH /api/objects/:id
-Роут: object.routes.js → обновление дат задачи.

**🔹 Команда (MyTeamPage.jsx)**
 - fetchUsers() — загрузка списка пользователей с проектами.
-API: GET /api/team/users
-Роут: team.routes.js → возврат всех пользователей и проектов.

 - openAddModal() — получение доступных проектов для добавления пользователя.
-API: GET /api/team/:userId/available-projects
-Роут: team.routes.js → фильтр проектов.

 - addUserToProject() — добавление пользователя в проект.
-API: POST /api/team/add
-Роут: team.routes.js → добавление участника.

 - removeUserFromProject() — удаление пользователя из проекта.
-API: DELETE /api/team/remove
-Роут: team.routes.js → удаление участника.

