// Code for App
import React from 'react';
import EditStudent from './pages/students/EditStudent';
import SubjectsList from './pages/subjects/SubjectsList';
import GuardiansList from './pages/guardians/GuardiansList';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';

const App = () => {
    return (
        <div>
            <h1>My Application</h1>
            <EditStudent />
            <SubjectsList />
            <GuardiansList />
            <Reports />
            <Settings />
        </div>
    );
};

export default App;
