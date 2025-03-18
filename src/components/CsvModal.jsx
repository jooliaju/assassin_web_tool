import React from "react";
import "./CsvModal.css";

function CsvModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2>CSV Format Instructions</h2>
        <p>Your CSV file should have two columns: "name" and "email"</p>

        <p>Example:</p>

        <pre>
          name,email
          <br />
          John,john@example.com
          <br />
          Sarah,sarah@example.com
          <br />
          Mike,mike@example.com
        </pre>
      </div>
    </div>
  );
}

export default CsvModal;
