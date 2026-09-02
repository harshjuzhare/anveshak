import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TrackComplaint from "./pages/TrackComplaint.jsx";

import CitizenDashboard from "./pages/citizen/Dashboard.jsx";
import ReportProblem from "./pages/citizen/ReportProblem.jsx";
import CitizenComplaintDetail from "./pages/citizen/ComplaintDetail.jsx";

import OfficerDashboard from "./pages/officer/Dashboard.jsx";
import OfficerComplaintDetail from "./pages/officer/ComplaintDetail.jsx";
import OfficerWorkers from "./pages/officer/Workers.jsx";
import OfficerReports from "./pages/officer/Reports.jsx";

import WorkerDashboard from "./pages/worker/Dashboard.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import Departments from "./pages/admin/Departments.jsx";
import Staff from "./pages/admin/Staff.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track" element={<TrackComplaint />} />

          {/* Citizen portal */}
          <Route path="/citizen" element={<ProtectedRoute roles={["citizen"]}><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/citizen/report" element={<ProtectedRoute roles={["citizen"]}><ReportProblem /></ProtectedRoute>} />
          <Route path="/citizen/complaints/:id" element={<ProtectedRoute roles={["citizen"]}><CitizenComplaintDetail /></ProtectedRoute>} />

          {/* Officer portal */}
          <Route path="/officer" element={<ProtectedRoute roles={["officer"]}><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/complaints/:id" element={<ProtectedRoute roles={["officer"]}><OfficerComplaintDetail /></ProtectedRoute>} />
          <Route path="/officer/workers" element={<ProtectedRoute roles={["officer"]}><OfficerWorkers /></ProtectedRoute>} />
          <Route path="/officer/reports" element={<ProtectedRoute roles={["officer"]}><OfficerReports /></ProtectedRoute>} />

          {/* Worker portal */}
          <Route path="/worker" element={<ProtectedRoute roles={["worker"]}><WorkerDashboard /></ProtectedRoute>} />

          {/* Central Administration portal */}
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/complaints/:id" element={<ProtectedRoute roles={["admin"]}><OfficerComplaintDetail /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={["admin"]}><Analytics /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute roles={["admin"]}><Departments /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute roles={["admin"]}><Staff /></ProtectedRoute>} />

          <Route path="*" element={<div className="max-w-xl mx-auto px-6 py-20 text-center text-gray-500">Page not found.</div>} />
        </Routes>
      </main>
    </div>
  );
}
