// Image Processing Module
// Contains reusable image processing functions with no UI dependencies

// Convert mm to pixels
function mmToPixels(mm) {
    return (mm * DPI) / 25.4;
}

// Convert pixels to mm
function pixelsToMm(pixels) {
    return (pixels * 25.4) / DPI;
}

// Detect if image has alpha channel
function hasAlphaChannel(imageData) {
    for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
            return true; // Found non-opaque pixel
        }
    }
    return false;
}

// Find the bounding box of non-transparent pixels (optimized with downsampling)
function findBoundingBox(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Use downsampling for initial detection (check every Nth pixel)
    // Adaptive sampling: smaller for small images, larger for big images
    const sampleRate = Math.max(1, Math.min(8, Math.floor(Math.min(width, height) / 100)));

    let minX = width, minY = height, maxX = -1, maxY = -1;

    // Phase 1: Coarse detection with downsampling
    for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
            const alphaIndex = (y * width + x) * 4 + 3;
            if (data[alphaIndex] > 0) { // Non-transparent pixel
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // If no content found, return empty bounds
    if (maxX === -1) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Phase 2: Refine bounds with precise scanning in the detected regions
    // Expand search area by sample rate to ensure we don't miss edge pixels
    const searchMinX = Math.max(0, minX - sampleRate);
    const searchMaxX = Math.min(width - 1, maxX + sampleRate);
    const searchMinY = Math.max(0, minY - sampleRate);
    const searchMaxY = Math.min(height - 1, maxY + sampleRate);

    // Reset bounds for precise detection
    minX = width;
    minY = height;
    maxX = -1;
    maxY = -1;

    // Scan top edge (find precise minY)
    let foundTop = false;
    for (let y = searchMinY; y <= searchMaxY && !foundTop; y++) {
        for (let x = searchMinX; x <= searchMaxX; x++) {
            const alphaIndex = (y * width + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
                minY = y;
                foundTop = true;
                break;
            }
        }
    }

    // Scan bottom edge (find precise maxY)
    let foundBottom = false;
    for (let y = searchMaxY; y >= searchMinY && !foundBottom; y--) {
        for (let x = searchMinX; x <= searchMaxX; x++) {
            const alphaIndex = (y * width + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
                maxY = y;
                foundBottom = true;
                break;
            }
        }
    }

    // Scan left edge (find precise minX)
    let foundLeft = false;
    for (let x = searchMinX; x <= searchMaxX && !foundLeft; x++) {
        for (let y = minY; y <= maxY; y++) {
            const alphaIndex = (y * width + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
                minX = x;
                foundLeft = true;
                break;
            }
        }
    }

    // Scan right edge (find precise maxX)
    let foundRight = false;
    for (let x = searchMaxX; x >= searchMinX && !foundRight; x--) {
        for (let y = minY; y <= maxY; y++) {
            const alphaIndex = (y * width + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
                maxX = x;
                foundRight = true;
                break;
            }
        }
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };
}

// Trim borders from image with alpha channel
function trimImageBorders(image) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to image size
        canvas.width = image.width;
        canvas.height = image.height;

        // Draw image to canvas
        ctx.drawImage(image, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Check if image has alpha channel
        if (!hasAlphaChannel(imageData)) {
            // No alpha channel, return original image
            resolve(image);
            return;
        }

        // Find bounding box of non-transparent pixels
        const boundingBox = findBoundingBox(imageData);

        // If bounding box is the same as original image, no trimming needed
        if (boundingBox.x === 0 && boundingBox.y === 0 &&
            boundingBox.width === image.width && boundingBox.height === image.height) {
            resolve(image);
            return;
        }

        // Create new canvas with trimmed dimensions
        const trimmedCanvas = document.createElement('canvas');
        const trimmedCtx = trimmedCanvas.getContext('2d');

        trimmedCanvas.width = boundingBox.width;
        trimmedCanvas.height = boundingBox.height;

        // Clear the canvas to ensure transparency
        trimmedCtx.clearRect(0, 0, boundingBox.width, boundingBox.height);

        // Draw trimmed portion with alpha channel preserved
        trimmedCtx.drawImage(
            image,
            boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height,
            0, 0, boundingBox.width, boundingBox.height
        );

        // Convert back to image with PNG format to preserve alpha
        const trimmedImage = new Image();
        trimmedImage.onload = () => resolve(trimmedImage);
        trimmedImage.src = trimmedCanvas.toDataURL('image/png');
    });
}

// Crop image to perfect circle for inner dials
function cropImageToCircle(image, diameterMm) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate diameter in pixels based on the image's current scale
        const diameterPx = (diameterMm / 25.4) * 96; // Convert mm to pixels at 96 DPI

        // Set canvas size to the diameter (square canvas for circle)
        canvas.width = diameterPx;
        canvas.height = diameterPx;

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, diameterPx, diameterPx);

        // Create circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(diameterPx / 2, diameterPx / 2, diameterPx / 2, 0, 2 * Math.PI);
        ctx.clip();

        // Calculate scaling to fit image within circle
        const scale = Math.min(diameterPx / image.width, diameterPx / image.height);
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;

        // Center the image within the circle
        const x = (diameterPx - scaledWidth) / 2;
        const y = (diameterPx - scaledHeight) / 2;

        // Draw the image scaled and centered
        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

        // Restore context to remove clipping path
        ctx.restore();

        // Convert to image with PNG format to preserve transparency
        const circularImage = new Image();
        circularImage.onload = () => resolve(circularImage);
        circularImage.src = canvas.toDataURL('image/png');
    });
}

// Detect card orientation and calculate proper dimensions
function calculateCardDimensions(originalWidth, originalHeight, cardType = 'standard') {
    const cardTypeData = CARD_TYPES[cardType];
    const aspectRatio = originalWidth / originalHeight;
    const cardAspectRatio = cardTypeData.width / cardTypeData.height;

    let isRotated = false;
    let cardWidth, cardHeight;

    // For square cards (ships) and round dials, no rotation detection needed
    if (cardTypeData.width === cardTypeData.height ||
        cardType === 'inner-dial' ||
        cardType === 'front-dial') {
        isRotated = false;
        cardWidth = cardTypeData.width;
        cardHeight = cardTypeData.height;
    } else {
        // For rectangular cards (standard and small ship), detect orientation
    if (Math.abs(aspectRatio - cardAspectRatio) > Math.abs(aspectRatio - (1/cardAspectRatio))) {
            // Card should be rotated
        isRotated = true;
            cardWidth = cardTypeData.height;
            cardHeight = cardTypeData.width;
    } else {
            // Card in normal orientation
        isRotated = false;
            cardWidth = cardTypeData.width;
            cardHeight = cardTypeData.height;
        }
    }

    // Convert to pixels for display using mmToPixels function
    const cardWidthPx = mmToPixels(cardWidth);
    const cardHeightPx = mmToPixels(cardHeight);

    return {
        width: cardWidthPx,
        height: cardHeightPx,
        isRotated: isRotated,
        originalWidth: originalWidth,
        originalHeight: originalHeight,
        cardType: cardType,
        cardWidthMm: cardWidth,
        cardHeightMm: cardHeight
    };
}
