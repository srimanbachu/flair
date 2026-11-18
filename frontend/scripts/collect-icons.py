#!/usr/bin/env python3
"""Import pinned, openly licensed icon data. Requires Python 3 and curl.

Run --check to validate the checked-in catalog without making network requests.
SVG bodies are restricted to static vector shapes and local paint references.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "scripts/icon-sources.json").read_text())
MANIFEST = ROOT / "src/devtools/data/manifest.json"
ASSETS = ROOT / "public/icons"
TAGS = set("path g circle rect ellipse line polyline polygon defs use linearGradient radialGradient stop clipPath mask symbol filter feFlood feBlend feGaussianBlur feColorMatrix feOffset feComposite".split())
ATTRS = set("fill d fill-rule clip-rule id x1 x2 y1 y2 gradientTransform gradientUnits stop-color offset transform stop-opacity href clip-path cx cy r filter mask width height x y color-interpolation-filters filterUnits flood-opacity result in in2 stdDeviation maskUnits stroke-width opacity fill-opacity values rx fx fy ry stroke dy color stroke-linejoin stroke-linecap clipPathUnits stroke-miterlimit stroke-dasharray operator spreadMethod mode mask-type".split())


def download(url):
    return subprocess.check_output([
        "curl", "--fail", "--silent", "--show-error", "--location",
        "--retry", "2", "--max-time", "90", url,
    ]).decode("utf-8")


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def clean_body(body):
    root = ET.fromstring("<svg>" + body + "</svg>")
    for element in root.iter():
        if element is root:
            continue
        if element.tag not in TAGS or element.text and element.text.strip() or element.tail and element.tail.strip():
            raise ValueError(f"Unexpected SVG content: {element.tag}")
        element.attrib.pop("class", None)
        style = element.attrib.pop("style", None)
        if style:
            if style != "mask-type:alpha":
                raise ValueError(f"Unexpected SVG style: {style}")
            element.set("mask-type", "alpha")
        for attr, value in element.attrib.items():
            if attr not in ATTRS:
                raise ValueError(f"Unexpected SVG attribute: {attr}")
            if attr == "href" and not re.fullmatch(r"#[\w.:-]+", value):
                raise ValueError("Only local SVG references are allowed")
            without_local_refs = re.sub(r"url\(#[\w.:-]+\)", "", value)
            if re.search(r"url\s*\(|javascript:|data:|https?:|[<>]", without_local_refs, re.I):
                raise ValueError(f"External or executable SVG attribute: {attr}")
    return "".join(ET.tostring(child, encoding="unicode") for child in root)


def acquire(config):
    prefix = config["prefix"]
    url = f"https://raw.githubusercontent.com/iconify/icon-sets/{CONFIG['revision']}/json/{prefix}.json"
    source = download(url)
    data = json.loads(source)
    license_info = data["info"]["license"]
    if license_info["spdx"] not in {"MIT", "ISC"}:
        raise ValueError(f"Review the license before adding {prefix}")
    license_url = config.get("licenseSource") or license_info["url"].replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/")
    license_text = download(license_url).strip()
    if "copyright" not in license_text.lower() or "permission" not in license_text.lower():
        raise ValueError(f"Incomplete license for {prefix}")
    return config, data, source, license_text, url, license_url


def collect():
    seen = set()
    manifest = {"revision": CONFIG["revision"], "collections": []}
    notices = ["THIRD-PARTY ICON NOTICES", "", "The bundled icon artwork belongs to the following open-source projects.",
               "Source data: " + CONFIG["repository"] + "/tree/" + CONFIG["revision"], "",
               "Aliases, hidden entries and exact duplicate geometry are excluded from the count.",
               "Outline, filled, wordmark and size variants are distinct artwork."]
    provenance = []
    outputs = {}
    with ThreadPoolExecutor(max_workers=7) as pool:
        for config, data, source, license_text, url, license_url in pool.map(acquire, CONFIG["collections"]):
            prefix = config["prefix"]
            icons = {}
            duplicate_count = 0
            for key, icon in sorted(data["icons"].items()):
                if icon.get("hidden"):
                    continue
                body = clean_body(icon["body"])
                width = icon.get("width", data.get("width", 16))
                height = icon.get("height", data.get("height", 16))
                if not (0 < width <= 4096 and 0 < height <= 4096):
                    raise ValueError(f"Invalid dimensions for {prefix}:{key}")
                fingerprint = digest(encode([width, height, body]))
                if fingerprint in seen:
                    duplicate_count += 1
                    continue
                seen.add(fingerprint)
                icons[key] = {"body": body, "width": width, "height": height,
                              "stroke": bool(re.search(r'stroke="(?!none)[^"]+"', body))}
            payload = encode({"icons": icons, "license": license_text, "licenseId": data["info"]["license"]["spdx"]}) + "\n"
            checksum = digest(payload)
            path = f"collections/{prefix}-{checksum[:12]}.json"
            outputs[path] = payload
            manifest["collections"].append({"prefix": prefix, "label": config["label"], "count": len(icons),
                                              "file": path, "sha256": checksum, "names": list(icons)})
            provenance.append({"prefix": prefix, "name": data["info"]["name"], "website": config["website"],
                               "author": data["info"]["author"], "source": url, "sourceSha256": digest(source),
                               "version": data["info"].get("version"), "license": data["info"]["license"],
                               "licenseSource": license_url, "licenseSha256": digest(license_text),
                               "count": len(icons), "duplicatesExcluded": duplicate_count, "file": path})
            notices += ["", "=" * 72, data["info"]["name"], config["website"], "Data: " + url, "", license_text]
            print(f"{prefix}: {len(icons):,} icons ({duplicate_count} exact duplicates excluded)")
    manifest["total"] = sum(collection["count"] for collection in manifest["collections"])
    if manifest["total"] < 10000:
        raise ValueError("The catalog must contain at least 10,000 icons")
    ASSETS.mkdir(parents=True, exist_ok=True)
    for path, payload in outputs.items():
        file = ASSETS / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(payload)
    (ASSETS / "NOTICE.txt").write_text("\n".join(notices) + "\n")
    (ASSETS / "sources.json").write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + "\n")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(encode(manifest) + "\n")
    print(f"Total: {manifest['total']:,} locally bundled icons")


def check():
    manifest = json.loads(MANIFEST.read_text())
    sources = json.loads((ASSETS / "sources.json").read_text())
    seen = set()
    total = 0
    for collection in manifest["collections"]:
        payload = (ASSETS / collection["file"]).read_text()
        assert digest(payload) == collection["sha256"], "Collection checksum mismatch"
        data = json.loads(payload)
        assert list(data["icons"]) == collection["names"], "Incomplete search index"
        assert len(data["icons"]) == collection["count"]
        for icon in data["icons"].values():
            body = clean_body(icon["body"])
            fingerprint = digest(encode([icon["width"], icon["height"], body]))
            assert fingerprint not in seen, "Duplicate icon geometry"
            seen.add(fingerprint)
        source = next(item for item in sources if item["prefix"] == collection["prefix"])
        assert digest(data["license"]) == source["licenseSha256"], "License checksum mismatch"
        assert data["license"] in (ASSETS / "NOTICE.txt").read_text(), "Missing license notice"
        total += len(data["icons"])
    assert total == manifest["total"] and total >= 10000
    assert len(manifest["collections"]) >= 2
    print(f"Validated {total:,} unique icons in {len(manifest['collections'])} collections; SVGs, licenses and checksums pass.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate local files without network access")
    args = parser.parse_args()
    check() if args.check else collect()
