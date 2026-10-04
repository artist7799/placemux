import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { JobDiscovery } from './pages/student/JobDiscovery';
import { MyApplications } from './pages/student/MyApplications';
import { StudentAssessmentRunner } from './pages/student/StudentAssessmentRunner';
import { StudentInterviewsOffers } from './pages/student/StudentInterviewsOffers';
import { CompanyJobManager } from './pages/company/CompanyJobManager';
import { CompanyAssessmentBuilder } from './pages/company/CompanyAssessmentBuilder';
import { CollegeDashboard } from './pages/college/CollegeDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading PlaceMux...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout>
              <StudentDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout>
              <StudentProfile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/jobs"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout>
              <JobDiscovery />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/applications"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout>
              <MyApplications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/interviews"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout>
              <StudentInterviewsOffers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/offers"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout>
              <StudentInterviewsOffers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assessment/:assessmentId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <StudentAssessmentRunner />
          </ProtectedRoute>
        }
      />

      {/* Company Routes */}
      <Route
        path="/company/jobs"
        element={
          <ProtectedRoute allowedRoles={['COMPANY', 'ADMIN']}>
            <DashboardLayout>
              <CompanyJobManager />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/assessments"
        element={
          <ProtectedRoute allowedRoles={['COMPANY', 'ADMIN']}>
            <DashboardLayout>
              <CompanyAssessmentBuilder />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* College Routes */}
      <Route
        path="/college/dashboard"
        element={
          <ProtectedRoute allowedRoles={['COLLEGE', 'ADMIN']}>
            <DashboardLayout>
              <CollegeDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user?.role === 'ADMIN' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : user?.role === 'COMPANY' ? (
            <Navigate to="/company/jobs" replace />
          ) : user?.role === 'COLLEGE' ? (
            <Navigate to="/college/dashboard" replace />
          ) : (
            <Navigate to="/student/dashboard" replace />
          )
        }
      />

      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
            403 - Unauthorized Access
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
