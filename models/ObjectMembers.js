const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ObjectMember = sequelize.define('ObjectMember', {
    objectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'objects', key: 'id' },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'object_members',
    timestamps: false
  });

  ObjectMember.associate = (models) => {
    ObjectMember.belongsTo(models.Object, { foreignKey: 'objectId', as: 'object' });
    ObjectMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ObjectMember;
};
