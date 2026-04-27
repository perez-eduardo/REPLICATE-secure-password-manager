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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mfa" element={<MFAPrompt />} />
        <Route path="/mfa-setup" element={<MFASetup />} />
        <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
