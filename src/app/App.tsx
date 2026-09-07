import React from 'react';
import './App.css';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <svg
              className="header-logo"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="8"
                width="28"
                height="18"
                rx="2"
                fill="#8B5A2B"
                stroke="#5C3A1E"
                strokeWidth="2"
              />
              <rect x="4" y="10" width="24" height="4" fill="#C49A6C" />
              <line x1="6" y1="12" x2="26" y2="12" stroke="#5C3A1E" strokeWidth="1.5" />
              <rect
                x="10"
                y="6"
                width="12"
                height="4"
                rx="1"
                fill="#D2B48C"
                stroke="#5C3A1E"
                strokeWidth="1.5"
              />
            </svg>
            <span className="header-title">Japanese Toolbox Designer</span>
          </div>
          <span className="header-badge">Phase 1</span>
        </div>
      </header>

      <main className="app-main">
        <section className="hero-card">
          <h1 className="hero-title">Japanese Toolbox Designer</h1>
          <p className="hero-subtitle">Parametric Japanese toolbox design in your browser.</p>
          <p className="hero-description">
            A parametric design tool for traditional Japanese toolboxes with sliding lids and
            wedge-locking battens. Built for woodworkers to eliminate complex sliding lid and
            locking wedge calculations.
          </p>
        </section>

        <section className="status-card">
          <h2 className="status-title">Project Foundation Active</h2>
          <p className="status-text">
            Application shell, build pipelines, testing suites, and deployment workflows are ready.
            Parametric domain models and geometry calculation modules will be added in subsequent
            phases.
          </p>
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>Japanese Toolbox Designer &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
