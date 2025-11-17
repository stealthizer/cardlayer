// Drag and Drop / Collision Detection module for Cardlayer

// Drag state management
const dragState = {
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    currentImage: null,
    currentDragArea: null, // 'import' or 'a4'
    isShiftPressed: false // Track Shift key for ignoring collisions
};

// Snap position to grid
function snapToGrid(x, y) {
    return {
        x: Math.round(x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(y / GRID_SIZE) * GRID_SIZE
    };
}

// Get effective dimensions for collision detection
// Note: width and height are already swapped during rotation, so just return them as-is
function getEffectiveDimensions(card) {
    return {
        width: card.width,
        height: card.height
    };
}

// Check for collision between two cards
function checkCollision(card1, card2) {
    // Get effective dimensions (considering rotation)
    const card1Dims = getEffectiveDimensions(card1);
    const card2Dims = getEffectiveDimensions(card2);

    return !(card1.x + card1Dims.width <= card2.x ||
            card2.x + card2Dims.width <= card1.x ||
            card1.y + card1Dims.height <= card2.y ||
            card2.y + card2Dims.height <= card1.y);
}

// Check if a position is valid (no collisions)
function isValidPosition(newImage, newX, newY, images) {
    const testImage = { ...newImage, x: newX, y: newY };

    for (const otherImage of images) {
        if (otherImage.id !== newImage.id && checkCollision(testImage, otherImage)) {
            return false;
        }
    }
    return true;
}

// Find the best auto-placement position for a new image
function findBestAutoPlacementPosition(image, images, a4Dimensions) {
    const padding = AUTO_PLACEMENT_PADDING; // Minimum padding between cards and canvas edges

    // If canvas is empty, place at top-left with padding
    if (images.length === 0) {
        const snapped = snapToGrid(padding, padding);
        return { x: snapped.x, y: snapped.y };
    }

    // Try to place in a grid layout (left-to-right, top-to-bottom)
    const gridStep = GRID_SIZE * AUTO_PLACEMENT_GRID_STEP;
    for (let y = padding; y < a4Dimensions.height - image.height; y += gridStep) {
        for (let x = padding; x < a4Dimensions.width - image.width; x += gridStep) {
            const snapped = snapToGrid(x, y);
            if (isValidPosition(image, snapped.x, snapped.y, images)) {
                return { x: snapped.x, y: snapped.y };
            }
        }
    }

    // If grid placement fails, return center (fallback)
    const centerX = (a4Dimensions.width - image.width) / 2;
    const centerY = (a4Dimensions.height - image.height) / 2;
    const snapped = snapToGrid(centerX, centerY);
    return { x: snapped.x, y: snapped.y };
}

// Find nearest valid position
function findNearestValidPosition(image, targetX, targetY, images, a4Dimensions) {
    const step = GRID_SIZE; // Use grid size as step size
    const maxAttempts = COLLISION_SEARCH_MAX_ATTEMPTS;

    // Snap target position to grid
    const snappedTarget = snapToGrid(targetX, targetY);

    // Try snapped position first
    if (isValidPosition(image, snappedTarget.x, snappedTarget.y, images)) {
        return { x: snappedTarget.x, y: snappedTarget.y };
    }

    // Search in expanding spiral using grid steps with more positions per ring
    for (let radius = step; radius <= step * maxAttempts; radius += step) {
        const positions = [];

        // Generate positions in a circular pattern around the target
        const numPositions = Math.max(8, Math.floor(radius / step) * 4);
        for (let i = 0; i < numPositions; i++) {
            const angle = (i / numPositions) * 2 * Math.PI;
            const x = snappedTarget.x + Math.cos(angle) * radius;
            const y = snappedTarget.y + Math.sin(angle) * radius;

            // Snap to grid
            const snapped = snapToGrid(x, y);

            // Constrain to A4 bounds
            const constrainedX = Math.max(0, Math.min(snapped.x, a4Dimensions.width - image.width));
            const constrainedY = Math.max(0, Math.min(snapped.y, a4Dimensions.height - image.height));

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
    const gridStep = GRID_SIZE * AUTO_PLACEMENT_GRID_STEP;
    for (let y = 0; y < a4Dimensions.height - image.height; y += gridStep) {
        for (let x = 0; x < a4Dimensions.width - image.width; x += gridStep) {
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

    // Calculate drag start offset relative to the image position
    const imageRect = {
        left: a4Rect.left + image.x,
        top: a4Rect.top + image.y
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
        // Moving within A4 area - convert to relative coordinates
        const a4Rect = a4Canvas.getBoundingClientRect();
        const relativeX = newX - a4Rect.left;
        const relativeY = newY - a4Rect.top;

        // Get effective dimensions for boundary checking
        const effectiveDims = getEffectiveDimensions(dragState.currentImage);
        const constrainedX = Math.max(0, Math.min(relativeX, a4Dimensions.width - effectiveDims.width));
        const constrainedY = Math.max(0, Math.min(relativeY, a4Dimensions.height - effectiveDims.height));

        // Snap to grid for easier alignment
        const snappedPosition = snapToGrid(constrainedX, constrainedY);

        // Check for collisions with other cards (no stacking) - skip if Shift is pressed
        const finalX = dragState.isShiftPressed ? snappedPosition.x : checkCollisions(snappedPosition.x, snappedPosition.y, dragState.currentImage.id, images, a4Dimensions);

        dragState.currentImage.x = finalX;
        dragState.currentImage.y = snappedPosition.y;

        const element = document.querySelector(`[data-image-id="${dragState.currentImage.id}"]`);
        if (element) {
            element.style.left = finalX + 'px';
            element.style.top = snappedPosition.y + 'px';

            // Add visual feedback when ignoring collisions
            if (dragState.isShiftPressed) {
                element.style.opacity = '0.7';
            } else {
                element.style.opacity = '1';
            }
        }
    }
}

// Check for collisions and prevent stacking
function checkCollisions(x, y, currentId, images, a4Dimensions) {
    const currentCard = images.find(img => img.id === currentId);
    if (!currentCard) return x;

    // Use effective dimensions (considering rotation)
    const currentDims = getEffectiveDimensions(currentCard);

    for (const otherCard of images) {
        if (otherCard.id === currentId) continue;

        const otherDims = getEffectiveDimensions(otherCard);

        // Check if cards would overlap using effective dimensions
        const overlapX = x < otherCard.x + otherDims.width && x + currentDims.width > otherCard.x;
        const overlapY = y < otherCard.y + otherDims.height && y + currentDims.height > otherCard.y;

        if (overlapX && overlapY) {
            // Cards would overlap, find the nearest non-overlapping position
            const leftDistance = Math.abs(x - (otherCard.x - currentDims.width));
            const rightDistance = Math.abs(x - (otherCard.x + otherDims.width));

            if (leftDistance < rightDistance) {
                return Math.max(0, otherCard.x - currentDims.width);
            } else {
                return Math.min(a4Dimensions.width - currentDims.width, otherCard.x + otherDims.width);
            }
        }
    }

    return x;
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
