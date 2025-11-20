// Drag and Drop / Collision Detection module for Cardlayer

// Drag state management
const dragState = {
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    currentImage: null,
    currentDragArea: null, // 'import' or 'a4'
    isShiftPressed: false // Track Shift key for ignoring collisions
};

// Snap position to grid (in mm)
function snapToGrid(x, y, gridSizeMm = 2) {
    return {
        x: Math.round(x / gridSizeMm) * gridSizeMm,
        y: Math.round(y / gridSizeMm) * gridSizeMm
    };
}

// Get effective dimensions for collision detection (in mm)
// Note: width and height are already swapped during rotation, so just return them as-is
function getEffectiveDimensions(card) {
    return {
        width: card.widthMm,
        height: card.heightMm
    };
}

// Check for collision between two cards (using mm coordinates)
function checkCollision(card1, card2) {
    // Get effective dimensions (considering rotation)
    const card1Dims = getEffectiveDimensions(card1);
    const card2Dims = getEffectiveDimensions(card2);

    return !(card1.xMm + card1Dims.width <= card2.xMm ||
            card2.xMm + card2Dims.width <= card1.xMm ||
            card1.yMm + card1Dims.height <= card2.yMm ||
            card2.yMm + card2Dims.height <= card1.yMm);
}

// Check if a position is valid (no collisions) - newX and newY in mm
function isValidPosition(newImage, newX, newY, images) {
    const testImage = { ...newImage, xMm: newX, yMm: newY };

    for (const otherImage of images) {
        if (otherImage.id !== newImage.id && checkCollision(testImage, otherImage)) {
            return false;
        }
    }
    return true;
}

// Find the best auto-placement position for a new image (in mm)
function findBestAutoPlacementPosition(image, images, canvasWidthMm, canvasHeightMm) {
    const paddingMm = 3; // Minimum padding between cards and canvas edges in mm
    const gridStepMm = 5; // Grid step for placement in mm

    // If canvas is empty, place at top-left with padding
    if (images.length === 0) {
        const snapped = snapToGrid(paddingMm, paddingMm);
        return { x: snapped.x, y: snapped.y };
    }

    // Try to place in a grid layout (left-to-right, top-to-bottom)
    for (let y = paddingMm; y < canvasHeightMm - image.heightMm; y += gridStepMm) {
        for (let x = paddingMm; x < canvasWidthMm - image.widthMm; x += gridStepMm) {
            const snapped = snapToGrid(x, y);
            if (isValidPosition(image, snapped.x, snapped.y, images)) {
                return { x: snapped.x, y: snapped.y };
            }
        }
    }

    // If grid placement fails, return center (fallback)
    const centerX = (canvasWidthMm - image.widthMm) / 2;
    const centerY = (canvasHeightMm - image.heightMm) / 2;
    const snapped = snapToGrid(centerX, centerY);
    return { x: snapped.x, y: snapped.y };
}

