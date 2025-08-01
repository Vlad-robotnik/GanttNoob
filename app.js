const express = require('express');
const config = require('config');
const sequelize = require('./db'); // ваш файл с инициализацией Sequelize
const app = express();

app.use(express.json({ extended: true }));

// Маршруты - ИСПРАВЛЕНО: убрали /projects из префикса
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/objects', require('./routes/object.routes'));
app.use('/api/team', require('./routes/team.routes'));
app.use('/api', require('./routes/project.routes')); // Изменено с /api/projects на /api
app.use('/api/connections', require('./routes/connection.routes')); 

// Добавим тестовый маршрут для проверки
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const PORT = config.get('port') || 5000;

async function start() {
  try {
    console.log('[INIT] Connecting to PostgreSQL...');

    // Подключаемся и синхронизируем модели (опционально, для dev)
    await sequelize.authenticate();
    console.log('[OK] PostgreSQL connected');

    // Синхронизация моделей с базой (в проде лучше использовать миграции)
    await sequelize.sync({ alter: true }); 

    console.log('[INFO] Available routes:');
    console.log('  GET  /api/projects');
    console.log('  POST /api/projects');
    console.log('  DELETE /api/projects/:id');

    app.listen(PORT, () => {
      console.log(`App has been started on port ${PORT}...`);
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (e) {
    console.log('Server Error', e.message);
    console.error(e);
    process.exit(1);
  }
}

start();