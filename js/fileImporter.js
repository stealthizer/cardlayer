// File Import & Processing Module
// Handles file reading, card type auto-detection, and image preprocessing

// Process dropped files and convert them to image objects
async function processFiles(files, {
    images,
    a4Dimensions,
    addImageToCanvas,
    updateUI
}) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    // Pre-process image: trim borders if PNG with alpha channel
                    let processedImg = img;
                    if (file.type === 'image/png') {
                        console.log('Processing PNG image for border trimming...');
                        processedImg = await trimImageBorders(img);
                        console.log('Border trimming complete', {
                            original: { width: img.width, height: img.height },
                            trimmed: { width: processedImg.width, height: processedImg.height }
                        });
                    }

                    // Auto-detect card type and orientation from filename
                    // Only matches if filename begins with the keyword (prevents false positives)
                    // Default to 'custom' for all non-autodetected cards
                    let detectedCardType = 'custom';
                    let forceOrientation = null; // null = auto-detect, false = vertical, true = horizontal
                    let baseTileSize = null; // null or one of: 'small', 'medium', 'large', 'huge'
                    let applyInnerDialTreatment = false; // Flag to apply circular cropping for "dial -" files
                    let isUpgrade = false; // Flag for upgrade cards (88mm × 63.5mm, horizontal, not rotated)
                    const fileNameLower = file.name.toLowerCase();

                    // Check if filename starts with the keyword (followed by separator or end of name)
                    // Remove extension for matching
                    const fileNameWithoutExt = fileNameLower.replace(/\.[^.]*$/, '');

                    if (fileNameWithoutExt.startsWith('tile base') || fileNameWithoutExt.startsWith('base tile')) {
                        // Extract size from filename (format: "tile base - size - name" or "base tile - size - name")
                        // Remove "tile base" or "base tile" and optional dashes/whitespace
                        const afterTileBase = fileNameWithoutExt.replace(/^(tile\s*base|base\s*tile)\s*[-–—]?\s*/i, '').trim();

                        console.log('Tile base detected, checking size from:', afterTileBase);

                        // Check for size keywords (can be after a dash or directly after "tile base"/"base tile")
                        // Match patterns like: "small", "- small", "small -", "small - name"
                        const sizeMatch = afterTileBase.match(/^[-–—]?\s*(small|medium|large|huge)\s*[-–—]?/i);

                        if (sizeMatch) {
                            baseTileSize = sizeMatch[1].toLowerCase();
                            // Map size to existing card type
                            if (BASE_TILE_SIZE_MAP[baseTileSize]) {
                                detectedCardType = BASE_TILE_SIZE_MAP[baseTileSize];
                                forceOrientation = false; // Base tiles use card type dimensions, not rotated
                                const cardTypeData = CARD_TYPES[detectedCardType];
                                console.log('✓ Auto-detected tile base from filename:', file.name, 'with size:', baseTileSize, '→', detectedCardType, '→', cardTypeData.width + 'mm × ' + cardTypeData.height + 'mm');
                            } else {
                                console.warn('⚠ Unknown base tile size:', baseTileSize, '(supported: small, medium, large, huge)');
                                baseTileSize = null;
                            }
                        } else {
                            console.warn('⚠ Tile base detected but could not parse size from filename:', file.name, '(expected format: "tile base - small/medium/large/huge - name" or "base tile - small/medium/large/huge - name")');
                        }
                    } else if (fileNameWithoutExt.startsWith('dial -') || (fileNameWithoutExt.startsWith('dial-') && !fileNameWithoutExt.startsWith('dial-front'))) {
                        // Detect "dial -" or "dial-" (but not "dial-front")
                        // Apply inner dial treatment: 43mm × 43mm square with circular cropping
                        detectedCardType = 'inner-dial'; // Use inner-dial as base type
                        applyInnerDialTreatment = true;
                        forceOrientation = false; // Square, not rotated
                        console.log('✓ Auto-detected dial from filename:', file.name, '→ 43mm × 43mm with inner dial treatment');
                    } else if (fileNameWithoutExt.startsWith('dial-front')) {
                        detectedCardType = 'front-dial';
                        console.log('Auto-detected front-dial from filename:', file.name);
                    } else if (fileNameWithoutExt.startsWith('pilot')) {
                        // Pilots are vertical cards (not rotated)
                        detectedCardType = 'standard'; // Use standard as base type
                        forceOrientation = false;
                        console.log('✓ Auto-detected pilot (vertical) from filename:', file.name, '→ 63.5mm × 88mm (vertical, not rotated)');
                    } else if (fileNameWithoutExt.startsWith('upgrade')) {
                        // Upgrades are horizontal cards (88mm × 63.5mm, not rotated)
                        isUpgrade = true;
                        detectedCardType = 'standard'; // Use standard as base type
                        forceOrientation = false; // Not rotated
                        console.log('✓ Auto-detected upgrade from filename:', file.name, '→ 88mm × 63.5mm (horizontal, not rotated)');
                    }

                    // Apply circular cropping for inner dials
                    if (detectedCardType === 'inner-dial' || applyInnerDialTreatment) {
                        console.log('Applying circular cropping for inner dial...');
                        processedImg = await cropImageToCircle(processedImg, 43); // 43mm diameter
                        console.log('Circular cropping complete', {
                            original: { width: img.width, height: img.height },
                            cropped: { width: processedImg.width, height: processedImg.height }
                        });
                    }

                    // Handle custom cards (use original image dimensions, no modifications)
                    let cardDims;
                    if (detectedCardType === 'custom') {
                        // Custom cards: use original image dimensions without any modifications
                        const originalWidthPx = processedImg.width;
                        const originalHeightPx = processedImg.height;
                        // Convert pixels to mm for PDF generation (assuming 96 DPI)
                        const originalWidthMm = pixelsToMm(originalWidthPx);
                        const originalHeightMm = pixelsToMm(originalHeightPx);

                        cardDims = {
                            width: originalWidthPx,
                            height: originalHeightPx,
                            isRotated: false,
                            originalWidth: processedImg.width,
                            originalHeight: processedImg.height,
                            cardType: 'custom',
                            cardWidthMm: originalWidthMm,
                            cardHeightMm: originalHeightMm
                        };
                        console.log('✓ Custom card detected: using original dimensions', originalWidthPx + 'px × ' + originalHeightPx + 'px (' + originalWidthMm.toFixed(2) + 'mm × ' + originalHeightMm.toFixed(2) + 'mm)');
                    } else {
                        // Calculate proper card dimensions based on orientation detection and detected card type
                        cardDims = calculateCardDimensions(processedImg.width, processedImg.height, detectedCardType);
                    }

                    // Override dimensions if inner dial treatment is needed (from "dial -" detection)
                    if (applyInnerDialTreatment) {
                        // Ensure 43mm × 43mm square dimensions
                        const dialSizeMm = 43;
                        const dialSizePx = mmToPixels(dialSizeMm);
                        cardDims.cardWidthMm = dialSizeMm;
                        cardDims.cardHeightMm = dialSizeMm;
                        cardDims.width = dialSizePx;
                        cardDims.height = dialSizePx;
                        cardDims.isRotated = false;
                        console.log('✓ Applied inner dial dimensions from "dial -" detection: 43mm × 43mm');
                    } else if (isUpgrade) {
                        // Upgrade cards: 88mm × 63.5mm (horizontal, not rotated)
                        const upgradeWidthMm = 88;
                        const upgradeHeightMm = 63.5;
                        const upgradeWidthPx = mmToPixels(upgradeWidthMm);
                        const upgradeHeightPx = mmToPixels(upgradeHeightMm);
                        cardDims.cardWidthMm = upgradeWidthMm;
                        cardDims.cardHeightMm = upgradeHeightMm;
                        cardDims.width = upgradeWidthPx;
                        cardDims.height = upgradeHeightPx;
                        cardDims.isRotated = false; // Upgrades are horizontal but not rotated
                        console.log('✓ Applied upgrade card dimensions: 88mm × 63.5mm (horizontal, not rotated)');
                    } else if (baseTileSize !== null && BASE_TILE_SIZE_MAP[baseTileSize]) {
                        // Apply base tile dimensions using full card type dimensions (width × height)
                        const mappedCardType = BASE_TILE_SIZE_MAP[baseTileSize];
                        const cardTypeData = CARD_TYPES[mappedCardType];
                        const tileWidthMm = cardTypeData.width;
                        const tileHeightMm = cardTypeData.height;
                        const tileWidthPx = mmToPixels(tileWidthMm);
                        const tileHeightPx = mmToPixels(tileHeightMm);
                        console.log('Applying base tile dimensions:', {
                            size: baseTileSize,
                            cardType: mappedCardType,
                            dimensionsMm: tileWidthMm + 'mm × ' + tileHeightMm + 'mm',
                            dimensionsPx: tileWidthPx.toFixed(2) + 'px × ' + tileHeightPx.toFixed(2) + 'px',
                            before: { width: cardDims.width, height: cardDims.height, widthMm: cardDims.cardWidthMm, heightMm: cardDims.cardHeightMm }
                        });
                        cardDims.cardWidthMm = tileWidthMm;
                        cardDims.cardHeightMm = tileHeightMm;
                        cardDims.width = tileWidthPx;
                        cardDims.height = tileHeightPx;
                        cardDims.isRotated = false; // Base tiles use card type dimensions, not rotated
                        console.log('✓ Applied base tile dimensions:', tileWidthMm + 'mm × ' + tileHeightMm + 'mm (' + tileWidthPx.toFixed(2) + 'px × ' + tileHeightPx.toFixed(2) + 'px)');
                    } else if (forceOrientation !== null && detectedCardType !== 'custom') {
                        // Override orientation if forced by filename detection (pilots/upgrades)
                        // Only apply if not a custom card type
                        cardDims.isRotated = forceOrientation;
                        // Update dimensions if rotation was forced
                        if (forceOrientation) {
                            // Horizontal: swap width and height
                            const tempWidth = cardDims.cardWidthMm;
                            const tempHeight = cardDims.cardHeightMm;
                            cardDims.cardWidthMm = tempHeight;
                            cardDims.cardHeightMm = tempWidth;
                            cardDims.width = mmToPixels(cardDims.cardWidthMm);
                            cardDims.height = mmToPixels(cardDims.cardHeightMm);
                        } else {
                            // Vertical: ensure standard dimensions from CARD_TYPES
                            const cardTypeData = CARD_TYPES[detectedCardType];
                            if (cardTypeData) {
                                cardDims.cardWidthMm = cardTypeData.width;
                                cardDims.cardHeightMm = cardTypeData.height;
                                cardDims.width = mmToPixels(cardDims.cardWidthMm);
                                cardDims.height = mmToPixels(cardDims.cardHeightMm);
                            }
                        }
                    }

                // Scale card dimensions to fit A4 layout
                const cardWidthScaled = cardDims.width * a4Dimensions.scale;
                const cardHeightScaled = cardDims.height * a4Dimensions.scale;

                // Debug logging for base tiles
                if (baseTileSize !== null) {
                    console.log('Final scaled dimensions for base tile:', {
                        baseSize: cardDims.width + 'px × ' + cardDims.height + 'px',
                        scaledSize: cardWidthScaled.toFixed(2) + 'px × ' + cardHeightScaled.toFixed(2) + 'px',
                        scale: a4Dimensions.scale,
                        dimensionsMm: cardDims.cardWidthMm + 'mm × ' + cardDims.cardHeightMm + 'mm'
                    });
                }

                    // Use processed image data URL
                    const processedDataUrl = processedImg.src || e.target.result;

                const image = {
                    id: Math.random().toString(36).substr(2, 9),
                        src: processedDataUrl,
                    name: file.name,
                    x: 0, // Temporary, will be set by auto-placement
                    y: 0, // Temporary, will be set by auto-placement
                    width: cardWidthScaled,
                    height: cardHeightScaled,
                        originalWidth: processedImg.width,
                        originalHeight: processedImg.height,
                    isRotated: cardDims.isRotated,
                        cardType: cardDims.cardType,
                        cardWidthMm: cardDims.cardWidthMm,
                        cardHeightMm: cardDims.cardHeightMm,
                        shipName: cardDims.cardType === 'front-dial' ? '' : undefined // Only front dials have ship names
                };

                // Auto-place image using smart grid-based positioning
                const autoPosition = findBestAutoPlacementPosition(image, images, a4Dimensions);
                image.x = autoPosition.x;
                image.y = autoPosition.y;

                console.log('Auto-placed image:', image.name, 'at', { x: image.x, y: image.y });

                images.push(image);
                addImageToCanvas(image);
                updateUI();

                    console.log('Image processing complete', {
                        imageId: image.id,
                        totalImages: images.length,
                        preprocessed: file.type === 'image/png'
                    });
                } catch (error) {
                    console.error('Error processing image:', error);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}
