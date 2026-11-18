import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

export function IconNotFound() {
  return (
    <main className="dev-empty dev-not-found">
      <SearchX size={32} aria-hidden="true" />
      <h1>Icon not found</h1>
      <p>This link doesn't match an icon in the library.</p>
      <Link to="/dev-tools" className="dev-back-link">
        Browse all icons
      </Link>
    </main>
  );
}
