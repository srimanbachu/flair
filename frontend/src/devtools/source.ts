import type { IconData } from "./iconData";

// The importer validates every body against a static SVG allowlist.
export function iconBody(
  artwork: IconData,
  strokeWidth?: number,
  idPrefix = "",
) {
  let body = artwork.body;
  if (artwork.stroke && strokeWidth !== undefined)
    body = body.replace(
      /stroke-width="[^"]*"/g,
      `stroke-width="${strokeWidth}"`,
    );
  if (idPrefix) {
    const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    for (const id of ids) {
      body = body
        .replaceAll(`id="${id}"`, `id="${idPrefix}${id}"`)
        .replaceAll(`href="#${id}"`, `href="#${idPrefix}${id}"`)
        .replaceAll(`url(#${id})`, `url(#${idPrefix}${id})`);
    }
  }
  return body;
}

export function svgSource(
  artwork: IconData,
  size: number,
  strokeWidth: number,
  license?: string,
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${artwork.width} ${artwork.height}">\n  ${iconBody(artwork, strokeWidth).replace(/></g, ">\n  <")}\n</svg>`;
  return license ? `<!--\n${license.replaceAll("--", "—")}\n-->\n${svg}` : svg;
}

function attributeName(name: string) {
  if (
    name.startsWith("aria-") ||
    name.startsWith("data-") ||
    name === "mask-type"
  )
    return name;
  return name.replace(/[-:]([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

export function jsxSource(
  artwork: IconData,
  size: number,
  strokeWidth: number,
  license?: string,
) {
  const document = new DOMParser().parseFromString(
    svgSource(artwork, size, strokeWidth),
    "image/svg+xml",
  );
  function convert(element: Element, depth: number): string {
    const indent = "  ".repeat(depth);
    const attributes = [...element.attributes]
      .map(
        (attribute) =>
          `${attributeName(attribute.name)}={${JSON.stringify(attribute.value)}}`,
      )
      .join(" ");
    const opening = `${indent}<${element.tagName}${attributes ? " " + attributes : ""}`;
    if (!element.children.length) return `${opening} />`;
    return `${opening}>\n${[...element.children].map((child) => convert(child, depth + 1)).join("\n")}\n${indent}</${element.tagName}>`;
  }
  const jsx = convert(document.documentElement, 0);
  return license
    ? jsx.replace(
        ">\n",
        `>\n  {/*\n${license.replaceAll("*/", "* /")}\n  */}\n`,
      )
    : jsx;
}
