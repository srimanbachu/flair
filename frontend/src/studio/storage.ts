export type SavedProject = {
  id: string;
  name: string;
  kind: "card" | "canvas";
  updated: string;
  data: unknown;
};
const KEY = "flair.projects.v1";
export function readProjects(): SavedProject[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (p) =>
            p &&
            typeof p.id === "string" &&
            typeof p.name === "string" &&
            ["card", "canvas"].includes(p.kind),
        )
      : [];
  } catch {
    return [];
  }
}
export function saveProject(project: SavedProject) {
  const list = readProjects();
  localStorage.setItem(
    KEY,
    JSON.stringify([project, ...list.filter((p) => p.id !== project.id)]),
  );
}
export function removeProject(id: string) {
  localStorage.setItem(
    KEY,
    JSON.stringify(readProjects().filter((p) => p.id !== id)),
  );
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    )
      return reject(new Error("Choose a PNG, JPEG, WebP, or GIF image."));
    if (file.size > 5 * 1024 * 1024)
      return reject(new Error("Choose an image smaller than 5 MB."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
