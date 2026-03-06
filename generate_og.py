import urllib.request
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import sys
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont

# Set up dimensions
WIDTH = 1200
HEIGHT = 630
BG_COLOR = (9, 9, 11)        # #09090b
ACCENT_COLOR = (212, 175, 55) # #d4af37 (Gold)
TEXT_COLOR = (244, 244, 245)  # #f4f4f5
MUTED_COLOR = (113, 113, 122) # #71717a

def main():
    img = Image.new('RGB', (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Draw gradient-like abstract circles
    draw.ellipse((800, -300, 1600, 500), fill=(18, 18, 20))
    draw.ellipse((-200, 200, 300, 700), fill=(15, 15, 18))
    
    # Border
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], outline=(30, 30, 35), width=2)

    # Load font or download Inter
    font_path = "Inter-Bold.ttf"
    if not os.path.exists(font_path):
        url = "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bslnt%2Cwght%5D.ttf"
        try:
            urllib.request.urlretrieve(url, font_path)
        except Exception as e:
            print("Could not download font:", e)

    try:
        font_logo = ImageFont.truetype(font_path, 90)
        font_title = ImageFont.truetype(font_path, 50)
        font_desc = ImageFont.truetype(font_path, 32)
        font_url = ImageFont.truetype(font_path, 28)
    except:
        font_logo = font_title = font_desc = font_url = ImageFont.load_default()

    # Draw Text
    draw.text((80, 140), "Зиратстан", font=font_logo, fill=ACCENT_COLOR)
    
    subtitle = "Қазақстанның Цифрлық Жады"
    draw.text((80, 260), subtitle, font=font_title, fill=TEXT_COLOR)
    
    desc = "Құлпытастағы QR-кодты сканерлеп,\nадамның толық өмірбаянын ашыңыз."
    draw.text((80, 380), desc, font=font_desc, fill=MUTED_COLOR)
    
    draw.text((80, 520), "ziratstan.kz", font=font_url, fill=ACCENT_COLOR)

    # Save format
    out_path = "d:/User/Desktop/Programms/Ziratstan.kz/og-image.jpg"
    img.save(out_path)
    print(f"OG Image generated at {out_path}")

    out_path_public = "d:/User/Desktop/Programms/Ziratstan.kz/public/og-image.jpg"
    try:
        img.save(out_path_public)
        print(f"OG Image generated at {out_path_public}")
    except:
        pass

if __name__ == "__main__":
    main()
