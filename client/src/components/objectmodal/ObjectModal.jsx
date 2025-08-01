import React, { useState, useEffect } from 'react';
import M from 'materialize-css';
import './ObjectModal.css';

const ObjectModal = ({
  isAddModalOpen,
  setIsAddModalOpen,
  newObject,
  setNewObject,
  project,
  objects,
  token,
  currentProjectId,
  renumberObjects,
  isViewModalOpen,
  setIsViewModalOpen,
  selectedObject,
  editedObject,
  setEditedObject,
  handleFieldChange,
  handleSaveChanges,
  closeObjectView,
  fetchConnections,
  connections,
  handleAddConnection,
  handleDeleteConnection
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedRelObj, setSelectedRelObj] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // ✅ новое состояние для формы добавления связи
  const [relId, setRelId] = useState('');
  const [connType, setConnType] = useState('к-н');

  useEffect(() => {
    if (isViewModalOpen) {
      setRelId('');
      setConnType('к-н');
    }
  }, [isViewModalOpen]);

  useEffect(() => {
    if (isViewModalOpen || isAddModalOpen) {
      const elems = document.querySelectorAll('.object-modal-content select');
      M.FormSelect.init(elems);
      M.updateTextFields();
    }
  }, [isViewModalOpen, isAddModalOpen, connections, objects, selectedObject, newObject, editedObject, activeTab]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setTimeout(() => M.updateTextFields(), 0);
  };

  return (
    <>
      {/* ✅ Модалка добавления нового объекта */}
      {isAddModalOpen && (
        <div className="object-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="object-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>✖</button>
            <h2>Новый объект</h2>

            <label>Название</label>
            <input
              type="text"
              value={newObject.name}
              onChange={(e) => setNewObject(prev => ({ ...prev, name: e.target.value }))}
            />

            <div className="input-field">
              <select
                value={newObject.type || ''}
                onChange={(e) => setNewObject(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="задача">Задача</option>
                <option value="веха">Веха</option>
              </select>
              <label>Тип объекта</label>
            </div>

            <label>Дата начала</label>
            <input
              type="datetime-local"
              value={newObject.startDate}
              onChange={(e) => setNewObject(prev => ({ ...prev, startDate: e.target.value }))}
            />

            <label>Дата окончания</label>
            <input
              type="datetime-local"
              value={newObject.endDate}
              onChange={(e) => setNewObject(prev => ({ ...prev, endDate: e.target.value }))}
            />

            <div className="input-field">
              <select
                value={newObject.status || ''}
                onChange={(e) => setNewObject(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="Открыт">Открыт</option>
                <option value="В работе">В работе</option>
                <option value="Выполнено">Выполнено</option>
                <option value="Закрыт">Закрыт</option>
              </select>
              <label>Статус</label>
            </div>

            <label>Прогресс</label>
            <input
              type="range"
              min="0"
              max="100"
              value={newObject.progress}
              onChange={(e) => setNewObject(prev => ({ ...prev, progress: e.target.value }))}
            />

            <div className="input-field">
              <select
                value={newObject.priority || ''}
                onChange={(e) => setNewObject(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="Самый низкий">Самый низкий</option>
                <option value="Низкий">Низкий</option>
                <option value="Средний">Средний</option>
                <option value="Высокий">Высокий</option>
                <option value="Самый высокий">Самый высокий</option>
              </select>
              <label>Приоритет</label>
            </div>

            <div className="input-field">
              <select
                value={newObject.parentId || ''}
                onChange={(e) =>
                  setNewObject(prev => ({ ...prev, parentId: e.target.value ? parseInt(e.target.value) : null }))
                }
              >
                <option value="">Без родителя</option>
                {objects.filter(o => o.type === 'задача').map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} (№{o.number})
                  </option>
                ))}
              </select>
              <label>Родительская задача</label>
            </div>

            <label>Участники</label>
            <div className="members-list">
              {project?.members?.map(member => {
                const isChecked = newObject.members.includes(member.id);
                return (
                  <label key={member.id}>
                    <input
                      type="checkbox"
                      className="filled-in"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...newObject.members, member.id]
                          : newObject.members.filter(id => id !== member.id);
                        setNewObject(prev => ({ ...prev, members: updated }));
                      }}
                    />
                    <span>{member.firstName} {member.lastName} ({member.email})</span>
                  </label>
                );
              })}
            </div>

            <label>Описание</label>
            <textarea
              value={newObject.description}
              onChange={(e) => setNewObject(prev => ({ ...prev, description: e.target.value }))}
            />

            <div className="modal-actions">
              <button
                className="save-btn"
                onClick={async () => {
                  const response = await fetch('/api/objects', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      ...newObject,
                      project: parseInt(currentProjectId)
                    })
                  });
                  if (response.ok) {
                    const created = await response.json();
                    await renumberObjects([...objects, created]);
                    setIsAddModalOpen(false);
                    setNewObject({
                      name: '',
                      description: '',
                      startDate: '',
                      endDate: '',
                      status: 'Открыт',
                      priority: 'Средний',
                      progress: 0,
                      type: 'задача',
                      members: []
                    });
                  } else {
                    alert('Ошибка при создании объекта');
                  }
                }}
              >
                ➕ Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Модалка просмотра */}
      {isViewModalOpen && selectedObject && (
        <div className="object-modal-overlay" onClick={closeObjectView}>
          <div className="object-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeObjectView}>✖</button>

            <div className="tabs">
              <button className={activeTab === 'general' ? 'active' : ''} onClick={() => changeTab('general')}>Общее</button>
              <button className={activeTab === 'dependencies' ? 'active' : ''} onClick={() => changeTab('dependencies')}>Зависимости</button>
            </div>

            {/* Вкладка Общее */}
            {activeTab === 'general' && editedObject && (
              <div className="general-tab">
                <h2>{editedObject.type === 'веха' ? 'Веха' : 'Задача'} №{selectedObject.number}</h2>

                <label>Название</label>
                <input
                  type="text"
                  value={editedObject.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />

                <div className="input-field">
                  <select
                    value={editedObject.type || ''}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                  >
                    <option value="задача">Задача</option>
                    <option value="веха">Веха</option>
                  </select>
                  <label>Тип объекта</label>
                </div>

                <label>Дата начала</label>
                <input
                  type="datetime-local"
                  value={editedObject.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />

                <label>Дата окончания</label>
                <input
                  type="datetime-local"
                  value={editedObject.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />

                <div className="input-field">
                  <select
                    value={editedObject.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="Открыт">Открыт</option>
                    <option value="В работе">В работе</option>
                    <option value="Выполнено">Выполнено</option>
                    <option value="Закрыт">Закрыт</option>
                  </select>
                  <label>Статус</label>
                </div>

                <label>Прогресс</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedObject.progress}
                  onChange={(e) => handleFieldChange('progress', e.target.value)}
                />

                <div className="input-field">
                  <select
                    value={editedObject.priority || ''}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                  >
                    <option value="Самый низкий">Самый низкий</option>
                    <option value="Низкий">Низкий</option>
                    <option value="Средний">Средний</option>
                    <option value="Высокий">Высокий</option>
                    <option value="Самый высокий">Самый высокий</option>
                  </select>
                  <label>Приоритет</label>
                </div>

                <label>Участники</label>
                <div className="members-list">
                  {project?.members?.map(member => {
                    const isChecked = editedObject.members.includes(member.id);
                    return (
                      <label key={member.id}>
                        <input
                          type="checkbox"
                          className="filled-in"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...editedObject.members, member.id]
                              : editedObject.members.filter(id => id !== member.id);
                            handleFieldChange('members', updated);
                          }}
                        />
                        <span>{member.firstName} {member.lastName} ({member.email})</span>
                      </label>
                    );
                  })}
                </div>

                <label>Описание</label>
                <textarea
                  value={editedObject.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                />

                <div className="modal-actions">
                  <button className="save-btn" onClick={handleSaveChanges}>💾 Сохранить</button>
                </div>
              </div>
            )}

            {/* Вкладка Зависимости */}
            {activeTab === 'dependencies' && (
              <div className="dependencies-tab">
                <p>У №{selectedObject.number} "{selectedObject.name}" есть следующие зависимости:</p>
                <ul>
                  {connections.map(conn => (
                    <li key={conn.id}>
                      ({conn.type}) с задачей -{conn.relatedObject.number}- "{conn.relatedObject.name}" как {conn.role}
                      <button
                        onClick={() => handleDeleteConnection(conn.RelObjId)}
                        style={{ marginLeft: "8px", color: "red" }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {connections.length === 0 && <li>Нет зависимостей</li>}
                </ul>

                <div className="connection-form">
                  <label>Выберите связанный объект:</label>
                  <select value={relId} onChange={e => setRelId(e.target.value)}>
                    <option value="">-- выберите объект --</option>
                    {objects.filter(o => o.id !== selectedObject.id).map(o => (
                      <option key={o.id} value={o.id}>
                        №{o.number} {o.name}
                      </option>
                    ))}
                  </select>

                  <label>Тип связи:</label>
                  <select value={connType} onChange={e => setConnType(e.target.value)}>
                    <option value="н-н">Начало-Начало (н-н)</option>
                    <option value="к-к">Конец-Конец (к-к)</option>
                    <option value="н-к">Начало-Конец (н-к)</option>
                    <option value="к-н">Конец-Начало (к-н)</option>
                  </select>

                  <button
                    className="save-btn"
                    onClick={() => handleAddConnection(relId, connType)}
                    disabled={!relId || !connType}
                  >
                    ➕ Добавить зависимость
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ObjectModal;