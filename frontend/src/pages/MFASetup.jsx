import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/MFASetup.module.css";

export default function MFASetup() {
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/register");
      return;
    }

    axios.post("/totp/setup", { userId })
      .then(({ data }) => setQrCode(data.qrCode))
      .catch(() => setError("Failed to generate QR code. Please try again."))
      .finally(() => setFetching(false));
  }, [navigate]);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const { data } = await axios.post("/totp/verify", { userId, token: code });
      localStorage.removeItem("userId");
      localStorage.setItem("token", data.token);
      navigate("/vault");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>🔐</div>
          <h1 className={styles.title}>Password Vault</h1>
        </div>
        <p className={styles.subtitle}>Set up two-factor authentication</p>

        {fetching && <p className={styles.hint}>Generating QR code...</p>}

        {qrCode && (
          <>
            <p className={styles.instructions}>
              Scan this QR code with your authenticator app, then enter the 6-digit code below to confirm setup.
            </p>
            <div className={styles.qrWrapper}>
              <img src={qrCode} alt="MFA QR Code" className={styles.qrCode} />
            </div>
          </>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Authentication Code</label>
          <input
            className={styles.input}
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.button}
          onClick={handleVerify}
          disabled={loading || fetching || code.length !== 6}
        >
          {loading ? "Verifying..." : "Confirm Setup"}
        </button>
      </div>
    </div>
  );
}
