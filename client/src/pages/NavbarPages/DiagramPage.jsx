import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import ReactDOM from "react-dom";
import M from 'materialize-css';
import { AuthContext } from '../../context/AuthContext';
import { useCurrentProject } from '../../context/CurrentProjectContext';
import '../../styles/DiagramPage.css';
import ObjectModal from '../../components/objectmodal/ObjectModal';
import GanttChart from '../../components/GanttChart/GanttChart';


const DiagramPage = () => {
    const { token } = useContext(AuthContext);
    const { currentProjectId } = useCurrentProject();

    const [project, setProject] = useState(null);
    const [objects, setObjects] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [objectsLoading, setObjectsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedObject, setSelectedObject] = useState(null);
    const [editedObject, setEditedObject] = useState(null);

    const [newObject, setNewObject] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Открыт',
        priority: 'Средний',
        progress: 0,
        type: 'задача',
        parentId: null,
        members: []
    });


    const [openDropdown, setOpenDropdown] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
    const dropdownRef = useRef(null);

    const [colWidths, setColWidths] = useState([
        "60px", "200px", "150px", "150px", "120px", "200px", "120px", "100px"
    ]);
    const [resizing, setResizing] = useState(null);

    const renumberObjects = async (list) => {
        const topLevel = list.filter(o => !o.parentId);
        const childrenByParent = {};
        list.forEach(o => {
            if (o.parentId) {
                if (!childrenByParent[o.parentId]) childrenByParent[o.parentId] = [];
                childrenByParent[o.parentId].push(o);
            }
        });

        const updatedTop = topLevel
            .sort((a, b) => a.number - b.number)
            .map((obj, index) => ({ ...obj, number: index + 1 }));

        const updatedChildren = [];
        for (const parentId in childrenByParent) {
            const sorted = childrenByParent[parentId]
                .sort((a, b) => a.number - b.number)
                .map((obj, index) => ({ ...obj, number: index + 1 }));
            updatedChildren.push(...sorted);
        }

        const updated = [...updatedTop, ...updatedChildren];

        for (const o of updated) {
            await fetch(`/api/objects/${o.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ number: o.number })
            });
        }
        setObjects(buildDisplayNumbers(buildTree(updated)));
    };

    function buildTree(items) {
        const map = new Map();
        const roots = [];

        items.forEach(item => map.set(item.id, { ...item, children: [] }));
        items.forEach(item => {
            if (!item.parentId) roots.push(map.get(item.id));
            else map.get(item.parentId)?.children.push(map.get(item.id));
        });

        function sortNode(node) {
            if (node.children?.length > 0) {
                node.children.sort((a, b) => a.number - b.number);
                node.children.forEach(sortNode);
            }
        }

        roots.sort((a, b) => a.number - b.number);
        roots.forEach(sortNode);
        return roots;
    }

    const buildDisplayNumbers = (tree, parentNumber = '') => {
        const result = [];
        tree.forEach(node => {
            const currentDisplay = parentNumber ? `${parentNumber}.${node.number}` : node.number.toString();
            result.push({ ...node, displayNumber: currentDisplay });
            if (node.children?.length) {
                result.push(...buildDisplayNumbers(node.children, currentDisplay));
            }
        });
        return result;
    };

    // ✅ Fetch connections for selected object
    const fetchConnections = async (objectId) => {
        try {
            console.log('fetchConnections for', objectId);
            const res = await fetch(`/api/connections/${objectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnections(data);
            } else {
                setConnections([]);
            }
        } catch {
            setConnections([]);
        }
    };
    // ✅ Удалить зависимость
    const handleDeleteConnection = async (relId, objectId) => {
        try {
            await fetch('/api/connections', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ObjectId: objectId,
                    RelObjId: relId
                })
            });
            await fetchAllConnections(); // ✅ обновляем все зависимости
        } catch (err) {
            console.error('Ошибка при удалении зависимости', err);
        }
    };
    const handleAddConnection = async (relId, type, objectId) => {
        if (!relId || !type || !objectId) return;
        await fetch('/api/connections', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ObjectId: objectId,
                RelObjId: parseInt(relId),
                type
            })
        });
        await fetchAllConnections(); // ✅ обновляем все зависимости
    };
    const openObjectView = (obj) => {
        setSelectedObject(obj);
        setEditedObject({
            name: obj.name,
            description: obj.description || '',
            startDate: formatForInput(obj.startDate),
            endDate: formatForInput(obj.endDate),
            status: obj.status,
            priority: obj.priority,
            progress: obj.progress,
            type: obj.type || 'задача',
            number: obj.number,
            members: obj.members.map(m => m.id)
        });

        setIsViewModalOpen(true);
        fetchConnections(obj.id);
    };

    const closeObjectView = () => {
        setSelectedObject(null);
        setEditedObject(null);
        setIsViewModalOpen(false);
    };

    const handleFieldChange = (field, value) => {
        setEditedObject(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = async () => {
        const payload = { ...editedObject };
        const response = await fetch(`/api/objects/${selectedObject.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const updatedList = objects.map(obj =>
                obj.id === selectedObject.id
                    ? { ...obj, ...payload, members: project.members.filter(m => payload.members.includes(m.id)) }
                    : obj
            );
            await renumberObjects(updatedList);
            closeObjectView();
        } else {
            alert('Ошибка сохранения');
        }
    };

    const formatForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const off = d.getTimezoneOffset();
        const local = new Date(d.getTime() - off * 60000);
        return local.toISOString().slice(0, 16);
    };

    const fetchProjectData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${currentProjectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setProject(await response.json());
            } else {
                setError('Ошибка загрузки проекта');
            }
        } catch {
            setError('Ошибка сети');
        } finally {
            setLoading(false);
        }
    }, [currentProjectId, token]);

    const fetchAllConnections = useCallback(async () => {
        try {
            const res = await fetch(`/api/connections/project/${currentProjectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConnections(data);
            } else {
                setConnections([]);
            }
        } catch (err) {
            console.error("Ошибка загрузки зависимостей", err);
            setConnections([]);
        }
    }, [currentProjectId, token]);

    const fetchObjects = useCallback(async () => {
        try {
            setObjectsLoading(true);
            const response = await fetch(`/api/objects/project/${currentProjectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setObjects(buildDisplayNumbers(buildTree(data) || []));
            } else {
                setObjects([]);
            }
        } catch {
            setObjects([]);
        } finally {
            setObjectsLoading(false);
        }
    }, [currentProjectId, token]);

    useEffect(() => {
        if (currentProjectId && token) {
            fetchProjectData();
            fetchObjects();
            fetchAllConnections(); // ✅ грузим зависимости при открытии проекта
        } else {
            setLoading(false);
            if (!currentProjectId) setError('Проект не выбран');
        }
    }, [currentProjectId, token, fetchProjectData, fetchObjects, fetchAllConnections]);

    const handleDeleteObject = async (id) => {
        if (!window.confirm('Удалить объект?')) return;
        setIsDeleting(true);
        await fetch(`/api/objects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedList = objects.filter(obj => obj.id !== id);
        await renumberObjects(updatedList);
        setIsDeleting(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleDropdownClick = (event, id) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownPosition({
            x: rect.right + 20, // немного правее кнопки
            y: rect.top - 10    // чуть выше кнопки
        });
        setOpenDropdown(openDropdown === id ? null : id);
    };
    const headers = ["№", "Название", "Дата начала", "Дата окончания", "Статус", "Участники", "Приоритет", "Прогр.", "Действие"];

    if (loading) return <div className="diagram-page"><p>Загрузка проекта...</p></div>;
    if (error) return <div className="diagram-page"><p>{error}</p></div>;
    if (!project) return <div className="diagram-page"><p>Проект не найден</p></div>;



    return (
        <div className="diagram-page">
            <div className="project-header1">
                <div className="project-info">
                    <h1 className="project-title">{project.name}</h1>
                    {project.description && <p>{project.description}</p>}
                </div>
                <div className="project-stats">
                    <div className="stat-card">
                        <span className="stat-number">{objects.length}</span>
                        <span className="stat-label">Объектов</span>
                    </div>
                </div>
            </div>

            <div className="diagram-content">
                {/* Левая часть - таблица */}
                <div className="tasks-section">
                    <div className="tasks-header">
                        <h3>Объекты проекта</h3>
                        <button className="add-task-btn" onClick={() => setIsAddModalOpen(true)}>Добавить объект</button>
                    </div>

                    <div className="tasks-table">
                        <div className="tasks-scroll">
                            <div className="tasks-header1-row">
                                {headers.slice(0, -1).map((title, i) => (
                                    <div className="tasks-cell header1" style={{ width: colWidths[i] }} key={i}>{title}</div>
                                ))}
                                <div className="tasks-cell header1 action-cell">{headers.at(-1)}</div>
                            </div>

                            {objects.map(obj => (
                                <div className="tasks-row" key={obj.id}>
                                    <div className="tasks-cell" style={{ width: colWidths[0] }}>{obj.displayNumber}</div>
                                    <div className="tasks-cell left-text" style={{ width: colWidths[1] }}>{obj.name}</div>
                                    <div className="tasks-cell" style={{ width: colWidths[2] }}>{obj.startDate ? new Date(obj.startDate).toLocaleDateString('ru-RU') : '-'}</div>
                                    <div className="tasks-cell" style={{ width: colWidths[3] }}>{obj.endDate ? new Date(obj.endDate).toLocaleDateString('ru-RU') : '-'}</div>
                                    <div className="tasks-cell" style={{ width: colWidths[4] }}>{obj.status}</div>
                                    <div className="tasks-cell" style={{ width: colWidths[5] }}>
                                        {(obj.members || []).map(m => m.firstName || m.email).join(', ') || '-'}
                                    </div>
                                    <div className="tasks-cell" style={{ width: colWidths[6] }}>{obj.priority}</div>
                                    <div className="tasks-cell" style={{ width: colWidths[7] }}>{obj.progress}%</div>
                                    <div className="tasks-cell action-cell">
                                        <div className="dropdown">
                                            <button
                                                className="dropdown-toggle"
                                                onClick={(e) => handleDropdownClick(e, obj.id)}
                                            >
                                                ⋮
                                            </button>
                                            {openDropdown === obj.id && ReactDOM.createPortal(
                                                <div
                                                    ref={dropdownRef}
                                                    className="dropdown-menu"
                                                    style={{
                                                        position: "fixed",
                                                        top: dropdownPosition.y,
                                                        left: dropdownPosition.x
                                                    }}
                                                >
                                                    <button onClick={() => openObjectView(obj)}>📂 Открыть</button>
                                                    <button onClick={() => handleDeleteObject(obj.id)} disabled={isDeleting}>🗑️ Удалить</button>
                                                </div>,
                                                document.getElementById("dropdown-root")
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Правая часть - диаграмма Ганта */}
                <div className="gantt-section">
                    <div className="gantt-content">
                        {/* Здесь будет компонент диаграммы */}
                        <div className="custom-gantt">
                            <GanttChart
                                projectId={currentProjectId}
                                objects={objects}
                                connections={connections.map(conn =>
                                    conn.role === 'предшественник'
                                        ? { from: conn.ObjectId, to: conn.RelObjId, type: conn.type }
                                        : { from: conn.RelObjId, to: conn.ObjectId, type: conn.type }
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ObjectModal
                isAddModalOpen={isAddModalOpen}
                setIsAddModalOpen={setIsAddModalOpen}
                newObject={newObject}
                setNewObject={setNewObject}
                project={project}
                objects={objects}
                token={token}
                currentProjectId={currentProjectId}
                renumberObjects={renumberObjects}
                isViewModalOpen={isViewModalOpen}
                setIsViewModalOpen={setIsViewModalOpen}
                selectedObject={selectedObject}
                editedObject={editedObject}
                setEditedObject={setEditedObject}
                handleFieldChange={handleFieldChange}
                handleSaveChanges={handleSaveChanges}
                closeObjectView={closeObjectView}
                fetchConnections={fetchConnections}
                connections={connections}
                handleAddConnection={(relId, type) => handleAddConnection(relId, type, selectedObject?.id)}
                handleDeleteConnection={(relId) => handleDeleteConnection(relId, selectedObject?.id)}
            />
        </div>
    );
}


export default DiagramPage;
