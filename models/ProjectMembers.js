const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectMember = sequelize.define('ProjectMember', {
    role: {
      type: DataTypes.ENUM('manager', 'developer', 'designer', 'tester', 'analyst'),
      defaultValue: 'developer'
    },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'project_members',
    timestamps: false
  });

  ProjectMember.associate = (models) => {
    ProjectMember.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    ProjectMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ProjectMember;
};
