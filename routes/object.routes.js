const { Router } = require('express');
const { check, validationResult } = require('express-validator');
const { Project, User, Object } = require('../models');
const auth = require('../middleware/auth');

const router = Router();

// ✅ Создать объект (задачу/веху)
router.post('/', [
  auth,
  check('name', 'Название обязательно').notEmpty(),
  check('project', 'ID проекта обязателен').notEmpty().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Некорректные данные' });
    }

    const {
      name, number, startDate, endDate, status, progress,
      members, project, description, priority, type, parentId
    } = req.body;

    // ✅ Находим проект
    const projectDoc = await Project.findByPk(project, {
      include: ['members', 'owner']
    });
    if (!projectDoc) return res.status(404).json({ message: 'Проект не найден' });

    const userId = req.user.userId;
    const isOwner = projectDoc.ownerId === userId;
    const isMember = projectDoc.members.some(m => m.id === userId);
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    // ✅ Автоматические даты
    let finalStart = startDate || projectDoc.startDate;
    let finalEnd = endDate || projectDoc.endDate;

    // ✅ Проверка участников
    if (members && members.length > 0) {
      const validMembers = [projectDoc.ownerId, ...projectDoc.members.map(m => m.id)].map(Number);
      const invalid = members.find(m => !validMembers.includes(Number(m)));
      if (invalid) {
        return res.status(400).json({ message: 'Некоторые участники не входят в проект' });
      }
    }

    // ✅ Генерация номера с учётом вложенности
    let objectNumber;

    if (parentId) {
      const children = await Object.findAll({ where: { parentId } });
      objectNumber = children.length + 1; // ✅ обычный int для подзадачи
    } else {
      const maxObj = await Object.findOne({
        where: { projectId: project, parentId: null },
        order: [['number', 'DESC']]
      });
      objectNumber = maxObj ? maxObj.number + 1 : 1;
    }


    // ✅ Проверка на дубликаты в рамках проекта
    const where = parentId
      ? { parentId, number: objectNumber }
      : { projectId: project, parentId: null, number: objectNumber };

    const existing = await Object.findOne({ where });
    if (existing) {
      return res.status(400).json({ message: 'Объект с таким номером уже существует на этом уровне' });
    }


    // ✅ Создание объекта
    const object = await Object.create({
      name,
      number: objectNumber,
      type: type || 'задача',
      parentId: parentId || null,
      startDate: finalStart,
      endDate: finalEnd,
      status: status || 'Открыт',
      progress: progress || 0,
      projectId: project,
      description: description || '',
      priority: priority || 'Средний',
      creatorId: userId
    });

    // ✅ Участники
    if (members && members.length > 0) {
      const memberUsers = await User.findAll({ where: { id: members } });
      await object.addMembers(memberUsers);
    }

    const fullObject = await Object.findByPk(object.id, {
      include: ['members', 'creator', 'project']
    });
    res.status(201).json(fullObject);
  } catch (e) {
    console.error('Object creation error:', e);
    res.status(500).json({ message: 'Ошибка при создании объекта' });
  }
});
// ✅ Получить все объекты проекта
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findByPk(projectId, { include: ['members', 'owner'] });
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some(m => m.id === userId);
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    

    // Получаем объекты
    const objects = await Object.findAll({
      where: { projectId },
      include: ['members', 'creator', 'project'],
      order: [
        ['parentId', 'ASC NULLS FIRST'],
        ['number', 'ASC']
      ]
    });

    // Преобразуем в обычные объекты (чтобы не было проблем с Sequelize инстансами)
    const plainObjects = objects.map(obj => obj.get({ plain: true }));

    // Строим дерево с сортировкой по number на каждом уровне
    // Отправляем клиенту
    res.json(plainObjects);



  } catch (e) {
    console.error('Get project objects error:', e);
    res.status(500).json({ message: 'Ошибка при получении объектов' });
  }
});


// ✅ Удалить объект
router.delete('/:id', auth, async (req, res) => {
  try {
    const object = await Object.findByPk(req.params.id, { include: ['project'] });
    if (!object) return res.status(404).json({ message: 'Объект не найден' });

    const project = object.project;
    const userId = req.user.userId;
    const isOwner = project.ownerId === userId;
    const isCreator = object.creatorId === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Удаление запрещено' });
    }

    await object.destroy();
    res.json({ message: 'Объект удалён' });
  } catch (e) {
    console.error('Delete object error:', e);
    res.status(500).json({ message: 'Ошибка при удалении объекта' });
  }
});
router.patch('/:id', auth, async (req, res) => {
  try {
    const object = await Object.findByPk(req.params.id, {
      include: [
        { association: 'project', include: ['members', 'owner'] },
        'members'
      ]
    });
    if (!object) return res.status(404).json({ message: 'Объект не найден' });

    const project = object.project;
    const userId = req.user.userId;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some(m => m.id === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Обновление запрещено' });
    }

    const allowedFields = ['name', 'startDate', 'endDate', 'status', 'progress', 'description', 'priority', 'number'];
    const updates = {};

    // добавляем только переданные поля
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // обновляем основные поля
    await object.update(updates);

    // если пришли участники, обновляем их
    if (req.body.members) {
      const members = req.body.members;
      const validMembers = [project.ownerId, ...project.members.map(m => m.id)].map(Number);
      const invalid = members.find(m => !validMembers.includes(Number(m)));
      if (invalid) {
        return res.status(400).json({ message: 'Некоторые участники не входят в проект' });
      }
      const memberUsers = await User.findAll({ where: { id: members } });
      await object.setMembers(memberUsers);
    }

    const updated = await Object.findByPk(object.id, {
      include: ['members', 'creator', 'project']
    });

    res.json(updated);
  } catch (e) {
    console.error('Patch object error:', e);
    res.status(500).json({ message: 'Ошибка при обновлении объекта' });
  }
});

module.exports = router;
