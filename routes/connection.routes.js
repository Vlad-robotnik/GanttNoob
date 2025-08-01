const express = require('express');
const router = express.Router();
const { Project, Object, ObjectConnection, User } = require('../models');
const auth = require('../middleware/auth');

// 🔹 Проверка, что пользователь имеет доступ к объекту
async function checkAccess(objectId, userId) {
  const obj = await Object.findByPk(objectId, {
    include: [{ association: 'project', include: ['members', 'owner'] }]
  });
  if (!obj) return { allowed: false, object: null };

  const project = obj.project;
  const isOwner = project.ownerId === userId;
  const isMember = project.members.some(m => m.id === userId);

  return { allowed: isOwner || isMember, object: obj };
}

// ✅ Создать связь
router.post('/', auth, async (req, res) => {
  try {
    const { ObjectId, RelObjId, type } = req.body;
    const userId = req.user.userId;

    if (!ObjectId || !RelObjId || !type) {
      return res.status(400).json({ error: 'ObjectId, RelObjId и type обязательны' });
    }

    // 🔹 Проверяем доступ к обоим объектам
    const access1 = await checkAccess(ObjectId, userId);
    const access2 = await checkAccess(RelObjId, userId);
    if (!access1.allowed || !access2.allowed) {
      return res.status(403).json({ error: 'Нет доступа к объектам проекта' });
    }

    await ObjectConnection.sequelize.transaction(async (t) => {
      await ObjectConnection.bulkCreate([
        { ObjectId, RelObjId, type, role: 'предшественник' },
        { ObjectId: RelObjId, RelObjId: ObjectId, type, role: 'последователь' }
      ], { transaction: t });
    });

    res.json({ message: 'Связь успешно создана' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании связи' });
  }
});

// ✅ Получить связи объекта
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { allowed } = await checkAccess(req.params.id, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'Нет доступа к проекту' });
    }

    const connections = await ObjectConnection.findAll({
      where: { ObjectId: req.params.id },
      include: [{ model: Object, as: 'relatedObject' }]
    });

    res.json(connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении связей' });
  }
});

// ✅ Удалить связь
router.delete('/', auth, async (req, res) => {
  try {
    const { ObjectId, RelObjId } = req.body;
    const userId = req.user.userId;

    if (!ObjectId || !RelObjId) {
      return res.status(400).json({ error: 'ObjectId и RelObjId обязательны' });
    }

    const access1 = await checkAccess(ObjectId, userId);
    const access2 = await checkAccess(RelObjId, userId);
    if (!access1.allowed || !access2.allowed) {
      return res.status(403).json({ error: 'Нет доступа к проекту' });
    }

    await ObjectConnection.sequelize.transaction(async (t) => {
      await ObjectConnection.destroy({ where: { ObjectId, RelObjId }, transaction: t });
      await ObjectConnection.destroy({ where: { ObjectId: RelObjId, RelObjId: ObjectId }, transaction: t });
    });

    res.json({ message: 'Связь удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении связи' });
  }
});

// ✅ Обновить связь
router.patch('/', auth, async (req, res) => {
  try {
    const { ObjectId, RelObjId, type } = req.body;
    const userId = req.user.userId;

    if (!ObjectId || !RelObjId || !type) {
      return res.status(400).json({ error: 'ObjectId, RelObjId и новый type обязательны' });
    }

    const access1 = await checkAccess(ObjectId, userId);
    const access2 = await checkAccess(RelObjId, userId);
    if (!access1.allowed || !access2.allowed) {
      return res.status(403).json({ error: 'Нет доступа к проекту' });
    }

    await ObjectConnection.sequelize.transaction(async (t) => {
      await ObjectConnection.update({ type }, { where: { ObjectId, RelObjId }, transaction: t });
      await ObjectConnection.update({ type }, { where: { ObjectId: RelObjId, RelObjId: ObjectId }, transaction: t });
    });

    res.json({ message: 'Связь обновлена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении связи' });
  }
});

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;

    // Проверка доступа: находим проект
    const project = await Project.findByPk(projectId, {
      include: ['members', 'owner']
    });
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some(m => m.id === userId);
    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Нет доступа к проекту' });
    }

    // Получаем все связи для объектов этого проекта
    const connections = await ObjectConnection.findAll({
      include: [
        { model: Object, as: 'object', attributes: ['id', 'projectId'] },
        { model: Object, as: 'relatedObject', attributes: ['id', 'projectId'] }
      ]
    });

    // Фильтруем только те, что относятся к этому проекту
    const filtered = connections.filter(conn =>
      conn.object.projectId === parseInt(projectId) &&
      conn.relatedObject.projectId === parseInt(projectId)
    );

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении связей проекта' });
  }
});

module.exports = router;
