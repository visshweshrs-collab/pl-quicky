// ==========================================
// CENTRALIZED API BASE URL CONFIGURATION
// ==========================================
// On PC: http://localhost:5000
// On mobile / LAN: automatically uses the IP address
// used to access the frontend (e.g. http://192.168.1.5:5000)
// ==========================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : typeof window !== "undefined"
    ? `http://${window.location.hostname}:5000`
    : "http://localhost:5000");

export default API_BASE_URL;
