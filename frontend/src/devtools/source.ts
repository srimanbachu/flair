export function jsxSource(name: string, size: number, strokeWidth: number) {
  return `import { ${name} } from "lucide-react";\n\n<${name} size={${size}} strokeWidth={${strokeWidth}} />`;
}

export function svgSource(svg: SVGSVGElement) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  ["class", "aria-hidden", "focusable", "role", "aria-label"].forEach((name) => copy.removeAttribute(name));
  return copy.outerHTML.replace(/></g, ">\n  <").replace(/\n  <\/svg>$/, "\n</svg>");
}
