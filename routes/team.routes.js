const express = require('express');
const router = express.Router();
const { User, Project, ProjectMember } = require('../models');
const authMiddleware = require('../middleware/auth');

// ✅ Функция для безопасного получения текущего userId
function getCurrentUserId(req) {
    return req.user?.id || req.user?.userId || null;
}

// ✅ 1. Получить всех активных пользователей с проектами
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { isActive: true },
            include: [
                {
                    model: Project,
                    as: 'memberProjects',
                    attributes: ['id', 'name', 'ownerId'],
                    through: { attributes: ['role'] }
                }
            ],
            attributes: ['id', 'firstName', 'lastName', 'email']
        });
        res.json(users);
    } catch (err) {
        console.error('Ошибка /users:', err);
        res.status(500).json({ message: 'Ошибка получения пользователей' });
    }
});

// ✅ 2. Получить проекты владельца, в которых еще нет конкретного пользователя
router.get('/:userId/available-projects', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = getCurrentUserId(req);

        if (!currentUserId) {
            console.log('req.user:', req.user);
            return res.status(401).json({ message: 'Не удалось определить ID пользователя' });
        }

        const ownerProjects = await Project.findAll({
            where: { ownerId: currentUserId },
            attributes: ['id', 'name']
        });

        const user = await User.findByPk(userId, {
            include: [{ model: Project, as: 'memberProjects', attributes: ['id'] }]
        });

        const userProjectIds = user.memberProjects.map(p => p.id);
        const available = ownerProjects.filter(p => !userProjectIds.includes(p.id));

        res.json(available);
    } catch (err) {
        console.error('Ошибка /available-projects:', err);
        res.status(500).json({ message: 'Ошибка получения доступных проектов' });
    }
});

// ✅ 3. Добавить пользователя в проект
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { userId, projectId } = req.body;
        const currentUserId = getCurrentUserId(req);

        if (!currentUserId) {
            console.log('req.user:', req.user);
            return res.status(401).json({ message: 'Не удалось определить ID пользователя' });
        }

        const project = await Project.findByPk(projectId);
        if (!project || project.ownerId !== currentUserId) {
            return res.status(403).json({ message: 'Нет доступа для добавления в этот проект' });
        }

        const exists = await ProjectMember.findOne({ where: { userId, projectId } });
        if (exists) return res.status(400).json({ message: 'Пользователь уже состоит в проекте' });

        await ProjectMember.create({ userId, projectId });
        res.json({ message: 'Пользователь добавлен в проект' });
    } catch (err) {
        console.error('Ошибка /add:', err);
        res.status(500).json({ message: 'Ошибка добавления пользователя в проект' });
    }
});

// ✅ 4. Удалить пользователя из проекта
router.delete('/remove', authMiddleware, async (req, res) => {
    try {
        const { userId, projectId } = req.body;
        const currentUserId = getCurrentUserId(req);

        if (!currentUserId) {
            console.log('req.user:', req.user);
            return res.status(401).json({ message: 'Не удалось определить ID пользователя' });
        }

        const project = await Project.findByPk(projectId);
        if (!project || project.ownerId !== currentUserId) {
            return res.status(403).json({ message: 'Нет доступа для удаления из этого проекта' });
        }

        await ProjectMember.destroy({ where: { userId, projectId } });
        res.json({ message: 'Пользователь удален из проекта' });
    } catch (err) {
        console.error('Ошибка /remove:', err);
        res.status(500).json({ message: 'Ошибка удаления пользователя из проекта' });
    }
});

module.exports = router;
