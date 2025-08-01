import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { useCurrentProject } from '../../context/CurrentProjectContext'
import '../../styles/AllProjectsPage.css';

const AllProjectsPage = () => {
    const { token } = useContext(AuthContext)
    const navigate = useNavigate()
    const { setCurrentProjectId, currentProjectId } = useCurrentProject()

    console.log('AllProjectsPage - currentProjectId:', currentProjectId);
    console.log('AllProjectsPage - setCurrentProjectId:', setCurrentProjectId);

    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        color: '#3b82f6'
    })

    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ]

    useEffect(() => {
        if (token) {
            fetchProjects()
        } else {
            setLoading(false)
            setError('Необходимо войти в систему')
        }
    }, [token])

    const fetchProjects = async () => {
        try {
            setError(null)
            console.log('Токен из контекста:', token?.substring(0, 20) + '...')

            if (!token) {
                console.log('Токен отсутствует')
                setError('Токен авторизации отсутствует')
                return
            }

            const response = await fetch('/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log('Статус ответа загрузки проектов:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('Загруженные проекты:', data)
                setProjects(data)
            } else {
                const errorData = await response.json()
                console.error('Ошибка загрузки проектов:', errorData)
                setError(errorData.message || `Ошибка ${response.status}: Не удалось загрузить проекты`)

                // Если токен недействителен, перенаправляем на страницу входа
                if (response.status === 401) {
                    // Здесь можно вызвать logout из AuthContext
                    navigate('/login')
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке проектов:', error)
            setError('Ошибка сети: Не удалось подключиться к серверу')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProject = async () => {
        if (!formData.name.trim()) {
            alert('Название проекта обязательно');
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            if (!token) {
                alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
                return;
            }

            // Подготавливаем данные для Sequelize
            const projectData = {
                name: formData.name.trim(),
                description: formData.description.trim() || '',
                startDate: formData.startDate || new Date().toISOString().split('T')[0],
                endDate: formData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };

            console.log('Отправляем данные:', projectData);

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectData)
            });

            const result = await response.json();
            console.log('Ответ сервера:', result);

            if (response.ok) {
                setProjects(prev => [result, ...prev]);
                setShowModal(false);
                setFormData({
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    color: '#3b82f6'
                });
                console.log('Проект успешно создан');
            } else {
                console.error('Ошибка создания проекта:', result);
                alert('Ошибка при создании проекта: ' + (result.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка при создании проекта:', error);
            alert('Ошибка сети при создании проекта');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async () => {
        try {
            setIsDeleting(true);
            if (!token || !projectToDelete) {
                alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
                return;
            }

            console.log('Удаляем проект:', projectToDelete.id);

            const response = await fetch(`/api/projects/${projectToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Удаляем проект из локального состояния
                setProjects(prev => prev.filter(project =>
                    project.id !== projectToDelete.id
                ));
                setShowDeleteModal(false);
                setProjectToDelete(null);
                console.log('Проект успешно удален');
            } else {
                const errorData = await response.json();
                console.error('Ошибка удаления проекта:', errorData);
                alert('Ошибка при удалении проекта: ' + (errorData.message || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка при удалении проекта:', error);
            alert('Ошибка сети при удалении проекта');
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteModal = (project) => {
        setProjectToDelete(project)
        setShowDeleteModal(true)
    }

    // Функция для навигации к диаграмме проекта
    const handleProjectClick = (project) => {
        const id = project.id; // используем обычное поле id
        setCurrentProjectId(id);
        navigate(`/${id}/current-project/diagram`);
    };

    // Функция для предотвращения всплытия события при клике на кнопку удаления
    const handleDeleteClick = (e, project) => {
        e.stopPropagation()
        openDeleteModal(project)
    }

    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано'
        return new Date(dateString).toLocaleDateString('ru-RU')
    }

    const getProgressPercentage = (project) => {
        // Здесь можно добавить логику подсчета прогресса
        return 0 // Пока возвращаем 0%
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Активный'
            case 'completed':
                return 'Завершён'
            case 'planning':
                return 'Планирование'
            case 'paused':
                return 'Приостановлен'
            default:
                return 'Планирование'
        }
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Загрузка проектов...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h2>Ошибка загрузки</h2>
                <p>{error}</p>
                <button
                    className="retry-btn"
                    onClick={fetchProjects}
                >
                    Попробовать снова
                </button>
            </div>
        )
    }

    return (
        <div className="all-projects-page">
            {projects.length === 0 ? (
                // Empty state
                <div className="empty-state">
                    <div className="folder-icon">
                        <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <h2 className="empty-title">Нет проектов</h2>

                    <p className="empty-description">
                        Создайте свой первый проект для начала работы
                    </p>

                    <button
                        className="create-project-btn"
                        onClick={() => setShowModal(true)}
                    >
                        + Новый проект
                    </button>
                </div>
            ) : (
                // Projects list
                <div className="projects-container">
                    <div className="projects-header">
                        <div>
                            <h1 className="projects-title">Мои проекты</h1>
                            <p className="projects-subtitle">Управляйте своими проектами и отслеживайте прогресс</p>
                        </div>
                        <button
                            className="create-project-btn-header"
                            onClick={() => setShowModal(true)}
                        >
                            + Новый проект
                        </button>
                    </div>

                    <div className="projects-grid">
                        {projects.map(project => (
                            <div
                                key={project.id} // используем обычное поле id
                                className="project-card"
                                onClick={() => handleProjectClick(project)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="project-header">
                                    <div
                                        className="project-color-indicator"
                                        style={{ backgroundColor: '#3b82f6' }} // пока статичный цвет
                                    ></div>
                                    <h3 className="project-name">{project.name}</h3>
                                    <div className="project-actions">
                                        <span className={`project-status status-${project.status || 'planning'}`}>
                                            {getStatusText(project.status)}
                                        </span>
                                        <button
                                            className="delete-project-btn"
                                            onClick={(e) => handleDeleteClick(e, project)}
                                            title="Удалить проект"
                                        >
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="project-stats">
                                    <div className="stat">
                                        <span className="stat-icon">☑</span>
                                        <span>0 задач</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-icon">👥</span>
                                        <span>1 участник</span> {/* владелец */}
                                    </div>
                                </div>

                                <div className="project-progress">
                                    <span>Прогресс</span>
                                    <span>{project.progress || 0}%</span> {/* используем поле progress из модели */}
                                </div>

                                <div className="project-footer">
                                    <span className="project-updated">
                                        Обновлен {formatDate(project.updatedAt)}
                                    </span>
                                    <span className="project-dates">
                                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Создать новый проект</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="project-name">
                                    Название проекта 
                                </label>
                                <input
                                    id="project-name"
                                    type="text"
                                    name="name"
                                    placeholder="Введите название проекта"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="project-description">Описание</label>
                                <textarea
                                    id="project-description"
                                    name="description"
                                    placeholder="Описание проекта (необязательно)"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    maxLength={1000}
                                />
                                <small className="form-hint">
                                    {formData.description.length}/1000 символов
                                </small>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="start-date">Дата начала</label>
                                    <input
                                        id="start-date"
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="end-date">Дата окончания</label>
                                    <input
                                        id="end-date"
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Цвет проекта</label>
                                <div className="color-picker">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                                            title={`Выбрать цвет ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                           
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setShowModal(false)}
                                disabled={isCreating}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="btn-create"
                                onClick={handleCreateProject}
                                disabled={!formData.name.trim() || isCreating}
                            >
                                {isCreating ? 'Создание...' : 'Создать проект'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Удалить проект</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="delete-warning">
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="warning-icon"
                                >
                                    <path
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <p>
                                    Вы уверены, что хотите удалить проект <strong>"{projectToDelete?.name}"</strong>?
                                </p>
                                <p className="delete-warning-text">
                                    Это действие нельзя отменить. Все задачи и данные проекта будут удалены безвозвратно.
                                </p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn-delete"
                                onClick={handleDeleteProject}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Удаление...' : 'Удалить проект'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AllProjectsPage