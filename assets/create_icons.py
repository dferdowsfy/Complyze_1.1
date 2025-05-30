from PIL import Image, ImageDraw
import os

def create_tray_icon(filename, color, size=16):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple circle
    margin = 2
    draw.ellipse([margin, margin, size-margin, size-margin], fill=color)
    
    # Save the image
    img.save(filename, 'PNG')

# Create tray icons
create_tray_icon('assets/tray-icon-mac.png', '#FF6F3C')  # Orange for inactive
create_tray_icon('assets/tray-icon-active-mac.png', '#4ade80')  # Green for active
create_tray_icon('assets/tray-icon.png', '#FF6F3C')  # Orange for inactive
create_tray_icon('assets/tray-icon-active.png', '#4ade80')  # Green for active

print("Tray icons created successfully!") 