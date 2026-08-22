import React, { useState, useEffect } from "react";
import { 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Zap, 
  Building2, 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  RefreshCw, 
  Check, 
  Layers, 
  CreditCard 
} from "lucide-react";
import { apiService } from "../api/client";

export default function Upload({ onUploadSuccess }) {
  // Main Mode: 'aggregator' or 'csv'
  const [activeMode, setActiveMode] = useState("aggregator");

  // --- CSV Mode States ---
  const [file, setFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvStatus, setCsvStatus] = useState(null); // 'success' or 'error'
  const [importedCount, setImportedCount] = useState(0);
  const [parsedData, setParsedData] = useState([]);

  // --- Account Aggregator States ---
  // Step: 1 = Discover, 2 = Select Accounts, 3 = OTP Consent, 4 = Success
  const [aaStep, setAaStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [aaHandle, setAaHandle] = useState("finvu");
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [otp, setOtp] = useState("");
  const [aaLoading, setAaLoading] = useState(false);
  const [aaError, setAaError] = useState(null);
  const [consentArtifact, setConsentArtifact] = useState(null);
  const [syncSummary, setSyncSummary] = useState(null);

  // --- CSV Handlers ---
  const handleDragOver = (e) => e.preventDefault();
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

  const handleCsvUpload = async () => {
    if (!file) return;
    setCsvLoading(true);
    setCsvStatus(null);
    try {
      const res = await apiService.uploadStatement(file);
      if (res.status === "success" || res.imported !== undefined) {
        setCsvStatus("success");
        setImportedCount(res.imported);
        setParsedData(res.transactions || []);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setCsvStatus("error");
      }
    } catch (err) {
      console.error(err);
      setCsvStatus("error");
    } finally {
      setCsvLoading(false);
    }
  };

  // --- Account Aggregator Handlers ---
  const handleDemoFill = () => {
    setPhone("9876543210");
    setAaHandle("finvu");
    setAaError(null);
  };

  const handleDiscover = async (e) => {
    e?.preventDefault();
    if (!phone || phone.length < 10) {
      setAaError("Please enter a valid 10-digit mobile number");
      return;
    }
    setAaLoading(true);
    setAaError(null);
    try {
      const res = await apiService.discoverAccounts(phone, aaHandle);
      if (res.accounts && res.accounts.length > 0) {
        setDiscoveredAccounts(res.accounts);
        // By default select all discovered accounts
        setSelectedAccounts(res.accounts.map(a => a.id));
        setAaStep(2);
      } else {
        setAaError("No bank accounts discovered for this number. Try 9876543210.");
      }
    } catch (err) {
      console.error(err);
      setAaError("Failed to connect to Account Aggregator network.");
    } finally {
      setAaLoading(false);
    }
  };

  const toggleAccountSelection = (accId) => {
    setSelectedAccounts(prev => 
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  const handleRequestOtp = async () => {
    if (selectedAccounts.length === 0) {
      setAaError("Please select at least one bank account to link");
      return;
    }
    setAaLoading(true);
    setAaError(null);
    try {
      const res = await apiService.requestAAOtp(phone, selectedAccounts);
      setConsentArtifact(res.consent_artifact);
      setAaStep(3);
    } catch (err) {
      console.error(err);
      setAaError("Failed to initiate RBI consent session.");
    } finally {
      setAaLoading(false);
    }
  };

  const handleVerifyConsent = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length !== 6) {
      setAaError("Please enter the 6-digit OTP (Use: 123456)");
      return;
    }
    setAaLoading(true);
    setAaError(null);
    try {
      const res = await apiService.verifyAAConsent(otp, selectedAccounts);
      setSyncSummary(res);
      setAaStep(4);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setAaError(err.response?.data?.error || "OTP verification failed. Please try 123456.");
    } finally {
      setAaLoading(false);
    }
  };

  const handleResetAA = () => {
    setAaStep(1);
    setPhone("");
    setOtp("");
    setDiscoveredAccounts([]);
    setSelectedAccounts([]);
    setSyncSummary(null);
    setAaError(null);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ color: "var(--text-primary)" }}>Bank Statement & Account Sync</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Choose your preferred method to import your financial transactions into DhanSaarthi.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{
        display: "flex",
        gap: "12px",
        backgroundColor: "rgba(24, 24, 27, 0.6)",
        padding: "6px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        width: "fit-content"
      }}>
        <button
          onClick={() => setActiveMode("aggregator")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "var(--radius-sm)",
            border: activeMode === "aggregator" ? "1px solid var(--brand-gold)" : "1px solid transparent",
            backgroundColor: activeMode === "aggregator" ? "rgba(245, 158, 11, 0.15)" : "transparent",
            color: activeMode === "aggregator" ? "var(--brand-gold)" : "var(--text-secondary)",
            fontWeight: activeMode === "aggregator" ? "700" : "500",
            fontSize: "0.92rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <Zap size={18} style={{ color: "var(--brand-gold)" }} />
          <span>Instant Bank Sync (RBI Account Aggregator)</span>
          <span style={{
            fontSize: "0.7rem",
            backgroundColor: "var(--brand-emerald)",
            color: "#09090b",
            padding: "2px 6px",
            borderRadius: "10px",
            fontWeight: "700"
          }}>
            RECOMMENDED
          </span>
        </button>

        <button
          onClick={() => setActiveMode("csv")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "var(--radius-sm)",
            border: activeMode === "csv" ? "1px solid var(--brand-gold)" : "1px solid transparent",
            backgroundColor: activeMode === "csv" ? "rgba(245, 158, 11, 0.15)" : "transparent",
            color: activeMode === "csv" ? "var(--brand-gold)" : "var(--text-secondary)",
            fontWeight: activeMode === "csv" ? "700" : "500",
            fontSize: "0.92rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <UploadCloud size={18} />
          <span>Upload CSV Statement File</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* MODE 1: ACCOUNT AGGREGATOR FLOW                                   */}
      {/* ================================================================ */}
      {activeMode === "aggregator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", alignItems: "start" }}>
          {/* Main Flow Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Step 1: Discover Accounts */}
            {aaStep === 1 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Smartphone size={20} style={{ color: "var(--brand-gold)" }} />
                      Discover Your Linked Bank Accounts
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Enter your mobile number to discover accounts across HDFC, SBI, ICICI, Axis, and Kotak.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoFill}
                    style={{
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      color: "var(--brand-gold)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Demo Autofill
                  </button>
                </div>

                {aaError && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-red)", color: "var(--text-primary)", padding: "10px", borderRadius: "6px", fontSize: "0.85rem" }}>
                    {aaError}
                  </div>
                )}

                <form onSubmit={handleDiscover} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Registered Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Aggregator Handle (FIP)</label>
                    <select
                      className="form-control"
                      value={aaHandle}
                      onChange={e => setAaHandle(e.target.value)}
                    >
                      <option value="finvu">@finvu (Finsec AA)</option>
                      <option value="onemoney">@onemoney (OneMoney AA)</option>
                      <option value="setu">@setu (Setu AA)</option>
                      <option value="anumati">@anumati (Perfios AA)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={aaLoading || !phone}
                    style={{ padding: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {aaLoading ? "Discovering Accounts Across Banks..." : "Discover Linked Accounts"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Account Selection */}
            {aaStep === 2 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Select Accounts to Sync ({discoveredAccounts.length} Found)</h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Choose which accounts you'd like to link to DhanSaarthi.
                    </p>
                  </div>
                  <button
                    onClick={() => setAaStep(1)}
                    style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Change Number
                  </button>
                </div>

                {aaError && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-red)", color: "var(--text-primary)", padding: "10px", borderRadius: "6px", fontSize: "0.85rem" }}>
                    {aaError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {discoveredAccounts.map((acc) => {
                    const isSelected = selectedAccounts.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => toggleAccountSelection(acc.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: isSelected ? "1px solid var(--brand-emerald)" : "1px solid var(--border)",
                          backgroundColor: isSelected ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: acc.logo_color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: "800",
                            fontSize: "0.85rem"
                          }}>
                            {acc.bank_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong style={{ color: "var(--text-primary)" }}>{acc.bank_name}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{acc.account_number}</span>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {acc.account_type} • {acc.branch}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "16px" }}>
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Available Balance</div>
                            <strong style={{ color: "var(--brand-emerald)", fontSize: "0.95rem" }}>
                              ₹{acc.balance.toLocaleString()}
                            </strong>
                          </div>
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: isSelected ? "1px solid var(--brand-emerald)" : "1px solid var(--border)",
                            backgroundColor: isSelected ? "var(--brand-emerald)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {isSelected && <Check size={14} color="#09090b" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleRequestOtp}
                  disabled={aaLoading || selectedAccounts.length === 0}
                  className="btn btn-primary"
                  style={{ padding: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {aaLoading ? "Requesting RBI Consent Artifact..." : `Grant Consent for ${selectedAccounts.length} Account(s)`}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 3: RBI Consent & OTP Verification */}
            {aaStep === 3 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Lock size={20} style={{ color: "var(--brand-gold)" }} />
                    Authorize RBI Consent with OTP
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    An OTP has been sent to your mobile ending with ...{phone.slice(-4) || "3210"}.
                  </p>
                </div>

                {/* Consent Artifact Summary Card */}
                {consentArtifact && (
                  <div style={{
                    backgroundColor: "rgba(245, 158, 11, 0.06)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "14px",
                    fontSize: "0.82rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Purpose:</span>
                      <strong style={{ color: "var(--text-primary)" }}>{consentArtifact.purpose}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Data Frequency:</span>
                      <span>{consentArtifact.data_frequency}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Data Range:</span>
                      <span>{consentArtifact.data_range}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)" }}>Consent Validity:</span>
                      <span>1 Year (Revocable anytime)</span>
                    </div>
                  </div>
                )}

                {aaError && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-red)", color: "var(--text-primary)", padding: "10px", borderRadius: "6px", fontSize: "0.85rem" }}>
                    {aaError}
                  </div>
                )}

                <form onSubmit={handleVerifyConsent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label className="form-label" style={{ margin: 0 }}>Enter 6-Digit OTP</label>
                      <button
                        type="button"
                        onClick={() => setOtp("123456")}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--brand-emerald)",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Autofill Demo OTP (123456)
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      maxLength={6}
                      style={{ letterSpacing: "8px", fontSize: "1.2rem", textAlign: "center", fontWeight: "700" }}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setAaStep(2)}
                      className="btn"
                      style={{ flex: 1, border: "1px solid var(--border)", background: "transparent" }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={aaLoading || !otp}
                      className="btn btn-primary"
                      style={{ flex: 2, padding: "12px", fontWeight: "700" }}
                    >
                      {aaLoading ? "Authorizing & Syncing Streams..." : "Verify & Link Accounts"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Success */}
            {aaStep === 4 && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", padding: "20px 0" }}>
                <CheckCircle size={64} style={{ color: "var(--brand-emerald)" }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Bank Accounts Successfully Linked!</h2>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                    {syncSummary?.message || "Your bank streams have been securely ingested into DhanSaarthi."}
                  </p>
                </div>

                <div style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid var(--brand-emerald)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 24px",
                  display: "flex",
                  gap: "24px"
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Accounts Connected</div>
                    <strong style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}>{selectedAccounts.length} Banks</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Transactions Synced</div>
                    <strong style={{ color: "var(--brand-emerald)", fontSize: "1.1rem" }}>{syncSummary?.imported_transactions_count || 18} txns</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button
                    onClick={handleResetAA}
                    className="btn"
                    style={{ border: "1px solid var(--border)", background: "transparent", fontSize: "0.85rem" }}
                  >
                    <RefreshCw size={14} style={{ marginRight: "6px" }} />
                    Link More Accounts
                  </button>
                  <button
                    onClick={() => {
                      if (onUploadSuccess) onUploadSuccess();
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: "0.85rem", fontWeight: "700" }}
                  >
                    View Updated Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account Aggregator Benefits & Security Info Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px", margin: 0, color: "var(--text-primary)" }}>
              <ShieldCheck size={18} style={{ color: "var(--brand-emerald)" }} />
              RBI Account Aggregator Security
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "var(--brand-emerald)", fontWeight: "700" }}>✓</span>
                <span><strong>No Password Sharing:</strong> Login credentials or transaction OTPs are never asked or stored.</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "var(--brand-emerald)", fontWeight: "700" }}>✓</span>
                <span><strong>End-to-End Encrypted:</strong> Financial data is encrypted at the source bank and only decrypted on your device.</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "var(--brand-emerald)", fontWeight: "700" }}>✓</span>
                <span><strong>Revocable Anytime:</strong> You maintain 100% granular control to revoke data access whenever you want.</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "var(--brand-emerald)", fontWeight: "700" }}>✓</span>
                <span><strong>Multi-Bank Consolidation:</strong> Eliminates downloading 5 different statement PDFs every month.</span>
              </div>
            </div>

            <div style={{
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              color: "var(--text-muted)"
            }}>
              💡 <strong>Supported Institutions:</strong> HDFC, SBI, ICICI, Axis, Kotak, PNB, Bank of Baroda & 25+ licensed FIPs.
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODE 2: MANUAL CSV STATEMENT UPLOAD                               */}
      {/* ================================================================ */}
      {activeMode === "csv" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                  disabled={!file || csvLoading}
                  onClick={handleCsvUpload}
                  style={{ padding: "10px 24px" }}
                >
                  {csvLoading ? "Processing..." : "Process Statement"}
                </button>
              </div>
            </div>

            {/* Status / Log Card */}
            <div className="card" style={{ minHeight: "264px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "16px" }}>
              {csvStatus === "success" && (
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

              {csvStatus === "error" && (
                <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <AlertTriangle size={56} style={{ color: "var(--accent-red)" }} />
                  <h2 style={{ marginBottom: 0 }}>Parsing Failed</h2>
                  <p style={{ maxWidth: "340px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    The CSV structure could not be identified automatically. Make sure columns like Date, Description, and Amount are clearly present.
                  </p>
                </div>
              )}

              {!csvStatus && (
                <div style={{ color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <FileText size={48} style={{ opacity: 0.5 }} />
                  <p style={{ fontSize: "0.95rem" }}>Upload a CSV statement to see parsing logs and results.</p>
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
      )}
    </div>
  );
}
