const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ObjectConnection = sequelize.define('ObjectConnection', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    ObjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'objects', key: 'id' },
      onDelete: 'CASCADE'
    },

    role: {
      type: DataTypes.ENUM('предшественник', 'последователь'),
      allowNull: false
    },

    RelObjId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'objects', key: 'id' },
      onDelete: 'CASCADE'
    },

    type: {
      type: DataTypes.ENUM('н-н', 'к-к', 'н-к', 'к-н'), // начало-начало, конец-конец, начало-конец, конец-начало
      allowNull: false
    }

  }, {
    tableName: 'object_connections',
    timestamps: false,
    indexes: [
      { fields: ['ObjectId'] },
      { fields: ['RelObjId'] }
    ]
  });

  ObjectConnection.associate = (models) => {
    ObjectConnection.belongsTo(models.Object, { as: 'object', foreignKey: 'ObjectId' });
    ObjectConnection.belongsTo(models.Object, { as: 'relatedObject', foreignKey: 'RelObjId' });
  };

  return ObjectConnection;
};
