// ===============================
// Gold HyperFlow Dashboard Config
// ===============================

const CONFIG = {
  // ✅ Your deployed Google Apps Script Web App URL
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzg3g1vCoPqOswbuzXeeQi6gO3zoA2GwQp850SD8gaf-nGYpT_X1azjZUOB2LkaTmUq/exec",

  // 🔁 Update frequency for live dashboard (in milliseconds)
  UPDATE_INTERVAL_MS: 5000,

  // 🌟 Optional: dashboard customization
  DASHBOARD_TITLE: "Gold HyperFlow EA Dashboard",
  THEME: {
    primaryColor: "#FFD700",    // gold
    accentColor: "#00C853",     // green (profit)
    dangerColor: "#D50000",     // red (loss)
    backgroundColor: "#0F172A", // dark background
    textColor: "#FFFFFF"        // white text
  }
};
