import React from 'react'
import PlanificadorProcesos from '../pages/PlanificadorDeProcesos/PlanificadorProcesos';
import { Route, BrowserRouter, Routes } from 'react-router';
import Main from '../pages/Main/Main';

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<Main />} />
                <Route path="/planificador-procesos" element={<Main body={<PlanificadorProcesos />} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes