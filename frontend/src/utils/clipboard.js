/**
 * Copies text to the clipboard.
 *
 * Tries the modern Clipboard API first (works in HTTPS, localhost, and file://).
 * Falls back to a hidden-textarea + document.execCommand("copy") for non-secure
 * contexts (plain HTTP), which is currently the case on team prod and REPLICATE
 * until HTTPS lands.
 *
 * @param {string} text - Text to copy to the clipboard.
 * @returns {Promise<boolean>} - true if the copy succeeded, false otherwise.
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback if the modern API throws
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }

  document.body.removeChild(textarea);
  return success;
}
