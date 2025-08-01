'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 🔄 Удаляем старый уникальный индекс
    await queryInterface.removeIndex('objects', 'objects_project_id_number');

    // ✅ Создаём новый уникальный индекс с parentId
    await queryInterface.addIndex('objects', ['projectId', 'number', 'parentId'], {
      unique: true,
      name: 'objects_project_number_parent'
    });
  },

  async down(queryInterface, Sequelize) {
    // 🔄 Откат: убираем новый индекс
    await queryInterface.removeIndex('objects', 'objects_project_number_parent');

    // ✅ Восстанавливаем старый уникальный индекс
    await queryInterface.addIndex('objects', ['projectId', 'number'], {
      unique: true,
      name: 'objects_project_id_number'
    });
  }
};
