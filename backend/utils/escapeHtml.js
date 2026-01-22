// backend/utils/escapeHtml.js
function escapeHtml(str) {
  if (typeof str !== "string") return str;

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = escapeHtml;
