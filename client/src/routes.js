import React from "react"
import {Routes, Route, Navigate} from 'react-router-dom'
import DiagramPage from './pages/NavbarPages/DiagramPage'
import {BoardPage} from './pages/NavbarPages/BoardPage'
import {ListPage} from './pages/NavbarPages/ListPage'
import {CalendarPage} from './pages/NavbarPages/CalendarPage'
import {PeoplePage} from './pages/NavbarPages/PeoplePage'
import AllProjectsPage from './pages/SidebarPages/AllProjectsPage'
import MyTeamPage from './pages/SidebarPages/MyTeamPage'

import {DashboardPage} from './pages/NavbarPages/DashboardPage'
import { RegistrationPage } from './pages/RegistrationPage'

import {AuthPage} from './pages/AuthPage'

// Заглушки для недостающих страниц (создайте их позже)
const PortfoliosPage = () => <div className="container"><h1>Портфели</h1></div>
const TasksPage = () => <div className="container"><h1>Мои задачи</h1></div>
const ResourcePage = () => <div className="container"><h1>Загрузка ресурсов</h1></div>
const CommentsPage = () => <div className="container"><h1>Комментарии</h1></div>
const SettingsPage = () => <div className="container"><h1>Настройки</h1></div>

export const useRoutes = (isAuthenticated) => {
    if (isAuthenticated) {
        return (
            <Routes>
                {/* Страницы конкретного проекта с динамическим ID */}
                <Route path="/:projectId/current-project/diagram" element={<DiagramPage />} />
                <Route path="/:projectId/current-project/board" element={<BoardPage />} />
                <Route path="/:projectId/current-project/list" element={<ListPage />} />
                <Route path="/:projectId/current-project/calendar" element={<CalendarPage />} />
                <Route path="/:projectId/current-project/people" element={<PeoplePage />} />
                <Route path="/:projectId/current-project/dashboard" element={<DashboardPage />} />
                <Route path="/:projectId/current-project/resource" element={<ResourcePage />} />
                
                {/* Перенаправление с ID проекта на диаграмму */}
                <Route path="/:projectId/current-project" element={<Navigate to="diagram" replace />} />
                <Route path="/:projectId" element={<Navigate to="current-project/diagram" replace />} />
                
                {/* Страницы текущего проекта БЕЗ ID (для обратной совместимости) */}
                <Route path="/current-project/diagram" element={<DiagramPage />} />
                <Route path="/current-project/board" element={<BoardPage />} />
                <Route path="/current-project/list" element={<ListPage />} />
                <Route path="/current-project/calendar" element={<CalendarPage />} />
                <Route path="/current-project/people" element={<PeoplePage />} />
                <Route path="/current-project/dashboard" element={<DashboardPage />} />
                <Route path="/current-project/resource" element={<ResourcePage />} />
                
                {/* Перенаправление с текущего проекта на диаграмму */}
                <Route path="/current-project" element={<Navigate to="diagram" replace />} />
                
                {/* Страницы из Sidebar */}
                <Route path="/team" element={<MyTeamPage />} />
                <Route path="/all-projects" element={<AllProjectsPage />} />
                <Route path="/portfolios" element={<PortfoliosPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/comments" element={<CommentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

             

                {/* Перенаправление по умолчанию на список всех проектов */}
                <Route path="/" element={<Navigate to="/all-projects" replace />} />
                <Route path="*" element={<Navigate to="/all-projects" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};