import React, { useState } from 'react';
import { createDefaultToolboxDesign, type ToolboxDesign } from '../domain';
import { DesignEditor } from '../features/editor';
import './App.css';

export const App: React.FC = () => {
  const [design, setDesign] = useState<ToolboxDesign>(() => createDefaultToolboxDesign());

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
          <span className="header-badge">Design Editor</span>
        </div>
      </header>

      <main className="app-main">
        <div className="workspace-intro">
          <h1 className="workspace-title">Japanese Toolbox Designer</h1>
          <p className="workspace-subtitle">Parametric Japanese toolbox design in your browser.</p>
        </div>

        <DesignEditor design={design} onDesignChange={setDesign} />
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
