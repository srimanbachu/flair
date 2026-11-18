import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { IconEntry } from "./catalog";

export function IconBreadcrumb({ entry }: { entry: IconEntry }) {
  return <nav className="dev-breadcrumb" aria-label="Icon navigation">
    <Link to="/dev-tools"><ArrowLeft size={12} aria-hidden="true" />Icon library</Link>
    <span aria-hidden="true">/</span>
    <span aria-current="page" title={entry.name}>{entry.name}</span>
  </nav>;
}
