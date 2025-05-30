from PIL import Image, ImageDraw
import os

def create_shield_icon(size, filename):
    """Create the Complyze shield icon at the specified size"""
    
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate proportions based on size
    padding = max(2, size // 20)
    shield_width = size - (padding * 2)
    shield_height = int(shield_width * 0.85)  # Shield aspect ratio
    
    # Shield coordinates (centered)
    x_offset = padding
    y_offset = padding + (size - shield_height - padding * 2) // 2
    
    # Colors matching the provided icon
    background_color = '#FF6F3C'  # Orange background
    shield_color = '#1E3A8A'      # Deep blue shield
    check_color = '#FF6F3C'       # Orange checkmark
    
    # Draw orange background circle
    draw.ellipse([0, 0, size, size], fill=background_color)
    
    # Draw shield shape (rounded rectangle with pointed bottom)
    shield_points = []
    
    # Top rounded part
    corner_radius = shield_width // 8
    top_width = shield_width
    top_height = shield_height * 0.7
    
    # Shield outline points
    shield_points = [
        (x_offset + corner_radius, y_offset),  # Top left start
        (x_offset + top_width - corner_radius, y_offset),  # Top right start
        (x_offset + top_width, y_offset + corner_radius),  # Top right corner
        (x_offset + top_width, y_offset + top_height),  # Right side
        (x_offset + top_width // 2, y_offset + shield_height),  # Bottom point
        (x_offset, y_offset + top_height),  # Left side
        (x_offset, y_offset + corner_radius),  # Top left corner
    ]
    
    # Draw shield
    draw.polygon(shield_points, fill=shield_color)
    
    # Draw checkmark
    check_size = shield_width * 0.4
    check_x = x_offset + (shield_width - check_size) // 2
    check_y = y_offset + (top_height - check_size) // 2 + shield_height * 0.1
    
    # Checkmark stroke width
    stroke_width = max(2, size // 20)
    
    # Draw checkmark path
    check_points = [
        (check_x + check_size * 0.2, check_y + check_size * 0.5),
        (check_x + check_size * 0.45, check_y + check_size * 0.75),
        (check_x + check_size * 0.8, check_y + check_size * 0.25)
    ]
    
    # Draw thick checkmark lines
    for i in range(len(check_points) - 1):
        x1, y1 = check_points[i]
        x2, y2 = check_points[i + 1]
        
        # Draw multiple lines for thickness
        for offset in range(-stroke_width//2, stroke_width//2 + 1):
            draw.line([(x1 + offset, y1), (x2 + offset, y2)], fill=check_color, width=2)
            draw.line([(x1, y1 + offset), (x2, y2 + offset)], fill=check_color, width=2)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def create_all_app_icons():
    """Create all necessary icon sizes for Electron app"""
    
    # macOS icon sizes (.icns)
    mac_sizes = [16, 32, 64, 128, 256, 512, 1024]
    
    # Windows icon sizes (.ico)
    windows_sizes = [16, 24, 32, 48, 64, 128, 256]
    
    # Linux icon sizes
    linux_sizes = [16, 22, 24, 32, 48, 64, 128, 256, 512]
    
    # Create assets directory if it doesn't exist
    os.makedirs('assets', exist_ok=True)
    
    # Create individual PNG files for all sizes
    all_sizes = sorted(set(mac_sizes + windows_sizes + linux_sizes))
    
    for size in all_sizes:
        create_shield_icon(size, f'assets/icon-{size}.png')
    
    # Create the main icon file
    create_shield_icon(512, 'assets/icon.png')
    
    # Create tray icons (smaller, simpler versions)
    create_shield_icon(16, 'assets/tray-icon.png')
    create_shield_icon(16, 'assets/tray-icon-mac.png')
    create_shield_icon(16, 'assets/tray-icon-active.png')
    create_shield_icon(16, 'assets/tray-icon-active-mac.png')
    
    print("\n✅ All Complyze app icons created successfully!")
    print("📁 Icons available in: assets/")
    print("🖼️  Main icon: assets/icon.png")
    print("🔄 Tray icons: assets/tray-icon*.png")
    print("📐 Individual sizes: assets/icon-{size}.png")

if __name__ == "__main__":
    create_all_app_icons() 