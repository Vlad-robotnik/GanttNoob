'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_members', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('manager', 'developer', 'designer', 'tester', 'analyst'),
        allowNull: false,
        defaultValue: 'developer'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    // Добавляем уникальный индекс по userId и projectId для предотвращения дублирования
    await queryInterface.addIndex('project_members', ['userId', 'projectId'], {
      unique: true,
      name: 'project_members_userId_projectId_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_members');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_project_members_role;');
  }
};
