const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ObjectModel = sequelize.define('Object', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    type: {
      type: DataTypes.ENUM('задача', 'веха'),
      allowNull: false,
      defaultValue: 'задача'
    },

    number: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },

    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },

    status: {
      type: DataTypes.ENUM('Открыт', 'В работе', 'Выполнено', 'Закрыт'),
      defaultValue: 'Открыт'
    },

    progress: { type: DataTypes.INTEGER, defaultValue: 0 },
    description: { type: DataTypes.TEXT },

    priority: {
      type: DataTypes.ENUM('Самый низкий', 'Низкий', 'Средний', 'Высокий', 'Самый высокий'),
      defaultValue: 'Средний'
    }
  }, {
    tableName: 'objects',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['projectId', 'number', 'parentId'] },
      { fields: ['parentId'] },
      { fields: ['status'] },
      { fields: ['priority'] }
    ]
  });

  ObjectModel.associate = (models) => {
    ObjectModel.belongsTo(models.Project, { as: 'project', foreignKey: 'projectId' });
    ObjectModel.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });

    // Родительские задачи
    ObjectModel.belongsTo(models.Object, { as: 'parent', foreignKey: 'parentId' });
    ObjectModel.hasMany(models.Object, { as: 'children', foreignKey: 'parentId' });
    ObjectModel.hasMany(models.ObjectConnection, { as: 'connections', foreignKey: 'ObjectId' });
    ObjectModel.hasMany(models.ObjectConnection, { as: 'relatedConnections', foreignKey: 'RelObjId' });
    // Участники
    ObjectModel.belongsToMany(models.User, {
      through: models.ObjectMember,
      as: 'members',
      foreignKey: 'objectId',
      otherKey: 'userId'
    });
  };

  return ObjectModel;
};
