#!/usr/bin/env python3
"""
Genera todos los iconos mipmap y adaptativos de Android a partir del logo actual
de Organizador (assets/icons/icon-512x512.png y icon-maskable-512x512.png).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES_DIR = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'
SRC_ICON = ROOT / 'assets' / 'icons' / 'icon-512x512.png'
SRC_MASKABLE = ROOT / 'assets' / 'icons' / 'icon-maskable-512x512.png'

DENSITIES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

ADAPTIVE_DENSITIES = {
    'mdpi': 108,
    'hdpi': 162,
    'xhdpi': 216,
    'xxhdpi': 324,
    'xxxhdpi': 432,
}


def make_round(img: Image.Image) -> Image.Image:
    size = img.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(img.convert('RGBA'), (0, 0), mask)
    return out


def main() -> None:
    if not SRC_ICON.exists():
        raise FileNotFoundError(f'No se encontró {SRC_ICON}')

    base_icon = Image.open(SRC_ICON).convert('RGBA')
    maskable_icon = Image.open(SRC_MASKABLE if SRC_MASKABLE.exists() else SRC_ICON).convert('RGBA')

    for density, px in DENSITIES.items():
        out_dir = RES_DIR / f'mipmap-{density}'
        out_dir.mkdir(parents=True, exist_ok=True)
        resized = base_icon.resize((px, px), Image.Resampling.LANCZOS)
        resized.save(out_dir / 'ic_launcher.png', format='PNG')
        make_round(resized).save(out_dir / 'ic_launcher_round.png', format='PNG')

    for density, px in ADAPTIVE_DENSITIES.items():
        out_dir = RES_DIR / f'mipmap-{density}'
        out_dir.mkdir(parents=True, exist_ok=True)
        canvas = Image.new('RGBA', (px, px), (0, 0, 0, 0))
        inner = int(round(px * 0.72))
        fg = maskable_icon.resize((inner, inner), Image.Resampling.LANCZOS)
        offset = (px - inner) // 2
        canvas.paste(fg, (offset, offset), fg)
        canvas.save(out_dir / 'ic_launcher_foreground.png', format='PNG')

    anydpi_dir = RES_DIR / 'mipmap-anydpi-v26'
    anydpi_dir.mkdir(parents=True, exist_ok=True)
    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background" />\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n'
        '</adaptive-icon>\n'
    )
    (anydpi_dir / 'ic_launcher.xml').write_text(adaptive_xml, encoding='utf-8')
    (anydpi_dir / 'ic_launcher_round.xml').write_text(adaptive_xml, encoding='utf-8')

    values_dir = RES_DIR / 'values'
    values_dir.mkdir(parents=True, exist_ok=True)
    (values_dir / 'ic_launcher_background.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <color name="ic_launcher_background">#140632</color>\n'
        '</resources>\n',
        encoding='utf-8',
    )

    print(f'Iconos Android generados correctamente desde {SRC_ICON.name} en {RES_DIR}')


if __name__ == '__main__':
    main()
