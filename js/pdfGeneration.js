// PDF Generation module for Cardlayer

// Generate PDF from positioned images
async function generatePDF(images, a4Dimensions, pixelsToMm) {
    if (images.length === 0) return;

    const { PDFDocument, rgb, degrees } = PDFLib;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add an A4 page in landscape orientation
    const page = pdfDoc.addPage([mmToPoints(A4_WIDTH_MM), mmToPoints(A4_HEIGHT_MM)]);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Helper function to convert mm to PDF points (1 point = 1/72 inch)
    function mmToPoints(mm) {
        return (mm / 25.4) * 72;
    }

    // Helper function to load image from data URL
    async function loadImageFromDataUrl(dataUrl) {
        if (dataUrl.startsWith('data:image/png')) {
            return await pdfDoc.embedPng(dataUrl);
        } else if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
            return await pdfDoc.embedJpg(dataUrl);
        } else {
            // Convert to PNG if unknown format
            return await pdfDoc.embedPng(dataUrl);
        }
    }

    // Process images sequentially to handle async operations
    for (const image of images) {
        try {
            // Calculate position in mm (converting from scaled pixels back to mm)
            const xMm = pixelsToMm(image.x / a4Dimensions.scale);
            const yMm = pixelsToMm(image.y / a4Dimensions.scale);

            // Use the card dimensions directly (already in mm and correctly swapped if rotated)
            const widthMm = image.cardWidthMm;
            const heightMm = image.cardHeightMm;

            // For dials, calculate proper dimensions based on image aspect ratio
            let finalWidthMm = widthMm;
            let finalHeightMm = heightMm;

            if (image.cardType === 'inner-dial' || image.cardType === 'front-dial') {
                // Calculate height based on the image's natural aspect ratio
                const aspectRatio = image.originalWidth / image.originalHeight;
                finalWidthMm = widthMm;
                finalHeightMm = widthMm / aspectRatio;
            }

            const constrainedX = Math.max(0, Math.min(xMm, A4_WIDTH_MM - finalWidthMm));
            const constrainedY = Math.max(0, Math.min(yMm, A4_HEIGHT_MM - finalHeightMm));
            const constrainedWidth = Math.min(finalWidthMm, A4_WIDTH_MM - constrainedX);
            const constrainedHeight = Math.min(finalHeightMm, A4_HEIGHT_MM - constrainedY);

            // Convert to PDF points
            const xPoints = mmToPoints(constrainedX);
            const yPoints = mmToPoints(constrainedY);
            const widthPoints = mmToPoints(constrainedWidth);
            const heightPoints = mmToPoints(constrainedHeight);

            let imageToEmbed;

            // Use pre-rotated source if available, otherwise use original
            const imageSrc = image.isRotated && image.rotatedSrc ? image.rotatedSrc : image.src;
            imageToEmbed = await loadImageFromDataUrl(imageSrc);

            // PDF coordinates are from bottom-left, so we need to flip Y
            const pdfY = pageHeight - yPoints - heightPoints;

            // Draw the image on the page
            page.drawImage(imageToEmbed, {
                x: xPoints,
                y: pdfY,
                width: widthPoints,
                height: heightPoints,
            });

            // Add ship name text for front dials using WYSIWYG approach
            if (image.cardType === 'front-dial' && image.shipName && image.shipName.trim()) {
                await addShipNameText(
                    image,
                    page,
                    pageHeight,
                    constrainedX,
                    constrainedY,
                    constrainedWidth,
                    mmToPoints,
                    pdfDoc
                );
            }
        } catch (error) {
            console.error(`Failed to add image ${image.name} to PDF:`, error);
        }
    }

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // Create a blob and download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cardlayer-export.pdf';
    link.click();
    URL.revokeObjectURL(url);
}

// Add ship name text to front dial
async function addShipNameText(
    image,
    page,
    pageHeight,
    constrainedX,
    constrainedY,
    constrainedWidth,
    mmToPoints,
    pdfDoc
) {
    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set font properties
    const pdfFontSize = SHIP_NAME_FONT_SIZE_PDF;
    const lineHeight = pdfFontSize * SHIP_NAME_LINE_HEIGHT_MULTIPLIER;

    // Set font for measurement
    ctx.font = `bold ${pdfFontSize}px ${SHIP_NAME_FONT_FAMILY}`;

    // Max width for PDF
    const maxLineWidth = SHIP_NAME_MAX_WIDTH_PDF;

    // Split text by explicit newlines first (preserve case for Bank Gothic small caps)
    const explicitLines = image.shipName.trim().split(/\r?\n/);

    // Then wrap each line if it exceeds max width
    const lines = [];
    explicitLines.forEach(line => {
        const words = line.trim().split(' ');
        let currentLine = '';

        words.forEach((word, index) => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxLineWidth && currentLine) {
                // Line is too long, push current line and start new one
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        // Push the last line
        if (currentLine) {
            lines.push(currentLine);
        }
    });

    console.log('PDF Generation - Ship name:', JSON.stringify(image.shipName), 'Wrapped lines:', lines, 'Line count:', lines.length);

    // Measure actual dimensions of wrapped lines
    let maxWidth = 0;
    lines.forEach(line => {
        if (line.trim()) {
            const metrics = ctx.measureText(line.trim());
            maxWidth = Math.max(maxWidth, metrics.width);
        }
    });

    const textHeight = lines.length * lineHeight;

    // Set canvas size with higher resolution for crisp text
    const scale = TEXT_CANVAS_SCALE;
    canvas.width = Math.ceil((maxWidth + 10) * scale);
    canvas.height = Math.ceil(textHeight * scale);

    // Scale the context for crisp rendering
    ctx.scale(scale, scale);

    // Set font properties again after scaling
    ctx.font = `bold ${pdfFontSize}px ${SHIP_NAME_FONT_FAMILY}`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; // Changed from 'alphabetic' to 'top' for more predictable positioning
    ctx.imageSmoothingEnabled = false;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);

    // Draw the text line by line
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            const yPos = index * lineHeight; // Simple calculation based on line index
            ctx.fillText(trimmedLine, (canvas.width / scale) / 2, yPos);
            console.log(`Drawing line ${index}: "${trimmedLine}" at y=${yPos}`);
        }
    });

    // Convert to data URL and embed in PDF
    const textDataUrl = canvas.toDataURL('image/png');
    const textImage = await pdfDoc.embedPng(textDataUrl);

    // Calculate position in PDF (from top, centered)
    const actualWidth = canvas.width / scale;
    const actualHeight = canvas.height / scale;
    const textWidthMm = actualWidth * 0.264583;
    const textHeightMm = actualHeight * 0.264583;
    const textX = constrainedX + (constrainedWidth / 2) - (textWidthMm / 2);
    const textY = constrainedY + SHIP_NAME_TOP_OFFSET_PDF_MM; // Position from top

    const textXPoints = mmToPoints(textX);
    const textYPoints = mmToPoints(textY);
    const textWidthPoints = mmToPoints(textWidthMm);
    const textHeightPoints = mmToPoints(textHeightMm);

    // PDF coordinates are from bottom-left, so flip Y
    const pdfTextY = pageHeight - textYPoints - textHeightPoints;

    page.drawImage(textImage, {
        x: textXPoints,
        y: pdfTextY,
        width: textWidthPoints,
        height: textHeightPoints,
    });
}
