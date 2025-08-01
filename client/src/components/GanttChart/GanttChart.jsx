import React, { useEffect, useRef, useState, useContext } from 'react';
import Gantt from 'frappe-gantt';
import '../../styles/frappe-gantt.css';
import './GanttChart.css';
import { AuthContext } from '../../context/AuthContext';

const GanttChart = ({ objects, setObjects, connections = [] }) => {
  const ganttRef = useRef(null);
  const [viewMode, setViewMode] = useState('Day');
  const { token } = useContext(AuthContext);

  const formatDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleDateChange = async (task, start, end) => {
    try {
      await fetch(`/api/objects/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startDate: start, endDate: end })
      });

      setObjects(prev =>
        prev.map(obj =>
          obj.id.toString() === task.id
            ? { ...obj, startDate: start, endDate: end }
            : obj
        )
      );
    } catch (err) {
      console.error("Ошибка обновления дат задачи:", err);
    }
  };

  useEffect(() => {
    if (!ganttRef.current) return;

    // Очистка контейнера
    while (ganttRef.current.firstChild) {
      ganttRef.current.removeChild(ganttRef.current.firstChild);
    }

    const tasks = (objects || [])
      .filter(obj => obj.startDate)
      .map(obj => {
        let start = formatDate(obj.startDate);
        let end = formatDate(obj.endDate);

        if (obj.type === 'веха') {
          end = start; // веха = точка
        }

        let statusClass = '';
        switch (obj.status) {
          case 'Выполнено': statusClass = 'status-done'; break;
          case 'В работе': statusClass = 'status-progress'; break;
          case 'Закрыт': statusClass = 'status-closed'; break;
          default: statusClass = 'status-open';
        }

        const typeClass = obj.type === 'веха' ? 'milestone' : 'task';
        const hasChildren = obj.children && obj.children.length > 0;
        const subtaskClass = hasChildren ? 'has-children' : 'no-children';

        const safeClass = (val) =>
          val
            ? val.toString().trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '')
            : '';

        return {
          id: String(obj.id),
          name: obj.name || `Объект ${obj.id}`,
          start,
          end,
          progress: obj.progress || 0,
          type: obj.type,
          status: obj.status,
          members: obj.members,
          description: obj.description,
          custom_class: `${safeClass(statusClass)}-${safeClass(typeClass)}-${subtaskClass}`
        };
      })
      .filter(t => t.start);

    if (tasks.length === 0) return;

    try {
      const gantt = new Gantt(ganttRef.current, tasks, {
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD HH:mm',
        bar_height: 30,
        padding: 20,
        on_date_change: handleDateChange,
        custom_popup_html: (task) => {
          return `
          <div class="gantt-popup">
            <b>${task.name}</b><br/>
            Тип: ${task.type}<br/>
            Статус: ${task.status}<br/>
            Прогресс: ${task.progress}%<br/>
            Участники: ${(task.members || []).length}<br/>
            ${task.description ? `<p>${task.description}</p>` : ''}
          </div>
        `;
        }
      });

      const svg = ganttRef.current.querySelector('svg');

      /** ✅ Добавляем marker для стрелок один раз */
      if (!svg.querySelector('#arrowhead')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.id = 'arrowhead';
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '6');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', 'M0,0 L0,6 L6,3 z');
        arrowPath.setAttribute('fill', '#424242');
        marker.appendChild(arrowPath);
        defs.appendChild(marker);
        svg.insertBefore(defs, svg.firstChild);
      }

      /** ✅ Функция для поиска bar через DOM */
      const findBarRect = (taskId) => {
        return ganttRef.current.querySelector(`.bar-wrapper[data-id="${taskId}"] rect.bar`);
      };

      /** ✅ Рисуем зависимости */
      connections.forEach(conn => {
        const fromId = String(conn.from);
        const toId = String(conn.to);

        const fromTask = tasks.find(t => t.id === fromId);
        const toTask = tasks.find(t => t.id === toId);

        if (!fromTask || !toTask) return;

        const fromBar = findBarRect(fromTask.id);
        const toBar = findBarRect(toTask.id);
        if (!fromBar || !toBar) return;

        const fromX = parseFloat(fromBar.getAttribute('x'));
        const toX = parseFloat(toBar.getAttribute('x'));
        const fromY = parseFloat(fromBar.getAttribute('y'));
        const toY = parseFloat(toBar.getAttribute('y'));
        const fromW = parseFloat(fromBar.getAttribute('width'));
        const toW = parseFloat(toBar.getAttribute('width'));
        const fromH = parseFloat(fromBar.getAttribute('height'));
        const toH = parseFloat(toBar.getAttribute('height'));

        const type = (conn.type || '').trim().toLowerCase();

        let startX, endX;
        switch (type) {
          case 'н-н': startX = fromX; endX = toX; break;
          case 'к-к': startX = fromX + fromW; endX = toX + toW; break;
          case 'н-к': startX = fromX; endX = toX + toW; break;
          case 'к-н': default: startX = fromX + fromW; endX = toX; break;
        }

        const startY = fromY + fromH / 2;
        const endY = toY + toH / 2;

        // ✅ Кривая с изгибом
        const curve = `M${startX},${startY} C${startX + 30},${startY} ${endX - 30},${endY} ${endX},${endY}`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', curve);
        path.setAttribute('stroke', '#424242');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrowhead)');

        svg.appendChild(path);
      });

    } catch (err) {
      console.error("Ошибка инициализации Gantt:", err);
    }

  }, [objects, viewMode, connections]);






  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => setViewMode('Day')}>Day</button>
        <button onClick={() => setViewMode('Month')}>Month</button>
        <button onClick={() => setViewMode('Year')}>Year</button>
      </div>
      <div className="gantt-container" ref={ganttRef}></div>
    </div>
  );
};

export default GanttChart;
