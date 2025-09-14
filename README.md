# Cardlayer - A4 Trading Card Layout Tool

A **pure client-side** web application for positioning trading card images on A4 paper and generating PDF files for printing. **No server required** - everything runs in the browser!

## Features

- **Multi-Size Card Support**: Support for Standard Cards, X-Wing ships, and X-Wing dials
- **Drag & Drop Interface**: Import images by dragging and dropping them directly onto the A4 layout
- **A4 Layout Preview**: See exactly how your cards will appear on A4 paper (horizontal/landscape mode)
- **Smart Image Positioning**: Click and drag to reposition images with grid snapping
- **Image Rotation**: Rotate images 90° to change from vertical to horizontal orientation (excludes dials)
- **Card Type Selection**: Change card type of individual images after import with per-image dropdowns
- **Alpha Channel Processing**: Automatic border trimming for PNG images with transparency
- **Grid Snapping System**: Invisible 10px grid for perfect card alignment
- **Smart Collision Detection**: Prevents images from overlapping when positioning
- **PDF Generation**: Export your layout as a PDF file with proper image rotation and aspect ratio preservation
- **Responsive Design**: Works on different screen sizes with proportional scaling
- **No Build Process**: Just open the HTML file in any modern browser

## Interface Layout

The application consists of two main sections (simplified design):

1. **Tool Layout (30% left)**: Contains controls, image count, file importer, global card type selector, and PDF generation button
2. **A4 Layout (70% right)**: Interactive A4 paper preview where you position and rotate images with individual card type controls

## Card Specifications

### Standard Cards
- **Standard Card Size**: 63.5mm × 88mm (vertical orientation)
- **Rotated Card Size**: 88mm × 63.5mm (horizontal orientation)
- **Auto-Detection**: Automatically detects card orientation based on image aspect ratio
- **Proportional Scaling**: Cards are scaled to fit the A4 layout while maintaining proper proportions

### X-Wing Ships
- **Small Ship (X-Wing)**: 32mm × 38mm
- **Medium Ship (X-Wing)**: 54mm × 61mm
- **Large Ship (X-Wing)**: 73mm × 80mm
- **Rectangular Format**: Ships maintain their rectangular proportions

### X-Wing Dials
- **Inner Dial (X-Wing)**: 43mm diameter (round)
- **Front Dial (X-Wing)**: 50mm diameter (round)
- **Circular Format**: Dials maintain their round proportions
- **No Rotation**: Dials cannot be rotated (fixed orientation)
- **Aspect Ratio Preservation**: Front dial maintains natural aspect ratio in PDF output

## How to Run

### Option 1: Direct File Opening
Simply open `index.html` in any modern web browser:
- Double-click the file
- Or right-click → "Open with" → your preferred browser

### Option 2: Local Server (Optional)
If you prefer to serve it locally:
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have it)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Usage

1. **Select Card Type**: Choose the card type from the global dropdown in the tool layout for new imports
2. **Import Images**: Click "🃏 Import Cards" or drag & drop image files directly onto the A4 layout
3. **Position Images**: Click and drag to reposition images on the A4 layout (grid snapping enabled)
4. **Rotate Images**: Click the rotation indicator (↻) or double-click an image to rotate 90° (excludes dials)
5. **Change Card Type**: Hover over any image and use the individual dropdown to change its card type
6. **Remove Images**: Click the × button on any image to remove it
7. **Generate PDF**: Click "📄 Generate PDF" when you're ready to export

## Advanced Features

### Image Rotation
- **Visual Rotation**: Images rotate 90° with proper visual feedback
- **Dimension Handling**: Container dimensions adapt to rotated orientation
- **Control Positioning**: Rotation, card type, and remove controls stay in fixed positions
- **Collision Detection**: Uses correct dimensions for rotated images to prevent overlapping
- **PDF Generation**: Exports rotated images with correct dimensions and proper rotation
- **Dial Exclusion**: X-Wing dials (inner and front) cannot be rotated

### Grid Snapping System
- **Invisible Grid**: 10px grid system for perfect alignment
- **Automatic Snapping**: Images automatically snap to grid positions
- **Easy Alignment**: Cards align at the same level automatically
- **Consistent Positioning**: All cards follow the same grid system

### Smart Collision Detection
- **No Overlapping**: Prevents images from finishing movement on top of each other
- **Rotated Support**: Collision boundaries match rotated image orientation
- **Visual Accuracy**: Collision box matches the visible image area exactly
- **Boundary Checking**: Prevents images from going outside A4 bounds

### Alpha Channel Processing
- **PNG Support**: Automatically processes PNG images with alpha channels
- **Border Trimming**: Removes transparent borders around card images
- **Transparency Preservation**: Maintains transparency in rotated images
- **Pre-processing**: Trims borders before resizing to standard card dimensions

### Card Type Management
- **Multiple Types**: Support for Standard Cards, X-Wing ships, and X-Wing dials
- **Global Selection**: Choose card type for new imports via tool layout dropdown
- **Individual Control**: Change card type of any image after import via per-image dropdown
- **Visual Feedback**: Controls appear on hover for clean interface
- **Real-time Updates**: Images resize and reposition automatically when type changes
- **Type-Specific Behavior**: Dials use `object-fit: contain`, cards use `object-fit: cover`

## Technical Details

- **Pure HTML/CSS/JavaScript** - no frameworks or build tools
- **CDN Dependencies**: Tailwind CSS and jsPDF loaded from CDN
- **Client-side only** - no server backend required
- **A4 Dimensions**: 297mm × 210mm (horizontal/landscape mode)
- **PDF Generation**: Uses jsPDF library with canvas-based image rotation
- **Grid System**: 10px invisible grid for precise positioning
- **Collision Detection**: Real-time collision prevention with effective dimensions
- **Responsive Scaling**: A4 layout scales to fit screen with 100px bottom padding

## Recent Updates

- **Multi-Size Card Support**: Added support for Standard Cards, X-Wing ships, and X-Wing dials
- **Card Type Selection**: Global and individual card type dropdowns for flexible image management
- **Alpha Channel Processing**: Automatic PNG border trimming and transparency preservation
- **Enhanced Rotation**: Complete image rotation system with proper visual feedback (excludes dials)
- **Grid Snapping**: Invisible 10px grid system for perfect card alignment
- **Smart Collision**: Advanced collision detection for both normal and rotated images
- **PDF Rotation**: Proper image content rotation in PDF generation with canvas-based rotation
- **Position Mapping**: Accurate position mapping between A4 layout and PDF
- **Control Positioning**: Fixed control positions regardless of image rotation
- **Bottom Padding**: Added 100px bottom padding for better screen utilization
- **Aspect Ratio Preservation**: Images maintain proper proportions when rotated
- **Dial Support**: Added Inner Dial (43mm) and Front Dial (50mm) with proper aspect ratio handling
- **Type-Specific Rendering**: Different object-fit behavior for dials vs cards
- **Merge Conflict Resolution**: Cleaned up codebase and consolidated all features

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
Cardlayer/
├── index.html                    # Single HTML file containing everything
├── README.md                    # This file
├── .cursor/
│   └── rules/
│       └── project/
│           ├── application.mdc  # Application requirements and rules
│           └── rules.mdc        # Development rules
└── .gitignore                   # Git ignore file
```

## No Installation Required!

This is a **zero-dependency** solution. Just open `index.html` in your browser and start using it immediately. Perfect for:
- Quick prototyping
- Offline use
- Sharing via email or USB drive
- Embedding in other projects

## License

MIT License