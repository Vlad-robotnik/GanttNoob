const { Project, User, Object } = require('../models');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');

class ProjectController {
    // Получить все проекты пользователя
    static async getAllProjects(req, res) {
        try {
            const userId = req.user.id;
            
            // Получаем проекты где пользователь является владельцем или участником
            const projects = await Project.findAll({
                where: {
                    [Project.sequelize.Sequelize.Op.or]: [
                        { ownerId: userId }, // Проекты где пользователь владелец
                        { '$Users.id$': userId } // Проекты где пользователь участник
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id', 'email', 'name']
                    },
                    {
                        model: User,
                        attributes: ['id', 'email', 'name'],
                        through: {
                            model: ProjectMember,
                            attributes: ['role', 'joinedAt']
                        }
                    }
                ],
                order: [['updatedAt', 'DESC']]
            });
            
            // Форматируем данные для фронтенда
            const formattedProjects = projects.map(project => ({
                _id: project.id, // Для совместимости с фронтендом
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                progress: project.progress,
                isPublic: project.isPublic,
                allowMemberInvite: project.allowMemberInvite,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                owner: project.owner,
                members: project.Users || [],
                settings: { 
                    color: '#3b82f6' // Можете добавить поле color в модель если нужно
                }
            }));
            
            console.log('Загружены проекты для пользователя:', userId, 'Количество:', formattedProjects.length);
            res.json(formattedProjects);
        } catch (error) {
            console.error('Ошибка при получении проектов:', error);
            res.status(500).json({ 
                message: 'Ошибка при получении проектов',
                error: error.message 
            });
        }
    }

