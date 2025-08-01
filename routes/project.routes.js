const express = require('express');
const jwt = require('jsonwebtoken');
const { Project, User, Object, ProjectMember } = require('../models');
const router = express.Router();

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) {
            console.error('Ошибка проверки JWT:', err);
            return res.status(403).json({ message: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// GET /projects - получение проектов пользователя
// GET /projects - получение проектов пользователя
router.get('/projects', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        // 🔹 1. Проекты, созданные пользователем (владелец)
        const ownedProjects = await Project.findAll({
            where: { ownerId: currentUserId },
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'email', 'firstName', 'lastName']
            }]
        });

        // 🔹 2. Проекты, где пользователь состоит как участник
        const memberProjects = await Project.findAll({
            include: [
                {
                    model: User,
                    as: 'members',
                    where: { id: currentUserId },
                    attributes: []
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'email', 'firstName', 'lastName']
                }
            ]
        });

        // ✅ 3. Объединяем и удаляем дубликаты по ID
        const allProjects = [...ownedProjects, ...memberProjects];
        const uniqueProjects = Array.from(new Map(allProjects.map(p => [p.id, p])).values());

        res.json(uniqueProjects);

    } catch (error) {
        console.error('=== ОШИБКА ПОЛУЧЕНИЯ ПРОЕКТОВ ===');
        console.error('Тип ошибки:', error.name);
        console.error('Сообщение:', error.message);
        console.error('Стек:', error.stack);

        res.status(500).json({
            message: 'Ошибка при получении проектов',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// POST /projects - создание нового проекта
// POST /projects - создание нового проекта
router.post('/projects', authenticateToken, async (req, res) => {
    console.log('=== СОЗДАНИЕ ПРОЕКТА ===');
    console.log('Данные:', req.body);
    console.log('Пользователь:', req.user.userId);

    try {
        const { name, description, startDate, endDate } = req.body;

        // Валидация обязательных полей
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Название проекта обязательно'
            });
        }

        // Валидация дат
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end <= start) {
                return res.status(400).json({
                    message: 'Дата окончания должна быть позже даты начала'
                });
            }
        }

        const newProject = await Project.create({
            name: name.trim(),
            description: description || '',
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ownerId: req.user.userId, // Используем ownerId вместо UserId
            status: 'planning'
        });

        console.log('Проект создан с ID:', newProject.id);
        const exists = await ProjectMember.findOne({
            where: { userId: req.user.userId, projectId: newProject.id }
        });

        if (!exists) {
            await ProjectMember.create({
                projectId: newProject.id,
                userId: req.user.userId,
                role: 'manager'
            });
            console.log(`Владелец ${req.user.userId} добавлен как участник проекта ${newProject.id}`);
        }
        // Получаем созданный проект с данными владельца
        const projectWithOwner = await Project.findByPk(newProject.id, {
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'email', 'firstName', 'lastName']
            }]
        });

        res.status(201).json(projectWithOwner);

    } catch (error) {
        console.error('Ошибка создания проекта:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Ошибка валидации данных',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        res.status(500).json({
            message: 'Ошибка при создании проекта',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /projects/:id - удаление проекта
// DELETE /projects/:id - удаление проекта
router.delete('/projects/:id', authenticateToken, async (req, res) => {
    console.log('=== УДАЛЕНИЕ ПРОЕКТА ===');
    console.log('ID проекта:', req.params.id);
    console.log('Пользователь:', req.user.userId);

    try {
        const projectId = req.params.id;

        const project = await Project.findOne({
            where: {
                id: projectId,
                ownerId: req.user.userId // Используем ownerId вместо UserId
            }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Проект не найден или у вас нет прав на его удаление'
            });
        }

        await project.destroy();
        console.log('Проект удален:', projectId);

        res.json({ message: 'Проект успешно удален' });

    } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        res.status(500).json({
            message: 'Ошибка при удалении проекта',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/projects/:id', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;
        const currentUserId = req.user.userId;


        // 1️⃣ Ищем проект и проверяем доступ
        const project = await Project.findOne({
            where: { id: projectId },
            include: [
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'email', 'firstName', 'lastName']
                },
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'email', 'firstName', 'lastName']
                },
                {
                    model: Object,
                    as: 'objects',
                    separate: true,
                    order: [['number', 'ASC']],
                    include: [
                        { model: User, as: 'creator', attributes: ['id', 'email'] },
                        { model: User, as: 'members', attributes: ['id', 'email', 'firstName', 'lastName'] }
                    ]
                }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        // 2️⃣ Проверяем, есть ли доступ (владелец или участник)
        const isOwner = project.ownerId === currentUserId;
        const isMember = project.members.some(m => m.id === currentUserId);

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: 'У вас нет доступа к этому проекту' });
        }

        res.json(project);

    } catch (error) {
        console.error('Ошибка получения проекта:', error);
        res.status(500).json({ message: 'Ошибка при получении проекта' });
    }
});


module.exports = router;