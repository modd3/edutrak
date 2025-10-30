import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Lazy load pages for code splitting
const Login = React.lazy(() => import('./pages/Login'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Students = React.lazy(() => import('./pages/Students'))
const Teachers = React.lazy(() => import('./pages/Teachers'))
const Classes = React.lazy(() => import('./pages/Classes'))
const Subjects = React.lazy(() => import('./pages/Subjects'))
const Assessments = React.lazy(() => import('./pages/Assessments'))
const Attendance = React.lazy(() => import('./pages/Attendance'))
const Users = React.lazy(() => import('./pages/Users'))
const Profile = React.lazy(() => import('./pages/Profile'))

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        duration={4000}
        richColors
        closeButton
      />
      <Routes>
        <Route path="/login" element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <Login />
          </React.Suspense>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Dashboard />
            </React.Suspense>
          } />
          <Route path="students" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Students />
            </React.Suspense>
          } />
          <Route path="teachers" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Teachers />
            </React.Suspense>
          } />
          <Route path="classes" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Classes />
            </React.Suspense>
          } />
          <Route path="subjects" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Subjects />
            </React.Suspense>
          } />
          <Route path="assessments" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Assessments />
            </React.Suspense>
          } />
          <Route path="attendance" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Attendance />
            </React.Suspense>
          } />
          <Route path="users" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Users />
            </React.Suspense>
          } />
          <Route path="profile" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <Profile />
            </React.Suspense>
          } />
        </Route>
      </Routes>
    </>
  )
}

export default App