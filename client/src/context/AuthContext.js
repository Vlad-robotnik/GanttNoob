import React, { createContext, useState, useCallback, useEffect } from 'react'

function noop() {}

export const AuthContext = createContext({
    token: null,
    userId: null,
    userData: null,
    login: noop,
    logout: noop,
    isAuthenticated: false
})

const storageName = 'userData'

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null)
    const [userId, setUserId] = useState(null)
    const [userData, setUserData] = useState(null)
    const [ready, setReady] = useState(false)

    const login = useCallback((jwtToken, id, user) => {
        setToken(jwtToken)
        setUserId(id)
        setUserData(user)
        
        localStorage.setItem(storageName, JSON.stringify({
            userId: id, 
            token: jwtToken,
            userData: user
        }))
    }, [])

    const logout = useCallback(() => {
        setToken(null)
        setUserId(null)
        setUserData(null)
        localStorage.removeItem(storageName)
    }, [])

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem(storageName))
        
        if (data && data.token) {
            login(data.token, data.userId, data.userData)
        }
        setReady(true)
    }, [login])

    return (
        <AuthContext.Provider value={{
            token, 
            login, 
            logout, 
            userId, 
            userData,
            isAuthenticated: !!token,
            ready
        }}>
            {children}
        </AuthContext.Provider>
    )
}