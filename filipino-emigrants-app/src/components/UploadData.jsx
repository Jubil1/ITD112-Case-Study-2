import { useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function UploadData({ data, fileName }) {
  // 🧹 Clean file name for Firestore
  const collectionName = fileName
    ? fileName
        .replace(/\.[^/.]+$/, "") // remove file extension
        .replace(/\s+/g, "_") // replace spaces
        .replace(/[^a-zA-Z0-9_]/g, "") // remove special chars
        .toLowerCase()
    : "default_collection";

  useEffect(() => {
    const uploadToFirestore = async () => {
      if (!data || data.length === 0) return;

      try {
        const colRef = collection(db, collectionName);
        for (const row of data) {
          await addDoc(colRef, row);
        }
        alert(`✅ Automatically uploaded ${data.length} rows to Firestore collection: ${collectionName}`);
      } catch (error) {
        console.error("❌ Error uploading to Firestore:", error);
        alert("Error uploading data. Check console for details.");
      }
    };

    uploadToFirestore();
  }, [data, collectionName]);

}