// Find nearest valid position (in mm)
function findNearestValidPosition(image, targetXMm, targetYMm, images, canvasWidthMm, canvasHeightMm) {
    const stepMm = 2; // Use mm grid size as step size
    const maxAttempts = COLLISION_SEARCH_MAX_ATTEMPTS;

    // Snap target position to grid
    const snappedTarget = snapToGrid(targetXMm, targetYMm);

    // Try snapped position first
    if (isValidPosition(image, snappedTarget.x, snappedTarget.y, images)) {
        return { x: snappedTarget.x, y: snappedTarget.y };
    }

    // Search in expanding spiral using grid steps with more positions per ring
    for (let radius = stepMm; radius <= stepMm * maxAttempts; radius += stepMm) {
        const positions = [];

        // Generate positions in a circular pattern around the target
        const numPositions = Math.max(8, Math.floor(radius / stepMm) * 4);
        for (let i = 0; i < numPositions; i++) {
            const angle = (i / numPositions) * 2 * Math.PI;
            const x = snappedTarget.x + Math.cos(angle) * radius;
            const y = snappedTarget.y + Math.sin(angle) * radius;

            // Snap to grid
            const snapped = snapToGrid(x, y);

            // Constrain to A4 bounds (in mm)
            const constrainedX = Math.max(0, Math.min(snapped.x, canvasWidthMm - image.widthMm));
            const constrainedY = Math.max(0, Math.min(snapped.y, canvasHeightMm - image.heightMm));

            positions.push({ x: constrainedX, y: constrainedY });
        }

        // Try all positions in this ring
        for (const pos of positions) {
            if (isValidPosition(image, pos.x, pos.y, images)) {
                return { x: pos.x, y: pos.y };
            }
        }
    }

    // If no valid position found, try a systematic grid search starting from top-left
    const gridStepMm = 5;
    for (let y = 0; y < canvasHeightMm - image.heightMm; y += gridStepMm) {
        for (let x = 0; x < canvasWidthMm - image.widthMm; x += gridStepMm) {
            const snapped = snapToGrid(x, y);
            if (isValidPosition(image, snapped.x, snapped.y, images)) {
                return { x: snapped.x, y: snapped.y };
            }
        }
    }

    // If no valid position found, return original position (will overlap)
    return { x: snappedTarget.x, y: snappedTarget.y };
}

// Start dragging
function startDrag(image, e, images, a4Dimensions, a4Canvas) {
    console.log('startDrag called', { imageId: image.id, isDragging: dragState.isDragging, clientX: e.clientX, clientY: e.clientY });
    dragState.isDragging = true;
    dragState.currentImage = image;

    // Determine drag area based on where the drag started
    const a4Rect = a4Canvas.getBoundingClientRect();
    const isInA4 = e.clientX >= a4Rect.left && e.clientX <= a4Rect.right &&
                  e.clientY >= a4Rect.top && e.clientY <= a4Rect.bottom;

    dragState.currentDragArea = isInA4 ? 'a4' : 'import';

    // Calculate drag start offset relative to the image position (in scaled pixels)
    const imageXPx = mmToScaledPixels(image.xMm, a4Dimensions.scale);
    const imageYPx = mmToScaledPixels(image.yMm, a4Dimensions.scale);
    const imageRect = {
        left: a4Rect.left + imageXPx,
        top: a4Rect.top + imageYPx
    };

    dragState.dragStart = {
        x: e.clientX - imageRect.left,
        y: e.clientY - imageRect.top
    };

    // Add visual feedback
    const element = document.querySelector(`[data-image-id="${image.id}"]`);
    if (element) {
        element.classList.add('dragging');
    }

    // Create bound handlers for this drag session
    const handleDragBound = (e) => handleDrag(e, images, a4Dimensions, a4Canvas);
    const stopDragBound = () => stopDrag();

    // Store bound handlers so we can remove them later
    dragState.handleDragBound = handleDragBound;
    dragState.stopDragBound = stopDragBound;

    document.addEventListener('mousemove', handleDragBound);
    document.addEventListener('mouseup', stopDragBound);
}

