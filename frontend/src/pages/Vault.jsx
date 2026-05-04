import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Vault.module.css";
import { Key, Lock, Plus, Pencil, Trash2, Copy, Eye, ExternalLink } from "lucide-react";
import PasswordGenerator from "../components/PasswordGenerator";

const MOCK_CREDENTIALS = [
  {
    id: 1,
    title: "Outlook Account",
    category: "personal",
    username: "cisnerosthania@outlook.com",
    password: "••••••••••••",
    website: null,
  },
  {
    id: 2,
    title: "Oregon State University",
    category: "other",
    username: "cisnerth@oregonstate.edu",
    password: "••••••••••••",
    website: "https://technology.oregonstate.edu/services/beaver-hub",
  },
];

const FILTERS = ["All", "Personal", "Work", "Finance", "Social", "Other"];

export default function Vault() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showGenerator, setShowGenerator] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {showGenerator && <PasswordGenerator onClose={() => setShowGenerator(false)} />}

      {showLockConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <Lock size={28} />
            <h2>Lock Vault?</h2>
            <p>You'll be returned to the sign-in portal.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setShowLockConfirm(false)}>Cancel</button>
              <button className={styles.confirmLockBtn} onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>Lock Vault</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>🔐</div>
          <div className={styles.titleGroup}>
            <h1>Password Vault</h1>
            <p>{MOCK_CREDENTIALS.length} entries</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addBtn}><Plus size={14} /> Add</button>
          <button className={styles.headerBtn} onClick={() => setShowGenerator(true)}><Key size={14} /> Generate Password</button>
          <button className={styles.lockBtn} onClick={() => setShowLockConfirm(true)}><Lock size={14} /> Lock</button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Search and Filters */}
        <div className={styles.searchFilterRow}>
          <input
            className={styles.searchBox}
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.filters}>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={`${styles.filterBtn} ${
                  activeFilter === filter ? styles.active : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Credential Cards */}
        {MOCK_CREDENTIALS.map((cred) => (
          <div key={cred.id} className={styles.credentialCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.cardTitle}>{cred.title}</span>
                <span className={styles.categoryBadge}>{cred.category}</span>
              </div>
              <div className={styles.cardActions}>
                <button className={styles.iconBtn}><Pencil size={14} /></button>
                <button className={styles.iconBtn}><Trash2 size={14} /></button>
              </div>
            </div>

            <div className={styles.cardField}>
              <div className={styles.cardFieldLeft}>
                <span className={styles.fieldLabel}>Username</span>
                <span className={styles.fieldValue}>{cred.username}</span>
              </div>
              <div className={styles.fieldActions}>
                <button className={styles.iconBtn}><Copy size={14} /></button>
              </div>
            </div>

            <div className={styles.cardField}>
              <div className={styles.cardFieldLeft}>
                <span className={styles.fieldLabel}>Password</span>
                <span className={styles.fieldValue}>{cred.password}</span>
              </div>
              <div className={styles.fieldActions}>
                <button className={styles.iconBtn}><Eye size={14} /></button>
                <button className={styles.iconBtn}><Copy size={14} /></button>
              </div>
            </div>

            {cred.website && (
              <div className={styles.cardField}>
                <div className={styles.cardFieldLeft}>
                  <span className={styles.fieldLabel}>Website</span>
                  <a
                    className={styles.fieldValue}
                    href={cred.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cred.website} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
