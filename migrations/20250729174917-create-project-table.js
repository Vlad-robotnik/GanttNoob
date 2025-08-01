'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Создаем таблицу projects
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planning'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      allowMemberInvite: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',  // таблица users должна быть уже создана
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Индексы для оптимизации поиска по ownerId и status
    await queryInterface.addIndex('projects', ['ownerId', 'status'], {
      name: 'projects_ownerId_status_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('projects');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_projects_status;');
  }
};
