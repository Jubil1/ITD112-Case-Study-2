import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import {
  writeBatch,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  arrayUnion,
} from "firebase/firestore";

const metadataDocRef = doc(db, "metadata", "datasets");

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [datasets, setDatasets] = useState({});
  const [activeTab, setActiveTab] = useState("Visualization");
  const [rowsToShow, setRowsToShow] = useState(8);

  useEffect(() => {
    const fetchDatasetsOnLoad = async () => {
      console.log("Fetching existing datasets from Firebase...");
      try {
        const metadataSnapshot = await getDoc(metadataDocRef);

        if (!metadataSnapshot.exists()) {
          console.log("No 'metadata' document found. Starting fresh.");
          return;
        }

        const collectionNames = metadataSnapshot.data().names || [];
        if (collectionNames.length === 0) {
          console.log("No datasets have been uploaded yet.");
          return;
        }
        
        console.log("Loading collections:", collectionNames);
        const loadedDatasets = {};
        const metadataUpdates = {}; // Track headers that need to be saved

        for (const collectionName of collectionNames) {
          const colRef = collection(db, collectionName);
          const docsSnapshot = await getDocs(colRef);

          if (docsSnapshot.empty) {
            console.warn(`Collection ${collectionName} is empty.`);
            continue;
          }

          // Sort by _rowIndex to preserve original order
          const data = docsSnapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => (a._rowIndex || 0) - (b._rowIndex || 0));

          // Get headers from metadata
          let storedHeaders = metadataSnapshot.data()[`${collectionName}_headers`];
          
          // AUTO-FIX: If headers are missing, reconstruct from first row
          if (!storedHeaders || storedHeaders.length === 0) {
            console.warn(`⚠️ Missing headers for ${collectionName}. Auto-recovering...`);
            
            // Get all keys from first document, excluding internal fields
            const allKeys = Object.keys(data[0]).filter(key => key !== '_rowIndex');
            
            // Try to intelligently order: put string-like keys first, numbers last
            const sortedHeaders = allKeys.sort((a, b) => {
              // Check if keys look like years or numbers
              const aIsNumber = /^\d+$/.test(a);
              const bIsNumber = /^\d+$/.test(b);
              
              if (aIsNumber && !bIsNumber) return 1;  // b comes first
              if (!aIsNumber && bIsNumber) return -1; // a comes first
              
              // Both same type, sort alphabetically
              return a.localeCompare(b);
            });
            
            storedHeaders = sortedHeaders;
            metadataUpdates[`${collectionName}_headers`] = sortedHeaders;
            
            console.log(`✅ Auto-recovered headers for ${collectionName}:`, sortedHeaders);
          }

          loadedDatasets[collectionName] = {
            data: data,
            headers: storedHeaders,
            fileName: `${collectionName.replace(/_/g, " ")}.xlsx`
          };
        }

        // Save any auto-recovered headers back to Firebase
        if (Object.keys(metadataUpdates).length > 0) {
          console.log("💾 Saving auto-recovered headers to Firebase...");
          await setDoc(metadataDocRef, metadataUpdates, { merge: true });
          console.log("✅ Auto-recovered headers saved successfully!");
        }

        setDatasets(loadedDatasets);
        
        const firstLoadedKey = Object.keys(loadedDatasets)[0];
        if (firstLoadedKey) {
          setActiveTab(firstLoadedKey);
        }
        
      } catch (error) {
        console.error("Error fetching datasets on load:", error);
      }
    };

    fetchDatasetsOnLoad();
  }, []); 

  
  const uploadDataToFirestore = async (dataToUpload, originalFileName, idColumnName, headersRow) => {
    if (!dataToUpload || dataToUpload.length === 0) return;

    const collectionName = originalFileName
      ? originalFileName
          .replace(/\.[^/.]+$/, "")
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .toLowerCase()
      : "default_collection";

    if (collectionName.length === 0) {
      console.error("Could not create a valid collection name.");
      return;
    }

    const colRef = collection(db, collectionName);
    const batch = writeBatch(db);

    // Add row index when uploading
    dataToUpload.forEach((row, index) => {
      const rawDocId = row[idColumnName]; 
      
      if (rawDocId && typeof rawDocId === 'string' && rawDocId.trim() !== "") {
        const docId = rawDocId.replace(/\//g, "-"); 
        const docRef = doc(colRef, docId); 
        batch.set(docRef, { ...row, _rowIndex: index });
      } else {
        console.warn(`Skipping row with invalid ID in column '${idColumnName}':`, row);
      }
    });

    try {
      await batch.commit();
      console.log(`✅ Success! Uploaded ${dataToUpload.length} rows to collection: ${collectionName}`);

      // CRITICAL FIX: Save headers with verification
      await setDoc(metadataDocRef, {
        names: arrayUnion(collectionName),
        [`${collectionName}_headers`]: headersRow
      }, { merge: true }); 

      console.log(`✅ Headers saved for: ${collectionName}`, headersRow);
      
      // Verify headers were actually saved
      const verifyDoc = await getDoc(metadataDocRef);
      const savedHeaders = verifyDoc.data()[`${collectionName}_headers`];
      
      if (!savedHeaders || savedHeaders.length === 0) {
        console.error(`❌ CRITICAL: Headers verification failed for ${collectionName}!`);
        // Retry once
        await setDoc(metadataDocRef, {
          [`${collectionName}_headers`]: headersRow
        }, { merge: true });
        console.log(`🔄 Retried saving headers for: ${collectionName}`);
      } else {
        console.log(`✅ Headers verified for: ${collectionName}`);
      }

    } catch (error) {
      console.error("❌ Error uploading batch to Firestore:", error);
      alert(`Upload failed for ${collectionName}: ${error.message}`);
    }
  };

  const onFileSelect = (files) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        jsonData = jsonData.filter((row) =>
          row.some((cell) => cell !== null && cell !== "" && cell !== undefined)
        );

        const headerRowIndex = 1;

        if (jsonData.length <= headerRowIndex) {
          alert(`Error in file ${file.name}: File must have at least 2 rows (header and data).`);
          return;
        }

        const headersRow = jsonData[headerRowIndex];
        const rows = jsonData.slice(headerRowIndex + 1);

        const idKey = headersRow[0] ? headersRow[0].toString().trim() : 'Column1';

        const cleanData = rows.map((row) => {
          const filled = [...row];
          while (filled.length < headersRow.length) filled.push("");
          const obj = {};

          headersRow.forEach((header, i) => {
            const key = header ? header.toString().trim() : `Column${i + 1}`;
            let cellValue = filled[i];

            if (cellValue && typeof cellValue === 'object' && cellValue.v !== undefined) {
              cellValue = cellValue.v; 
            }

            if (key === idKey) { 
              obj[key] = (cellValue === null || cellValue === undefined) ? "" : cellValue.toString().trim();
            } else {
              obj[key] = (cellValue === null || cellValue === undefined || cellValue === "") ? 0 : cellValue;
            }
          });
          return obj;
        });

        const idColumnName = headersRow[0] ? headersRow[0].toString().trim() : 'Column1';

        const filteredData = cleanData.filter(row => {
          const idValue = row[idColumnName];

          if (typeof idValue !== 'string') {
            return false; 
          }
          
          if (idValue.toLowerCase().includes("source")) {
            return false;
          }

          if (idValue.trim() === "") {
            return false;
          }
          
          return true;
        });

        const collectionName = file.name
          ? file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/\s+/g, "_")
              .replace(/[^a-zA-Z0-9_]/g, "")
              .toLowerCase()
          : "default_collection";

        setDatasets(prevDatasets => ({
          ...prevDatasets,
          [collectionName]: {
            data: filteredData,
            headers: headersRow,
            fileName: file.name
          }
        }));
        
        setActiveTab(collectionName);
        
        uploadDataToFirestore(filteredData, file.name, idColumnName, headersRow);
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div style={styles.appWrapper}>
      <div
        style={{
          ...styles.sidebarContainer,
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <Sidebar
          onFileSelect={onFileSelect}
          lastFileName={""} 
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      <main style={styles.main(isSidebarOpen)}>
        {!isSidebarOpen && (
          <button style={styles.openButton} onClick={handleToggleSidebar}>
            ☰
          </button>
        )}
        <header style={styles.mainHeader}>
          <h1 style={{ margin: 0 }}>
            Visualizing Four Decades of Filipino Emigration
          </h1>
        </header>

        <nav style={styles.tabsNav}>
          {Object.keys(datasets).map((datasetKey) => (
            <button
              key={datasetKey}
              onClick={() => setActiveTab(datasetKey)}
              style={{
                ...styles.tabButton,
                ...(activeTab === datasetKey ? styles.activeTabButton : {}),
              }}
            >
              {datasetKey}
            </button>
          ))}
          
          {["Visualization", "Settings"].map((tabLabel) => (
            <button
              key={tabLabel}
              onClick={() => setActiveTab(tabLabel)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tabLabel ? styles.activeTabButton : {}),
              }}
            >
              {tabLabel}
            </button>
          ))}
        </nav>

        <section style={styles.content}>
          {datasets[activeTab] ? (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ marginBottom: 8 }}>{datasets[activeTab].fileName}</h3>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  Rows to show:{" "}
                  <input
                    type="number"
                    min="1"
                    max={datasets[activeTab].data.length}
                    value={rowsToShow}
                    onChange={(e) =>
                      setRowsToShow(Number(e.target.value) || 1)
                    }
                    style={{
                      marginLeft: 8,
                      width: 70,
                      padding: "4px 6px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                    }}
                  />
                </label>
                <span
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    marginLeft: 10,
                  }}
                >
                  (Total rows: {datasets[activeTab].data.length})
                </span>
              </div>

              <div style={styles.previewBox}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {datasets[activeTab].headers.map((h, i) => (
                          <th key={i} style={styles.tableHeader}>
                            {h || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasets[activeTab].data.slice(0, rowsToShow).map((row, rIdx) => (
                        <tr key={rIdx} style={styles.tableRow}>
                          {datasets[activeTab].headers.map((h, cIdx) => (
                            <td key={cIdx} style={styles.tableCell}>
                              {row[h] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={styles.rowCountNote}>
                  Showing first {rowsToShow} rows • Scroll horizontally to
                  see all columns →
                </div>
              </div>
            </div>
          ) : (
            activeTab !== "Visualization" && activeTab !== "Settings" && (
              <div style={{ marginTop: 12, color: "#6b7280" }}>
                {Object.keys(datasets).length > 0 ? "Select a dataset." : "Upload an Excel file from the sidebar."}
              </div>
            )
          )}

          {activeTab === "Visualization" && (
            <div style={styles.placeholderBox}>
              📊 Visualization placeholder (charts coming next)
            </div>
          )}

          {activeTab === "Settings" && (
            <div style={styles.placeholderBox}>
              ⚙️ Settings placeholder (will configure chart options)
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  appWrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Inter, Arial, sans-serif",
    background: "#f3f4f6",
    overflow: "hidden",
    position: "relative",
  },
  sidebarContainer: {
    width: 260,
    background: "#fff",
    boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
    transition: "transform 0.3s ease-in-out",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 5,
  },
  main: (isSidebarOpen) => ({
    flex: 1,
    padding: 28,
    marginLeft: isSidebarOpen ? 260 : 60,
    transition: "margin-left 0.3s ease, padding-left 0.3s ease",
    position: "relative",
    minWidth: 0,
  }),
  tabsNav: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 8,
    overflowX: "auto",
    whiteSpace: "nowrap",
  },
  tabButton: {
    background: "none",
    border: "none",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
    borderRadius: 6,
    transition: "background 0.15s ease, color 0.15s ease",
    flexShrink: 0,
  },
  activeTabButton: {
    background: "#111827",
    color: "#fff",
  },
  mainHeader: { marginBottom: 20 },
  content: { 
    marginTop: 8,
    minWidth: 0,
  },
  previewBox: {
    background: "#ffffff",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: 14,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    maxWidth: "100%",
    minWidth: 0,
  },
  tableWrapper: {
    overflowX: "auto",
    overflowY: "visible",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    maxWidth: "100%",
    minWidth: 0,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
    scrollbarColor: "#9ca3af #f3f4f6",
  },
  table: {
    width: "max-content", 
    minWidth: "100%", 
    borderCollapse: "collapse",
    fontSize: 13,
  },
  tableHeader: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontWeight: 600,
    whiteSpace: "nowrap",
    minWidth: 100, 
  },
  tableRow: {
    transition: "background 0.15s ease",
  },
  tableCell: {
    padding: "6px 8px",
    borderBottom: "1px solid #f3f4f6",
    whiteSpace: "nowrap",
    minWidth: 100, 
  },
  rowCountNote: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 13,
  },
  placeholderBox: {
    background: "#fff",
    padding: 40,
    borderRadius: 8,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  openButton: {
    position: "fixed",
    top: 20,
    left: 20,
    background: "#1f2937",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 20,
    zIndex: 10,
  },
};