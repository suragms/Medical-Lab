import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { usePatientStore } from "../../store";
import { getProfileById } from "../../data/testMaster";

import Button from "../../components/ui/Button";
import "./StaffDashboard.css";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { patients } = usePatientStore();

  // Filter patients by status
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPatients = patients.filter((p) => {
    const created = new Date(p.createdAt);
    return created >= today;
  });

  const pendingPatients = patients.filter(
    (p) => p.status === "registered" || p.status === "results_entered",
  );

  const completedPatients = patients.filter((p) => p.status === "completed");

  return (
    <div className="staff-dashboard">
      <div className="staff-header">
        <h1>Staff Dashboard</h1>
        <Button
          onClick={() => navigate("/patients/add")}
          icon={Plus}
          size="large"
        >
          Add Patient
        </Button>
      </div>

      {/* Today's Count */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e3f2fd" }}>
            <Clock size={32} color="#1976d2" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Today's Patients</p>
            <h2 className="stat-value">{todayPatients.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff3e0" }}>
            <AlertCircle size={32} color="#f57c00" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending Results</p>
            <h2 className="stat-value">{pendingPatients.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e8f5e9" }}>
            <CheckCircle size={32} color="#2e7d32" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <h2 className="stat-value">{completedPatients.length}</h2>
          </div>
        </div>
      </div>

      {/* Pending Patients */}
      <div className="patients-section">
        <h2 className="section-title">Pending Patients</h2>
        {pendingPatients.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} color="var(--text-tertiary)" />
            <p>No pending patients</p>
          </div>
        ) : (
          <div className="patient-list">
            {pendingPatients.slice(0, 10).map((patient) => {
              const profile = getProfileById(patient.testProfile);
              return (
                <div
                  key={patient.id}
                  className="patient-card"
                  onClick={() => {
                    if (patient.status === "registered") {
                      navigate(`/results/enter/${patient.id}`);
                    } else {
                      navigate(`/patients/${patient.id}`);
                    }
                  }}
                >
                  <div className="patient-info">
                    <h4>{patient.name}</h4>
                    <p>
                      {patient.age} years • {patient.gender}
                    </p>
                    <span className="profile-badge">{profile?.shortName}</span>
                  </div>
                  <div className="patient-status">
                    <span
                      className={`status-badge ${patient.status.replace("_", "-")}`}
                    >
                      {patient.status.replace("_", " ").toUpperCase()}
                    </span>
                    <Button size="small">
                      {patient.status === "registered"
                        ? "Enter Results"
                        : "View"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      <div className="patients-section">
        <h2 className="section-title">Recently Completed Reports</h2>
        {completedPatients.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="var(--text-tertiary)" />
            <p>No completed reports yet</p>
          </div>
        ) : (
          <div className="patient-list">
            {completedPatients.slice(0, 5).map((patient) => {
              const profile = getProfileById(patient.testProfile);
              return (
                <div
                  key={patient.id}
                  className="patient-card"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <div className="patient-info">
                    <h4>{patient.name}</h4>
                    <p>
                      {patient.age} years • {patient.gender}
                    </p>
                    <span className="profile-badge">{profile?.shortName}</span>
                  </div>
                  <div className="patient-status">
                    <p className="completed-time">
                      {patient.reportedAt
                        ? new Date(patient.reportedAt).toLocaleString()
                        : "-"}
                    </p>
                    <Button size="small" variant="secondary">
                      View Report
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
