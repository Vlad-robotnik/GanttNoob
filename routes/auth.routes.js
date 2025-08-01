const { Router } = require('express')
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const router = Router()

// Импорт модели
const { User } = require('../models')

// Регистрация
router.post(
    '/register',
    [
        check('email', 'Некорректный email').isEmail(),
        check('password', 'Минимальная длина пароля — 6 символов').isLength({ min: 6 }),
        check('firstName', 'Имя обязательно').notEmpty(),
        check('lastName', 'Фамилия обязательна').notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при регистрации'
                })
            }

            const { email, password, firstName, lastName, role } = req.body

            const existingUser = await User.findOne({ where: { email } })
            if (existingUser) {
                return res.status(400).json({ message: 'Такой пользователь уже существует' })
            }

            const hashedPassword = await bcrypt.hash(password, 12)

            const user = await User.create({
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'user',
                isActive: true // если поле есть
            })

            console.log('Создание токена с SECRET:', config.get('jwtSecret'))

            const token = jwt.sign(
                { userId: user.id },
                config.get('jwtSecret'),
                { expiresIn: '24h' }
            )
            console.log('Создан токен:', token);
            console.log('Payload токена:', { userId: user.id });

            res.status(201).json({
                message: 'Пользователь создан',
                token,
                userId: user.id,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            })

        } catch (e) {
            console.error('Ошибка при регистрации:', e)
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
        }
    }
)

// Логин
router.post(
    '/login',
    [
        check('email', 'Введите корректный email').isEmail(),
        check('password', 'Введите пароль').exists().isLength({ min: 6 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при входе в систему'
                })
            }

            const { email, password } = req.body
            console.log('Email from request:', email)

            const user = await User.findOne({ where: { email } })

            if (!user) {
                return res.status(400).json({ message: 'Пользователь не найден' })
            }

            if (!user.isActive) {
                return res.status(400).json({ message: 'Пользователь деактивирован' })
            }

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(400).json({ message: 'Неверный пароль' })
            }

            const token = jwt.sign(
                { userId: user.id },
                config.get('jwtSecret'),
                { expiresIn: '24h' }
            )
            console.log('Создан токен:', token);
            console.log('Payload токена:', { userId: user.id });

            res.json({
                token,
                userId: user.id,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            })

        } catch (e) {
            console.error('Ошибка при входе:', e)
            res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
        }
    }
)

module.exports = router
