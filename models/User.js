const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('admin', 'manager', 'user'), defaultValue: 'user' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.Project, { as: 'ownedProjects', foreignKey: 'ownerId' });
    User.belongsToMany(models.Project, {
      through: models.ProjectMember,
      as: 'memberProjects',
      foreignKey: 'userId',
      otherKey: 'projectId'
    });
    User.hasMany(models.Object, { as: 'createdObjects', foreignKey: 'creatorId' });
    User.belongsToMany(models.Object, {
      through: models.ObjectMember,
      as: 'objects',
      foreignKey: 'userId',
      otherKey: 'objectId'
    });
  };

  return User;
};
