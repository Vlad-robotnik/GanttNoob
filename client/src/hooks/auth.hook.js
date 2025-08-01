import {useState, useCallback, useEffect} from 'react'

const storageName = 'userData'

export const useAuth = () => {
    const [token, setToken] = useState(null)
    const [userId, setUserId] = useState(null)
    const [userData, setUserData] = useState(null) // Добавляем userData

    const login = useCallback((jwtToken, id, user) => { // Добавляем параметр user
        setToken(jwtToken)
        setUserId(id)
        setUserData(user) // Сохраняем данные пользователя

        localStorage.setItem(storageName, JSON.stringify({
            userId: id, 
            token: jwtToken,
            userData: user // Сохраняем в localStorage
        }))
    }, [])

    const logout = useCallback(() => {
        setToken(null)
        setUserId(null)
        setUserData(null) // Очищаем данные пользователя
        localStorage.removeItem(storageName)
    }, [])

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem(storageName))

        if (data && data.token) {
            login(data.token, data.userId, data.userData) // Передаем userData при восстановлении
        }
    }, [login])

    return {login, logout, token, userId, userData} // Возвращаем userData
}