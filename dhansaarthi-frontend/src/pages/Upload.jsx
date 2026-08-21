import React, { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { apiService } from "../api/client";

export default function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' or 'error'
  const [importedCount, setImportedCount] = useState(0);
  const [parsedData, setParsedData] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiService.uploadStatement(file);
      if (res.status === "success" || res.imported !== undefined) {
        setStatus("success");
        setImportedCount(res.imported);
        setParsedData(res.transactions || []);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ color: "var(--text-primary)" }}>Upload Statement</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Import your bank statement or credit card statement in CSV format to analyze your transactions.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Upload Zone Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2>CSV Statement Ingestion</h2>
          
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "40px 20px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "rgba(255, 255, 255, 0.01)",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-focus)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <UploadCloud size={48} style={{ color: "var(--brand-emerald)", marginBottom: "16px" }} />
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FileText size={20} style={{ color: "var(--brand-gold)" }} />
                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{file.name}</span>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>Drag & drop your CSV file here</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>or click to browse from files</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Supports Date, Description, Amount (or Debit/Credit) headers.</span>
            <button
              className="btn btn-primary"
              disabled={!file || loading}
              onClick={handleUpload}
              style={{ padding: "10px 24px" }}
            >
              {loading ? "Processing..." : "Process Statement"}
            </button>
          </div>
        </div>

        {/* Status / Log Card */}
        <div className="card" style={{ minHeight: "264px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "16px" }}>
          {status === "success" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <CheckCircle size={56} style={{ color: "var(--brand-emerald)" }} />
              <h2 style={{ marginBottom: 0 }}>Statement Imported!</h2>
              <span className="badge badge-green" style={{ padding: "6px 14px" }}>
                {importedCount} Transactions Parsed
              </span>
              <p style={{ maxWidth: "340px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Your financial profile and confidence scores have been updated to reflect these statements.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={56} style={{ color: "var(--accent-red)" }} />
              <h2 style={{ marginBottom: 0 }}>Parsing Failed</h2>
              <p style={{ maxWidth: "340px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                The CSV structure could not be identified automatically. Make sure columns like Date, Description, and Amount are clearly present.
              </p>
            </div>
          )}

          {!status && (
            <div style={{ color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <FileText size={48} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: "0.95rem" }}>Upload a statement to see parsing logs and results.</p>
            </div>
          )}
        </div>
      </div>

      {/* Parsed Transactions Preview */}
      {parsedData.length > 0 && (
        <div className="card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2>Parsed Data Preview ({parsedData.length} records)</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "12px 8px" }}>Date</th>
                  <th style={{ padding: "12px 8px" }}>Description</th>
                  <th style={{ padding: "12px 8px" }}>Category</th>
                  <th style={{ padding: "12px 8px" }}>Type</th>
                  <th style={{ padding: "12px 8px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{t.date || t.transaction_date}</td>
                    <td style={{ padding: "12px 8px", fontWeight: "500" }}>{t.description}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className="badge" style={{
                        backgroundColor: t.type === "income" ? "rgba(16, 185, 129, 0.05)" : "rgba(255,255,255,0.05)",
                        color: t.type === "income" ? "var(--brand-emerald)" : "var(--text-primary)"
                      }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", color: t.type === "income" ? "var(--brand-emerald)" : "var(--accent-red)", textTransform: "capitalize" }}>
                      {t.type || t.transaction_type}
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", color: t.type === "income" ? "var(--brand-emerald)" : "var(--text-primary)" }}>
                      ₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedData.length > 10 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "8px" }}>
              Showing first 10 transactions. All {parsedData.length} records were loaded.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
