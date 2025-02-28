import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import Home from "./routes/Home";
import LoginPage from "./routes/Login";
import AdminPortal from "./routes/apps/AdminPortal";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Navbar />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPortal />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
