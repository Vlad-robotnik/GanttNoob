import React, {useState, useEffect, useContext} from 'react'
import {useHttp} from '../hooks/http.hook'
import {useMessage} from '../hooks/message.hook'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export const RegistrationPage = () => {
    const auth = useContext(AuthContext)
    const message = useMessage()
    const {loading, error, request, clearError} = useHttp()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        email: '', 
        password: '', 
        firstName: '', 
        lastName: ''
    })

    useEffect(() => {
        message(error)
        clearError()
    }, [error, message, clearError])

    useEffect(() => {
        window.M.updateTextFields()
    }, [])

    const changeHandler = event => {
        setForm({ ...form, [event.target.name]: event.target.value })
    }
    
    const registerHandler = async () => {
        try {
            const data = await request('/api/auth/register', 'POST', {...form})
            message(data.message)
            // После успешной регистрации возвращаем на страницу входа
            navigate('/auth')
        } catch (e) {}
    }

    const backToLoginHandler = () => {
        navigate('/auth')
    }
    
    return (
        <div className="row">
            <div className="col s6 offset-s3">
                <h1>Ganttnoob</h1>
                <div className="card blue darken-1">
                    <div className="card-content white-text">
                        <span className="card-title">Регистрация</span>
                        <div>
                            <div className="input-field">
                                <input 
                                    placeholder="Введите имя" 
                                    id="firstName" 
                                    type="text" 
                                    name="firstName" 
                                    className="yellow-input" 
                                    onChange={changeHandler}
                                    value={form.firstName}
                                />
                                <label htmlFor="firstName">Имя</label>
                            </div>
                            
                            <div className="input-field">
                                <input 
                                    placeholder="Введите фамилию" 
                                    id="lastName" 
                                    type="text" 
                                    name="lastName" 
                                    className="yellow-input" 
                                    onChange={changeHandler}
                                    value={form.lastName}
                                />
                                <label htmlFor="lastName">Фамилия</label>
                            </div>

                            <div className="input-field">
                                <input 
                                    placeholder="Введите email" 
                                    id="email" 
                                    type="email" 
                                    name="email" 
                                    className="yellow-input" 
                                    onChange={changeHandler}
                                    value={form.email}
                                />
                                <label htmlFor="email">Email</label>
                            </div>
                            
                            <div className="input-field">
                                <input 
                                    placeholder="Введите пароль" 
                                    id="password" 
                                    type="password" 
                                    name="password" 
                                    className="yellow-input" 
                                    onChange={changeHandler}
                                    value={form.password}
                                />
                                <label htmlFor="password">Пароль</label>
                            </div>
                        </div>
                    </div>
                    <div className="card-action">
                        <button 
                            className="btn yellow darken-4" 
                            style={{marginRight: 10}}
                            onClick={registerHandler} 
                            disabled={loading}
                        >
                            Зарегистрироваться
                        </button>
                        <button 
                            className="btn gray lighten-1 black-text" 
                            onClick={backToLoginHandler} 
                            disabled={loading}
                        >
                            Назад к входу
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}