'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('object_connections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ObjectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'objects', key: 'id' },
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('предшественник', 'последователь'),
        allowNull: false
      },
      RelObjId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'objects', key: 'id' },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('н-н', 'к-к', 'н-к', 'к-н'),
        allowNull: false
      }
    });

    await queryInterface.addIndex('object_connections', ['ObjectId']);
    await queryInterface.addIndex('object_connections', ['RelObjId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('object_connections');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_object_connections_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_object_connections_type";');
  }
};
