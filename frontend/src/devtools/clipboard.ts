export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Older browsers and restricted clipboard permissions can use selection.
    }
  }
  const previous = document.activeElement as HTMLElement | null;
  const field = document.createElement("textarea");
  field.value = text;
  field.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(field);
  try {
    field.select();
    if (!document.execCommand("copy")) throw new Error("Copy unavailable");
  } finally {
    field.remove();
    previous?.focus();
  }
}
