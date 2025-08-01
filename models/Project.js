const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(1000), allowNull: true },
    status: { type: DataTypes.ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled'), defaultValue: 'planning' },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    progress: { type: DataTypes.INTEGER, defaultValue: 0 },
    isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
    allowMemberInvite: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'projects',
    timestamps: true
  });

  Project.associate = (models) => {
    Project.belongsTo(models.User, { as: 'owner', foreignKey: 'ownerId' });

    Project.belongsToMany(models.User, {
      through: models.ProjectMember,
      as: 'members',
      foreignKey: 'projectId',
      otherKey: 'userId'
    });

    Project.hasMany(models.Object, { as: 'objects', foreignKey: 'projectId' });
  };

  return Project;
};
