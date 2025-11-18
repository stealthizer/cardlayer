# Test Fixtures

This directory contains test images used for testing the Cardlayer application.

## Creating Test Images

You can create simple test images using any image editor or programmatically. Here are some examples using ImageMagick:

### Standard Card (63.5mm × 88mm at 96 DPI)
```bash
# Portrait standard card
convert -size 240x333 xc:white -fill blue -draw "rectangle 0,0 240,333" sample-card.png

# Landscape standard card
convert -size 333x240 xc:white -fill green -draw "rectangle 0,0 333,240" sample-card-landscape.png
```

### Card with Alpha Channel (PNG with transparency)
```bash
# Create card with transparent borders
convert -size 300x400 xc:none -fill white -draw "rectangle 50,50 250,350" sample-card-with-alpha.png
```

### Small Ship (32mm × 38mm at 96 DPI)
```bash
convert -size 121x144 xc:white -fill red -draw "rectangle 0,0 121,144" sample-small-ship.png
```

### Inner Dial (43mm diameter at 96 DPI - circular)
```bash
convert -size 163x163 xc:none -fill yellow -draw "circle 81.5,81.5 81.5,0" sample-inner-dial.png
```

### Front Dial (50mm diameter at 96 DPI - circular)
```bash
convert -size 189x189 xc:none -fill orange -draw "circle 94.5,94.5 94.5,0" sample-front-dial.png
```

## Manual Creation

If you don't have ImageMagick installed, you can:

1. Use any image editor (GIMP, Photoshop, etc.)
2. Create images with the dimensions listed above
3. For alpha channel testing, save as PNG with transparent areas
4. For dial testing, create circular images on transparent backgrounds

## Test Image Requirements

- **Format**: PNG (for alpha channel support)
- **Size**: Match the physical card dimensions at 96 DPI (see conversion table below)
- **Alpha**: Include images with and without alpha channels

## Dimension Conversion Table (96 DPI)

| Card Type | MM Dimensions | Pixel Dimensions |
|-----------|--------------|------------------|
| Standard Card | 63.5 × 88 | 240 × 333 |
| Small Ship | 32 × 38 | 121 × 144 |
| Medium Ship | 54 × 61 | 204 × 231 |
| Large Ship | 73 × 80 | 276 × 302 |
| Huge Ship | 80.5 × 224 | 305 × 847 |
| Inner Dial | 43 × 43 | 163 × 163 |
| Front Dial | 50 × 50 | 189 × 189 |

Formula: `pixels = (mm * 96) / 25.4`

## Notes

- Test images don't need to be beautiful, they just need the correct dimensions
- For alpha channel tests, ensure some pixels have transparency
- For bounding box tests, include transparent borders around content
- You can use solid colors or simple patterns for testing
