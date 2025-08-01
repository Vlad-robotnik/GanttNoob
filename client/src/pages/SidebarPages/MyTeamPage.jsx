import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/MyTeamPage.css';

const MyTeamPage = () => {
    const { token } = useContext(AuthContext);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [availableProjects, setAvailableProjects] = useState([]);

    useEffect(() => {
        if (token) {
            fetchUsers();
        } else {
            setLoading(false);
            setError('Необходимо войти в систему');
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            setError(null);
            const res = await fetch('/api/team/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                const err = await res.json();
                setError(err.message || 'Ошибка загрузки пользователей');
            }
        } catch (e) {
            setError('Ошибка сети');
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = async (user) => {
        setSelectedUser(user);
        try {
            const res = await fetch(`/api/team/${user.id}/available-projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableProjects(data);
                setShowModal(true);
            }
        } catch (e) {
            console.error('Ошибка загрузки проектов', e);
        }
    };

    const addUserToProject = async (projectId) => {
        try {
            const res = await fetch('/api/team/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: selectedUser.id, projectId })
            });
            if (res.ok) {
                setShowModal(false);
                fetchUsers();
            }
        } catch (e) {
            console.error('Ошибка добавления пользователя', e);
        }
    };

    const removeUserFromProject = async (userId, projectId) => {
        try {
            const res = await fetch('/api/team/remove', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, projectId })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (e) {
            console.error('Ошибка удаления пользователя из проекта', e);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="my-team-page page-scroll">
            <h1>Моя команда</h1>
            <table className="team-table">
                <thead>
                    <tr>
                        <th>Фамилия Имя</th>
                        <th>Email</th>
                        <th>Проекты</th>
                        <th>Действие</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.lastName} {user.firstName}</td>
                            <td>{user.email}</td>
                            <td>
                                <div className={`projects-container ${user.memberProjects.length > 3 ? 'scrollable' : ''}`}>
                                    {user.memberProjects.length === 0 && <span className="empty-projects">Нет проектов</span>}
                                    {user.memberProjects.map(proj => {
                                        const isOwner = proj.ownerId === user.id;
                                        return (
                                            <div key={proj.id} className="user-project">
                                                <span>{proj.name} {isOwner && <span className="owner-label"> (Его проект) </span>}</span>
                                                {!isOwner && (
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => removeUserFromProject(user.id, proj.id)}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </td>
                            <td>
                                <button className="add-btn" onClick={() => openAddModal(user)}>+</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Добавить {selectedUser.firstName} в проект</h2>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        <div className={`modal-body ${availableProjects.length > 10 ? 'scrollable' : ''}`}>
                            {availableProjects.length === 0 ? (
                                <p>Нет доступных проектов для добавления</p>
                            ) : (
                                availableProjects.map(project => (
                                    <button
                                        key={project.id}
                                        className="project-option"
                                        onClick={() => addUserToProject(project.id)}
                                    >
                                        {project.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTeamPage;
