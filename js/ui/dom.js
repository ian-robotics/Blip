/** UI-only DOM helpers. Escape user text before inserting it into HTML. */
export const $ = id => document.getElementById(id);
export const esc = value => String(value).replace(/[&<>"]/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
}[char]));
