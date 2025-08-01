const { Router } = require('express');
const { check, validationResult } = require('express-validator');
const { User, Project, Object } = require('../models'); // Импорт Sequelize моделей
const auth = require('../middleware/auth');
const router = Router();

// Получить всех пользователей
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password'] },
      include: [
        { model: Project, as: 'ownedProjects', attributes: ['id', 'name', 'status'] },
        { model: Project, as: 'memberProjects', attributes: ['id', 'name', 'status'] },
      ]
    });

    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка при получении пользователей' });
  }
});

// Получить пользователя по ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Project, as: 'ownedProjects' },
        { model: Project, as: 'memberProjects' },
        { model: Object, as: 'createdObjects' },
        { model: Object, as: 'assignedObjects' },
        { model: Object, as: 'objects' } // через object_members
      ]
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка при получении пользователя' });
  }
});

// Обновить пользователя
router.put('/:id', [
  auth,
  check('firstName').optional().notEmpty().withMessage('Имя не может быть пустым'),
  check('lastName').optional().notEmpty().withMessage('Фамилия не может быть пустой'),
  check('email').optional().isEmail().withMessage('Некорректный email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: 'Некорректные данные' });
    }

    const { firstName, lastName, avatar, role, email } = req.body;
    const currentUser = await User.findByPk(req.user.userId);

    if (req.params.id !== String(req.user.userId) && currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatar) updateData.avatar = avatar;
    if (email) updateData.email = email;
    if (role && currentUser.role === 'admin') updateData.role = role;

    const user = await User.update(updateData, {
      where: { id: req.params.id },
      returning: true
    });

    if (!user[1][0]) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user[1][0]);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email уже используется' });
    }
    res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
  }
});

// Деактивировать пользователя
router.delete('/:id', auth, async (req, res) => {
  try {
    const currentUser = await User.findByPk(req.user.userId);

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    const [updated] = await User.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь деактивирован' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка при удалении пользователя' });
  }
});

module.exports = router;
