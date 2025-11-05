import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/students/StudentsList';
import StudentDetails from './pages/students/StudentDetails';
import CreateStudent from './pages/students/CreateStudent';
//import EditStudent from './pages/students/EditStudent';
import TeachersList from './pages/teachers/TeachersList';
import TeacherDetails from './pages/teachers/TeacherDetails';
import CreateTeacher from './pages/teachers/CreateTeacher';
import ClassesList from './pages/classes/ClassesList';
import ClassDetails from './pages/classes/ClassDetails';
import CreateClass from './pages/classes/CreateClass';
import AssessmentsList from './pages/assessments/AssessmentsList';
import CreateAssessment from './pages/assessments/CreateAssessment';
//import SubjectsList from './pages/subjects/SubjectsList';
import AcademicYearsList from './pages/academic-years/AcademicYearsList';
//import GuardiansList from './pages/guardians/GuardiansList';
//import Reports from './pages/reports/Reports';
//import Settings from './pages/settings/Settings';
import SchoolsList from './pages/schools/SchoolsList';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Students Routes */}
          <Route path="/students" element={<StudentsList />} />
          <Route path="/students/new" element={<CreateStudent />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          {/*<Route path="/students/:id/edit" element={<EditStudent />} />*/}
          
          {/* Teachers Routes */}
          <Route path="/teachers" element={<TeachersList />} />
          <Route path="/teachers/new" element={<CreateTeacher />} />
          <Route path="/teachers/:id" element={<TeacherDetails />} />
          
          {/* Classes Routes */}
          <Route path="/classes" element={<ClassesList />} />
          <Route path="/classes/new" element={<CreateClass />} />
          <Route path="/classes/:id" element={<ClassDetails />} />
          
          {/* Assessments Routes */}
          <Route path="/assessments" element={<AssessmentsList />} />
          <Route path="/assessments/new" element={<CreateAssessment />} />
          
          {/* Other Routes */}
          {/*<Route path="/subjects" element={<SubjectsList />} />*/}
          <Route path="/academic-years" element={<AcademicYearsList />} />
          {/*<Route path="/guardians" element={<GuardiansList />} />*/}
         {/* <Route path="/reports" element={<Reports />} />*/}
          {/*<Route path="/settings" element={<Settings />} />*/}
          <Route path="/schools" element={<SchoolsList />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;