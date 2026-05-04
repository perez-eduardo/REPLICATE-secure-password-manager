import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MFAPrompt from "./pages/MFAPrompt";
import MFASetup from "./pages/MFASetup";
import Vault from "./pages/Vault";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [masterPassword, setMasterPassword] = useState("");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register setMasterPassword={setMasterPassword} />} />
        <Route path="/login" element={<Login setMasterPassword={setMasterPassword} />} />
        <Route path="/mfa" element={<MFAPrompt />} />
        <Route path="/mfa-setup" element={<MFASetup />} />
        <Route path="/vault" element={<ProtectedRoute><Vault masterPassword={masterPassword} setMasterPassword={setMasterPassword} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
