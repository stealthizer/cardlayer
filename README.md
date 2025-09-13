# Cardlayer - A4 Image Positioning Tool

A **pure client-side** web application for positioning images on A4 paper and generating PDF files for printing. **No server required** - everything runs in the browser!

## Features

- **Drag & Drop Interface**: Import images by dragging and dropping them into the application
- **A4 Layout Preview**: See exactly how your images will appear on A4 paper
- **Image Positioning**: Click and drag to reposition images on the A4 layout
- **Image Resizing**: Resize images using the resize handle
- **PDF Generation**: Export your layout as a PDF file for printing
- **Responsive Design**: Works on different screen sizes with proportional scaling
- **No Build Process**: Just open the HTML file in any modern browser

## Interface Layout

The application consists of three main sections:

1. **Tool Layout (20% left)**: Contains controls, image count, file importer, and PDF generation button
2. **Import Layout (30% center)**: Shows imported images in a gallery format
3. **A4 View Layout (50% right)**: Interactive A4 paper preview where you position images

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

1. **Import Images**: Click "📁 Import Images" or drag & drop image files
2. **Position Images**: Drag images from the center panel to the A4 layout
3. **Adjust Images**: Click and drag to reposition, use resize handles to adjust size
4. **Remove Images**: Click the × button on any image to remove it
5. **Generate PDF**: Click "📄 Generate PDF" when you're ready to export

## Technical Details

- **Pure HTML/CSS/JavaScript** - no frameworks or build tools
- **CDN Dependencies**: Tailwind CSS and jsPDF loaded from CDN
- **Client-side only** - no server backend required
- **A4 Dimensions**: 210mm × 297mm (standard A4 size)
- **PDF Generation**: Uses jsPDF library for client-side PDF creation

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
Cardlayer/
├── index.html          # Single HTML file containing everything
├── README.md          # This file
└── .gitignore         # Git ignore file
```

## No Installation Required!

This is a **zero-dependency** solution. Just open `index.html` in your browser and start using it immediately. Perfect for:
- Quick prototyping
- Offline use
- Sharing via email or USB drive
- Embedding in other projects

## License

MIT License