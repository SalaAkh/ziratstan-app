import urllib.request
import os

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    import sys
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Set up dimensions
WIDTH = 1200
HEIGHT = 630
BG_COLOR = (15, 15, 18)       # #0f0f12
ACCENT_COLOR = (212, 175, 55) # #d4af37 (Gold)
TEXT_COLOR = (244, 244, 245)  # #f4f4f5
MUTED_COLOR = (140, 140, 145) # lighter muted
ROOT_DIR = os.path.dirname(os.path.abspath(os.path.join(__file__, "..")))

def main():
    img = Image.new('RGB', (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Draw gradient-like abstract circles (simulated by drawing ellipses and applying a blur if we want, or just drawing overlay)
    draw.ellipse((-300, -300, 600, 600), fill=(22, 22, 25))
    draw.ellipse((800, 200, 1800, 1200), fill=(20, 20, 23))
    
    # Border
    draw.rectangle([20, 20, WIDTH-20, HEIGHT-20], outline=(30, 30, 35), width=2)

    # Load font or download Roboto
    font_bold_path = os.path.join(ROOT_DIR, "Roboto-Bold.ttf")
    font_reg_path = os.path.join(ROOT_DIR, "Roboto-Regular.ttf")
    
    def download_font(url, path):
        if not os.path.exists(path):
            try:
                urllib.request.urlretrieve(url, path)
            except Exception as e:
                print(f"Could not download font {path}:", e)

    download_font("https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf", font_bold_path)
    download_font("https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf", font_reg_path)

    try:
        font_logo = ImageFont.truetype(font_bold_path, 100)
        font_title = ImageFont.truetype(font_bold_path, 60)
        font_desc = ImageFont.truetype(font_reg_path, 36)
        font_url = ImageFont.truetype(font_bold_path, 32)
    except Exception as e:
        print("Font load error:", e)
        font_logo = font_title = font_desc = font_url = ImageFont.load_default()

    # Draw Text
    draw.text((80, 120), "Зиратстан", font=font_logo, fill=ACCENT_COLOR)
    
    subtitle = "Қазақстанның Цифрлық Жады"
    draw.text((80, 260), subtitle, font=font_title, fill=TEXT_COLOR)
    
    desc = "Құлпытастағы QR-кодты сканерлеп,\nадамның толық өмірбаянын ашыңыз."
    draw.text((80, 380), desc, font=font_desc, fill=MUTED_COLOR)
    
    # Draw URL at the bottom
    draw.text((80, 530), "ziratstan.kz", font=font_url, fill=ACCENT_COLOR)

    # Save format
    out_path = os.path.join(ROOT_DIR, "og-image.jpg")
    img.save(out_path, quality=95)
    print(f"OG Image generated at {out_path}")

    out_path_public = os.path.join(ROOT_DIR, "public", "og-image.jpg")
    try:
        img.save(out_path_public, quality=95)
        print(f"OG Image generated at {out_path_public}")
    except:
        pass

if __name__ == "__main__":
    main()
