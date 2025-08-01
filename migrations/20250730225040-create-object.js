'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ 1. Создаём таблицу objects
    await queryInterface.createTable('objects', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

      type: {
        type: Sequelize.ENUM('задача', 'веха'),
        allowNull: false,
        defaultValue: 'задача'
      },

      number: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },

      startDate: { type: Sequelize.DATE, allowNull: false },
      endDate: { type: Sequelize.DATE, allowNull: false },

      status: {
        type: Sequelize.ENUM('Открыт', 'В работе', 'Выполнено', 'Закрыт'),
        defaultValue: 'Открыт'
      },

      progress: { type: Sequelize.INTEGER, defaultValue: 0 },
      description: { type: Sequelize.TEXT },

      priority: {
        type: Sequelize.ENUM('Самый низкий', 'Низкий', 'Средний', 'Высокий', 'Самый высокий'),
        defaultValue: 'Средний'
      },

      projectId: { type: Sequelize.INTEGER, allowNull: false },
      parentId: { type: Sequelize.INTEGER, references: { model: 'objects', key: 'id' }, onDelete: 'SET NULL' },
      creatorId: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },

      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    // ✅ Индексы
    await queryInterface.addIndex('objects', ['projectId', 'number'], { unique: true });
    await queryInterface.addIndex('objects', ['parentId']);
    await queryInterface.addIndex('objects', ['status']);
    await queryInterface.addIndex('objects', ['priority']);

    // ✅ 2. Создаём таблицу object_members
    await queryInterface.createTable('object_members', {
      objectId: {
        type: Sequelize.INTEGER,
        references: { model: 'objects', key: 'id' },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      }
    });

    // ✅ 3. Удаляем старые таблицы
    await queryInterface.dropTable('task_members');
    await queryInterface.dropTable('task_subtasks');
    await queryInterface.dropTable('tasks');
  },

  async down(queryInterface, Sequelize) {
    // 🔄 Откат: восстанавливаем старые таблицы
    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: Sequelize.STRING,
      number: Sequelize.INTEGER,
      startDate: Sequelize.DATE,
      endDate: Sequelize.DATE,
      status: Sequelize.ENUM('открыта', 'в работе', 'выполнена'),
      progress: Sequelize.INTEGER,
      description: Sequelize.TEXT,
      priority: Sequelize.ENUM('низкий', 'средний', 'высокий', 'критический'),
      projectId: Sequelize.INTEGER,
      assigneeId: Sequelize.INTEGER,
      creatorId: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });

    await queryInterface.createTable('task_members', {
      taskId: Sequelize.INTEGER,
      userId: Sequelize.INTEGER
    });

    await queryInterface.createTable('task_subtasks', {
      taskId: Sequelize.INTEGER,
      subtaskId: Sequelize.INTEGER
    });

    await queryInterface.dropTable('object_members');
    await queryInterface.dropTable('objects');
  }
};
