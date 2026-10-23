#!/usr/bin/env python3
"""Build responsive context photos from the separately archived source masters.

Example: python3 scripts/build-scene-photos.py --masters /path/to/masters
No input is enlarged. SwinIR is an explicit upstream master, never an implicit
resize mode. Publication evidence and the original scene files remain intact.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'media/scenes/refined'
SOURCES = ROOT / 'scripts/scene-photo-sources.json'
DESKTOP_WIDTHS = (480, 800, 1200, 1600, 2400)
SIZES = '(min-width: 1700px) 76vw, 79vw'


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def variants(image: Image.Image, station: str, mode: str) -> list[dict]:
    widths = sorted({min(width, image.width) for width in DESKTOP_WIDTHS})
    rows = []
    for width in widths:
        height = round(image.height * width / image.width)
        derived = image.resize((width, height), Image.Resampling.LANCZOS)
        for extension in ('webp', 'avif'):
            filename = f'{station}-{mode}-{width}.{extension}'
            path = PUBLIC / filename
            if extension == 'webp':
                derived.save(path, format='WEBP', quality=86, method=5)
            else:
                derived.save(path, format='AVIF', quality=62, speed=6)
            with Image.open(path) as checked:
                assert checked.size == (width, height), filename
            rows.append({
                'src': './media/scenes/refined/' + filename,
                'width': width, 'height': height, 'format': extension,
                'mode': mode, 'bytes': path.stat().st_size,
                'sha256': digest(path)
            })
    return rows


def process(source: dict, masters: Path) -> tuple[str, dict, dict]:
    path = masters / source['input']
    if digest(path) != source['sha256']:
        raise ValueError(f"Source hash mismatch: {source['id']}")
    with Image.open(path) as opened:
        image = ImageOps.exif_transpose(opened).convert('RGB')
    if image.size != (source['width'], source['height']):
        raise ValueError(f"Source dimensions changed: {source['id']}")
    desktop = variants(image, source['id'], 'desktop')
    fallback_rows = [row for row in desktop if row['format'] == 'webp']
    fallback = min(fallback_rows, key=lambda row: abs(row['width'] - 1200))

    def srcset(rows: list[dict], format_name: str) -> str:
        return ', '.join(f"{row['src']} {row['width']}w" for row in rows
                         if row['format'] == format_name)

    photo = {
        'src': fallback['src'], 'srcset': srcset(desktop, 'webp'),
        'avifSrcset': srcset(desktop, 'avif'),
        'sizes': SIZES, 'width': fallback['width'], 'height': fallback['height'],
        'sourceWidth': image.width, 'sourceHeight': image.height,
        'position': source['position'], 'processing': source['processing'],
        'provenance': './media/scenes/refined/photo-manifest.json#' + source['id']
    }
    if source.get('displayWidth'):
        photo['displayWidth'] = source['displayWidth']
    provenance = {**source, 'derivatives': desktop}
    return source['id'], photo, provenance


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--masters', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    source_document = json.loads(SOURCES.read_text())
    scene_file = ROOT / 'scene-data.js'
    scenes = json.loads(scene_file.read_text().split('=', 1)[1].strip().rstrip(';'))
    PUBLIC.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda source: process(source, args.masters),
                                source_document['sources']))
    source_by_id = {row['id']: row for row in source_document['sources']}
    provenance_rows = []
    for key, photo, provenance in results:
        scene = scenes['stations'][key]
        source = source_by_id[key]
        scene['originalImage'] = scene.get('originalImage', scene['image'])
        scene['image'] = photo['src']
        scene['sourceUrl'] = source['sourcePage']
        scene['credit'] = source['credit']
        scene['position'] = source['position']
        scene['photo'] = photo
        if source.get('licenseUrl'):
            scene['licenseUrl'] = source['licenseUrl']
        provenance_rows.append(provenance)
    scene_file.write_text('window.OLAF_SCENES = ' +
                          json.dumps(scenes, ensure_ascii=False, indent=2) + ';\n')
    manifest = {'schemaVersion': 1,
                'scope': 'Desktop only',
                'generatedAt': datetime.now(timezone.utc).isoformat(),
                'use': 'Context photography only. No publication evidence changed.',
                'policy': source_document['policy'],
                'encoders': {'webp': {'quality': 86, 'method': 5},
                             'avif': {'quality': 62, 'speed': 6}},
                'photos': provenance_rows}
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    (PUBLIC / 'photo-manifest.json').write_text(manifest_text)
    (args.masters / 'web-photo-manifest.json').write_text(manifest_text)
    print(f"Built {len(results)} scenes; "
          f"{sum(len(row['derivatives']) for row in provenance_rows)} derivatives; "
          f"{sum(p.stat().st_size for p in PUBLIC.iterdir()) / 1048576:.2f} MiB")


if __name__ == '__main__':
    main()