// Handle dragging
function handleDrag(e, images, a4Dimensions, a4Canvas) {
    console.log('handleDrag called', { isDragging: dragState.isDragging, currentImage: dragState.currentImage?.id, clientX: e.clientX, clientY: e.clientY, shiftPressed: e.shiftKey });
    if (!dragState.isDragging || !dragState.currentImage) return;

    // Update shift key state
    dragState.isShiftPressed = e.shiftKey;

    const newX = e.clientX - dragState.dragStart.x;
    const newY = e.clientY - dragState.dragStart.y;

    // Only handle A4 canvas dragging now
    if (dragState.currentDragArea === 'a4' || !dragState.currentDragArea) {
        // Moving within A4 area - convert to relative coordinates (scaled pixels)
        const a4Rect = a4Canvas.getBoundingClientRect();
        const relativeXPx = newX - a4Rect.left;
        const relativeYPx = newY - a4Rect.top;

        // Convert scaled pixels to mm
        const relativeXMm = scaledPixelsToMm(relativeXPx, a4Dimensions.scale);
        const relativeYMm = scaledPixelsToMm(relativeYPx, a4Dimensions.scale);

        // Get effective dimensions for boundary checking (in mm)
        const effectiveDims = getEffectiveDimensions(dragState.currentImage);
        const constrainedXMm = Math.max(0, Math.min(relativeXMm, A4_WIDTH_MM - effectiveDims.width));
        const constrainedYMm = Math.max(0, Math.min(relativeYMm, A4_HEIGHT_MM - effectiveDims.height));

        // Snap to grid for easier alignment (in mm)
        const snappedPosition = snapToGrid(constrainedXMm, constrainedYMm);

        // Check for collisions with other cards (no stacking) - skip if Shift is pressed
        const finalXMm = dragState.isShiftPressed ? snappedPosition.x : checkCollisions(snappedPosition.x, snappedPosition.y, dragState.currentImage.id, images);

        dragState.currentImage.xMm = finalXMm;
        dragState.currentImage.yMm = snappedPosition.y;

        const element = document.querySelector(`[data-image-id="${dragState.currentImage.id}"]`);
        if (element) {
            // Convert mm back to scaled pixels for display
            const finalXPx = mmToScaledPixels(finalXMm, a4Dimensions.scale);
            const finalYPx = mmToScaledPixels(snappedPosition.y, a4Dimensions.scale);
            element.style.left = finalXPx + 'px';
            element.style.top = finalYPx + 'px';

            // Add visual feedback when ignoring collisions
            if (dragState.isShiftPressed) {
                element.style.opacity = '0.7';
            } else {
                element.style.opacity = '1';
            }
        }
    }
}

// Check for collisions and prevent stacking (in mm)
function checkCollisions(xMm, yMm, currentId, images) {
    const currentCard = images.find(img => img.id === currentId);
    if (!currentCard) return xMm;

    // Use effective dimensions (considering rotation) in mm
    const currentDims = getEffectiveDimensions(currentCard);

    for (const otherCard of images) {
        if (otherCard.id === currentId) continue;

        const otherDims = getEffectiveDimensions(otherCard);

        // Check if cards would overlap using effective dimensions (in mm)
        const overlapX = xMm < otherCard.xMm + otherDims.width && xMm + currentDims.width > otherCard.xMm;
        const overlapY = yMm < otherCard.yMm + otherDims.height && yMm + currentDims.height > otherCard.yMm;

        if (overlapX && overlapY) {
            // Cards would overlap, find the nearest non-overlapping position
            const leftDistance = Math.abs(xMm - (otherCard.xMm - currentDims.width));
            const rightDistance = Math.abs(xMm - (otherCard.xMm + otherDims.width));

            if (leftDistance < rightDistance) {
                return Math.max(0, otherCard.xMm - currentDims.width);
            } else {
                return Math.min(A4_WIDTH_MM - currentDims.width, otherCard.xMm + otherDims.width);
            }
        }
    }

    return xMm;
}

// Stop dragging
function stopDrag() {
    dragState.isDragging = false;

    // Remove visual feedback
    if (dragState.currentImage) {
        const element = document.querySelector(`[data-image-id="${dragState.currentImage.id}"]`);
        if (element) {
            element.classList.remove('dragging');
            // Reset opacity
            element.style.opacity = '1';
        }
    }

    // Reset shift state
    dragState.isShiftPressed = false;

    // Remove event listeners using the bound handlers
    if (dragState.handleDragBound) {
        document.removeEventListener('mousemove', dragState.handleDragBound);
    }
    if (dragState.stopDragBound) {
        document.removeEventListener('mouseup', dragState.stopDragBound);
    }

    dragState.currentImage = null;
    dragState.currentDragArea = null;
    dragState.handleDragBound = null;
    dragState.stopDragBound = null;
}
