import React from "react";
import { Menu } from "lucide-react";

// The 'lastFileName' prop is no longer needed
export default function Sidebar({ onFileSelect, onToggleSidebar, isSidebarOpen }) {
  
  // MODIFIED: This now handles multiple files
  const handleChange = (e) => {
    const files = e.target.files; // Get the full list of files
    if (!files || files.length === 0) return;
    if (onFileSelect) onFileSelect(files); // Pass the entire list
  };

  return (
    <aside style={styles.sidebar}>
      {isSidebarOpen && (
        <div style={styles.topBar}>
          <button
            onClick={() => onToggleSidebar && onToggleSidebar()}
            style={styles.toggleBtn}
            aria-label="Toggle sidebar"
          >
            {typeof Menu === "function" ? (
              <Menu size={20} color="#fff" />
            ) : (
              <span style={{ fontSize: 18 }}>☰</span>
            )}
          </button>
        </div>
      )}

      <div style={styles.header}>
        <span style={{ fontSize: 22 }}>📂</span>
        <div style={{ marginLeft: 10 }}>
          <div style={styles.title}>Filipino Emigrant Datasets</div>
          <div style={styles.subtitle}>
            Upload datasets here and navigate between tabs in the main area.
          </div>
        </div>
      </div>

      <div style={styles.uploadBox}>
        <label style={styles.uploadLabel}>Upload dataset(s)</label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleChange}
          style={styles.fileInput}
          multiple // <-- MODIFIED: Added this attribute
        />
      </div>

      {/* REMOVED: The 'fileInfo' box for 'lastFileName' was here */}

      <div style={styles.hintBox}>
        <strong>Tip</strong>
        <p style={{ margin: "6px 0 0 0", fontSize: 13 }}>
          You can now select multiple files to upload them all at once.
        </p>
      </div>
    </aside>
  );
}

// --- (Styles are mostly unchanged, just removing 'fileInfo' and 'fileName') ---
const styles = {
  sidebar: {
    width: 260,
    minWidth: 260,
    background: "#1f2937",
    color: "#fff",
    padding: 20,
    boxSizing: "border-box",
    height: "100vh",
    overflow: "auto",
    position: "relative",
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  toggleBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    padding: 6,
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 13,
    color: "#c7d2fe",
    marginTop: 4,
    maxWidth: 200,
    lineHeight: "1.25",
  },
  uploadBox: {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 8,
  },
  uploadLabel: {
    display: "block",
    fontSize: 13,
    marginBottom: 8,
    color: "#e6e6e6",
  },
  fileInput: {
    display: "block",
    marginBottom: 12,
  },
  // REMOVED: 'fileInfo' and 'fileName' styles
  hintBox: {
    marginTop: 18,
    background: "#111827",
    padding: 12,
    borderRadius: 8,
    color: "#c7d2fe",
    fontSize: 13,
  },
};