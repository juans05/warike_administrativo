/**
 * Copies text synchronously inside the user's click, BEFORE we open Google in a new tab.
 * navigator.clipboard.writeText is async: once the new tab steals focus it can reject
 * (notably on iOS Safari), so the synchronous execCommand path goes first.
 * Returns true when the text is (very likely) on the clipboard.
 */
export function copyText(text: string): boolean {
  if (!text || typeof document === 'undefined') return false;

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  // Off-screen but selectable; font-size 16px avoids iOS zooming on focus.
  area.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;font-size:16px;';
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  document.body.removeChild(area);

  if (!copied && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
    return true;
  }
  return copied;
}
