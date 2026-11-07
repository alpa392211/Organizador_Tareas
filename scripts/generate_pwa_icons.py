#!/usr/bin/env python3
"""
generate_pwa_icons.py - Production PWA Icon Generator for Organizador_Tareas v1.3.4
Extracts official logo, squares with background extension, generates maskable icons
with safe-zone feathering, and exports all required PWA/favicon sizes.
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFilter

def generate_icons(src_path, output_dir, project_root):
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load source and extract dimensions
    src = Image.open(src_path).convert('RGB')
    w, h = src.size
    print(f"Source loaded: {w}x{h} ({src_path})")

    # Sample background color near edges: #0c0143 cosmic purple
    bg_color = (12, 1, 67)

    # 2. Base 1024x1024 squared image (pad 20px horizontally on left and right)
    base_1024 = Image.new('RGB', (1024, 1024), bg_color)
    paste_x = (1024 - w) // 2
    base_1024.paste(src, (paste_x, 0))

    # 3. Standard icons (purpose: any)
    for sz in [512, 192]:
        icon = base_1024.resize((sz, sz), Image.Resampling.LANCZOS)
        out_file = os.path.join(output_dir, f'icon-{sz}x{sz}.png')
        icon.save(out_file, 'PNG', optimize=True)
        print(f"Generated: {out_file} ({sz}x{sz})")

    # 4. Maskable icons (purpose: maskable, safe zone 80% circle, feathered boundary)
    for sz in [512, 192]:
        maskable = Image.new('RGB', (sz, sz), bg_color)
        content_sz = int(sz * 0.76) # 76% scale to guarantee safe zone
        content = base_1024.resize((content_sz, content_sz), Image.Resampling.LANCZOS)
        
        # Soft Gaussian edge feathering for seamless background integration
        mask_base = Image.new('L', (content_sz, content_sz), 0)
        draw = ImageDraw.Draw(mask_base)
        margin = max(4, int(content_sz * 0.04))
        draw.rectangle([margin, margin, content_sz - margin, content_sz - margin], fill=255)
        feathered_mask = mask_base.filter(ImageFilter.GaussianBlur(radius=max(2, int(margin * 0.5))))
        
        offset = (sz - content_sz) // 2
        maskable.paste(content, (offset, offset), feathered_mask)
        out_file = os.path.join(output_dir, f'icon-maskable-{sz}x{sz}.png')
        maskable.save(out_file, 'PNG', optimize=True)
        print(f"Generated: {out_file} ({sz}x{sz} maskable)")

    # 5. Apple Touch Icon (180x180)
    apple_icon = base_1024.resize((180, 180), Image.Resampling.LANCZOS)
    apple_file = os.path.join(output_dir, 'apple-touch-icon.png')
    apple_icon.save(apple_file, 'PNG', optimize=True)
    print(f"Generated: {apple_file} (180x180)")

    # 6. Favicons (32x32, 16x16)
    fav32 = base_1024.resize((32, 32), Image.Resampling.LANCZOS)
    fav32_file = os.path.join(output_dir, 'favicon-32x32.png')
    fav32.save(fav32_file, 'PNG', optimize=True)
    print(f"Generated: {fav32_file} (32x32)")

    fav16 = base_1024.resize((16, 16), Image.Resampling.LANCZOS)
    fav16_file = os.path.join(output_dir, 'favicon-16x16.png')
    fav16.save(fav16_file, 'PNG', optimize=True)
    print(f"Generated: {fav16_file} (16x16)")

    # 7. Favicon ICO (Multi-resolution: 16x16, 32x32, 48x48)
    fav48 = base_1024.resize((48, 48), Image.Resampling.LANCZOS)
    ico_dest = os.path.join(output_dir, 'favicon.ico')
    # Use fav48 or base_1024 as primary, save multi-size ICO
    fav48.save(ico_dest, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    
    # Also save favicon.ico to project root for standard browser auto-requests
    root_ico = os.path.join(project_root, 'favicon.ico')
    fav48.save(root_ico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated: {ico_dest} and {root_ico}")

if __name__ == '__main__':
    default_src = '/home/antigravity/file_00000000743481f592398fed1c05ff91.png'
    project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    default_dest = os.path.join(project_dir, 'assets', 'icons')
    
    src = sys.argv[1] if len(sys.argv) > 1 else default_src
    dest = sys.argv[2] if len(sys.argv) > 2 else default_dest
    root = sys.argv[3] if len(sys.argv) > 3 else project_dir
    
    generate_icons(src, dest, root)
