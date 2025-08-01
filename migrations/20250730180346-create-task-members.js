module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('task_members', {
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addConstraint('task_members', {
      fields: ['taskId', 'userId'],
      type: 'primary key',
      name: 'pk_task_members'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('task_members');
  }
};
