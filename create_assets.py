#!/usr/bin/env python3
"""
Script to create favicon.ico and og-image.png from existing favicon.png
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_favicon_ico():
    """Create favicon.ico from existing favicon.png"""
    try:
        # Load the existing favicon.png
        favicon_png = Image.open('static/favicon.png')
        
        # Create multiple sizes for ICO format
        sizes = [(16, 16), (32, 32), (48, 48)]
        ico_images = []
        
        for size in sizes:
            resized = favicon_png.resize(size, Image.Resampling.LANCZOS)
            ico_images.append(resized)
        
        # Save as ICO file
        ico_images[0].save('static/favicon.ico', format='ICO', sizes=[(img.width, img.height) for img in ico_images])
        print("✅ Created favicon.ico")
        
    except Exception as e:
        print(f"❌ Error creating favicon.ico: {e}")

def create_og_image():
    """Create Open Graph image (1200x630)"""
    try:
        # Create a 1200x630 image with a dark background
        og_image = Image.new('RGB', (1200, 630), color='#1a1a1a')
        draw = ImageDraw.Draw(og_image)
        
        # Load and resize the favicon for the OG image
        favicon = Image.open('static/favicon.png')
        favicon_resized = favicon.resize((120, 120), Image.Resampling.LANCZOS)
        
        # Paste the favicon in the top-left area
        og_image.paste(favicon_resized, (60, 60), favicon_resized if favicon.mode == 'RGBA' else None)
        
        # Add text
        try:
            # Try to use a system font
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
        except:
            # Fallback to default font
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        # Add title
        title_text = "Prompt Templates"
        title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (1200 - title_width) // 2
        draw.text((title_x, 200), title_text, fill='#ffffff', font=title_font)
        
        # Add subtitle
        subtitle_text = "Create and organize your AI prompts"
        subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        subtitle_x = (1200 - subtitle_width) // 2
        draw.text((subtitle_x, 300), subtitle_text, fill='#cccccc', font=subtitle_font)
        
        # Add URL
        url_text = "prompts.dft4.me"
        url_bbox = draw.textbbox((0, 0), url_text, font=subtitle_font)
        url_width = url_bbox[2] - url_bbox[0]
        url_x = (1200 - url_width) // 2
        draw.text((url_x, 400), url_text, fill='#2D8A6D', font=subtitle_font)
        
        # Save the OG image
        og_image.save('static/og-image.png', 'PNG')
        print("✅ Created og-image.png")
        
    except Exception as e:
        print(f"❌ Error creating og-image.png: {e}")

if __name__ == "__main__":
    print("Creating favicon.ico and og-image.png...")
    create_favicon_ico()
    create_og_image()
    print("Done!")
