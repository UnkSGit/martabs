export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "numeric" }).format(timestamp);
}