    // Создать новый проект
    static async createProject(req, res) {
        try {
            const userId = req.user.id;
            const { name, description, startDate, endDate, settings } = req.body;

            console.log('Создание проекта:', { name, description, startDate, endDate, settings, userId });

            // Валидация
            if (!name || name.trim() === '') {
                return res.status(400).json({ 
                    message: 'Название проекта обязательно' 
                });
            }

            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    message: 'Даты начала и окончания проекта обязательны' 
                });
            }

            // Создаем проект
            const newProject = await Project.create({
                name: name.trim(),
                description: description || '',
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                ownerId: userId,
                status: 'planning'
            });

            // Получаем созданный проект с владельцем
            const projectWithOwner = await Project.findByPk(newProject.id, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id', 'email', 'name']
                    }
                ]
            });

            // Форматируем ответ для совместимости с фронтендом
            const formattedProject = {
                _id: projectWithOwner.id,
                id: projectWithOwner.id,
                name: projectWithOwner.name,
                description: projectWithOwner.description,
                status: projectWithOwner.status,
                startDate: projectWithOwner.startDate,
                endDate: projectWithOwner.endDate,
                progress: projectWithOwner.progress,
                isPublic: projectWithOwner.isPublic,
                allowMemberInvite: projectWithOwner.allowMemberInvite,
                createdAt: projectWithOwner.createdAt,
                updatedAt: projectWithOwner.updatedAt,
                owner: projectWithOwner.owner,
                members: [],
                settings: settings || { color: '#3b82f6' }
            };

            console.log('Проект создан:', formattedProject);
            res.status(201).json(formattedProject);
        } catch (error) {
            console.error('Ошибка при создании проекта:', error);
            res.status(500).json({ 
                message: 'Ошибка при создании проекта',
                error: error.message 
            });
        }
    }

    // Получить проект по ID
    static async getProjectById(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.id;

            const project = await Project.findOne({
                where: {
                    id: projectId,
                    [Project.sequelize.Sequelize.Op.or]: [
                        { ownerId: userId },
                        { '$Users.id$': userId }
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id', 'email', 'name']
                    },
                    {
                        model: User,
                        attributes: ['id', 'email', 'name'],
                        through: {
                            model: ProjectMember,
                            attributes: ['role', 'joinedAt']
                        }
                    }
                ]
            });

            if (!project) {
                return res.status(404).json({ 
                    message: 'Проект не найден' 
                });
            }

            const formattedProject = {
                _id: project.id,
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                progress: project.progress,
                isPublic: project.isPublic,
                allowMemberInvite: project.allowMemberInvite,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                owner: project.owner,
                members: project.Users || [],
                settings: { color: '#3b82f6' }
            };

            res.json(formattedProject);
        } catch (error) {
            console.error('Ошибка при получении проекта:', error);
            res.status(500).json({ 
                message: 'Ошибка при получении проекта',
                error: error.message 
            });
        }
    }

    // Обновить проект
    static async updateProject(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.id;
            const { name, description, startDate, endDate, status } = req.body;

            // Находим проект и проверяем права доступа
            const project = await Project.findOne({
                where: {
                    id: projectId,
                    ownerId: userId // Только владелец может изменять проект
                }
            });

            if (!project) {
                return res.status(404).json({ 
                    message: 'Проект не найден или у вас нет прав на его изменение' 
                });
            }

            // Обновляем проект
            await project.update({
                name: name || project.name,
                description: description !== undefined ? description : project.description,
                startDate: startDate ? new Date(startDate) : project.startDate,
                endDate: endDate ? new Date(endDate) : project.endDate,
                status: status || project.status
            });

            // Получаем обновленный проект с владельцем
            const updatedProject = await Project.findByPk(project.id, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['id', 'email', 'name']
                    },
                    {
                        model: User,
                        attributes: ['id', 'email', 'name'],
                        through: {
                            model: ProjectMember,
                            attributes: ['role', 'joinedAt']
                        }
                    }
                ]
            });

            const formattedProject = {
                _id: updatedProject.id,
                id: updatedProject.id,
                name: updatedProject.name,
                description: updatedProject.description,
                status: updatedProject.status,
                startDate: updatedProject.startDate,
                endDate: updatedProject.endDate,
                progress: updatedProject.progress,
                isPublic: updatedProject.isPublic,
                allowMemberInvite: updatedProject.allowMemberInvite,
                createdAt: updatedProject.createdAt,
                updatedAt: updatedProject.updatedAt,
                owner: updatedProject.owner,
                members: updatedProject.Users || [],
                settings: { color: '#3b82f6' }
            };

            res.json(formattedProject);
        } catch (error) {
            console.error('Ошибка при обновлении проекта:', error);
            res.status(500).json({ 
                message: 'Ошибка при обновлении проекта',
                error: error.message 
            });
        }
    }

    // Удалить проект
    static async deleteProject(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.id;

            console.log('Удаление проекта:', projectId, 'пользователем:', userId);

            // Находим проект и проверяем права доступа
            const project = await Project.findOne({
                where: {
                    id: projectId,
                    ownerId: userId // Только владелец может удалить проект
                }
            });

            if (!project) {
                return res.status(404).json({ 
                    message: 'Проект не найден или у вас нет прав на его удаление' 
                });
            }

            // Удаляем связанные записи участников (если есть каскадное удаление, это может быть не нужно)
            await ProjectMember.destroy({
                where: { projectId: projectId }
            });

            // Удаляем проект
            await project.destroy();

            console.log('Проект успешно удален:', projectId);
            res.json({ 
                message: 'Проект успешно удален',
                projectId: projectId 
            });
        } catch (error) {
            console.error('Ошибка при удалении проекта:', error);
            res.status(500).json({ 
                message: 'Ошибка при удалении проекта',
                error: error.message 
            });
        }
    }

    // Получить статистику проекта
    static async getProjectStats(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.id;

            // Проверяем доступ к проекту
            const project = await Project.findOne({
                where: {
                    id: projectId,
                    [Project.sequelize.Sequelize.Op.or]: [
                        { ownerId: userId },
                        { '$Users.id$': userId }
                    ]
                },
                include: [
                    {
                        model: User,
                        attributes: ['id'],
                        through: { attributes: [] }
                    }
                ]
            });

            if (!project) {
                return res.status(404).json({ 
                    message: 'Проект не найден' 
                });
            }

            // Подсчитываем статистику
            const stats = {
                totalTasks: 0, // Можно добавить подсчет задач если есть модель Task
                completedTasks: 0,
                members: project.Users ? project.Users.length : 0,
                progress: project.progress || 0
            };

            res.json(stats);
        } catch (error) {
            console.error('Ошибка при получении статистики проекта:', error);
            res.status(500).json({ 
                message: 'Ошибка при получении статистики проекта',
                error: error.message 
            });
        }
    }

    // Добавить участника в проект
    static async addMemberToProject(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.id;
            const { memberId, role = 'developer' } = req.body;

            // Проверяем, является ли пользователь владельцем проекта
            const project = await Project.findOne({
                where: {
                    id: projectId,
                    ownerId: userId
                }
            });

            if (!project) {
                return res.status(404).json({ 
                    message: 'Проект не найден или у вас нет прав на добавление участников' 
                });
            }

            // Проверяем, существует ли пользователь
            const user = await User.findByPk(memberId);
            if (!user) {
                return res.status(404).json({ 
                    message: 'Пользователь не найден' 
                });
            }

            // Проверяем, не является ли пользователь уже участником
            const existingMember = await ProjectMember.findOne({
                where: {
                    projectId: projectId,
                    userId: memberId
                }
            });

            if (existingMember) {
                return res.status(400).json({ 
                    message: 'Пользователь уже является участником проекта' 
                });
            }

            // Добавляем участника
            await ProjectMember.create({
                projectId: projectId,
                userId: memberId,
                role: role
            });

            res.json({ 
                message: 'Участник успешно добавлен в проект' 
            });
        } catch (error) {
            console.error('Ошибка при добавлении участника:', error);
            res.status(500).json({ 
                message: 'Ошибка при добавлении участника',
                error: error.message 
            });
        }
    }

    // Удалить участника из проекта
    static async removeMemberFromProject(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.id;
            const memberId = req.params.memberId;

            // Проверяем, является ли пользователь владельцем проекта
            const project = await Project.findOne({
                where: {
                    id: projectId,
                    ownerId: userId
                }
            });

            if (!project) {
                return res.status(404).json({ 
                    message: 'Проект не найден или у вас нет прав на удаление участников' 
                });
            }

            // Удаляем участника
            const deletedCount = await ProjectMember.destroy({
                where: {
                    projectId: projectId,
                    userId: memberId
                }
            });

            if (deletedCount === 0) {
                return res.status(404).json({ 
                    message: 'Участник не найден в проекте' 
                });
            }

            res.json({ 
                message: 'Участник успешно удален из проекта' 
            });
        } catch (error) {
            console.error('Ошибка при удалении участника:', error);
            res.status(500).json({ 
                message: 'Ошибка при удалении участника',
                error: error.message 
            });
        }
    }
}

module.exports = ProjectController;