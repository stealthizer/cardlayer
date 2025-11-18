        // Configuration is now loaded from config.js
        // Image processing functions are now in imageProcessing.js

        // Default card type
        let selectedCardType = 'custom';

        // Global state
        let images = [];
        let a4Dimensions = { width: 0, height: 0, scale: 1 };
        let selectedImageId = null; // Track selected image for keyboard shortcuts

        // DOM elements
        const fileInput = document.getElementById('fileInput');
        const importBtn = document.getElementById('importBtn');
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const imageCount = document.getElementById('imageCount');
        const pdfStatus = document.getElementById('pdfStatus');
        const a4Canvas = document.getElementById('a4Canvas');
        const dropOverlay = document.getElementById('dropOverlay');
        const a4EmptyState = document.getElementById('a4EmptyState');
        // Gallery elements removed per application.mdc - 2-section layout only

        // Initialize A4 dimensions
        function initA4Dimensions() {
            // Get available space for A4 layout (70% of screen width, full height minus padding)
            const containerWidth = window.innerWidth * A4_LAYOUT_WIDTH - LAYOUT_PADDING; // 70% minus minimal padding
            const containerHeight = window.innerHeight - LAYOUT_PADDING - BOTTOM_PADDING; // Full height minus minimal padding and bottom padding
            
            // A4 dimensions in pixels (horizontal: 297mm x 210mm)
            const baseWidth = mmToPixels(A4_WIDTH_MM);  // 297mm
            const baseHeight = mmToPixels(A4_HEIGHT_MM); // 210mm
            
            // Calculate scale to fit A4 in available space while maintaining aspect ratio
            const scaleX = containerWidth / baseWidth;
            const scaleY = containerHeight / baseHeight;
            const scale = Math.min(scaleX, scaleY); // Allow scaling up to fill space
            
            // Calculate final dimensions
            const finalWidth = baseWidth * scale;
            const finalHeight = baseHeight * scale;
            
            a4Dimensions = {
                width: finalWidth,
                height: finalHeight,
                scale: scale,
                baseWidth: baseWidth,
                baseHeight: baseHeight
            };
            
            // Apply dimensions to canvas
            a4Canvas.style.width = finalWidth + 'px';
            a4Canvas.style.height = finalHeight + 'px';
            
            console.log('A4 Layout initialized:', {
                containerSize: { width: containerWidth, height: containerHeight },
                baseSize: { width: baseWidth, height: baseHeight },
                finalSize: { width: finalWidth, height: finalHeight },
                scale: scale,
                aspectRatio: finalWidth / finalHeight,
                expectedAspectRatio: A4_WIDTH_MM / A4_HEIGHT_MM
            });
            
            // Show debug info in the UI
            const debugInfo = document.getElementById('a4DebugInfo');
            if (debugInfo) {
                const aspectRatio = (finalWidth / finalHeight).toFixed(3);
                const expectedRatio = (A4_WIDTH_MM / A4_HEIGHT_MM).toFixed(3);
                const isCorrectRatio = Math.abs(aspectRatio - expectedRatio) < 0.01;
                
                debugInfo.innerHTML = `
                    <div>Scale: ${(scale * 100).toFixed(1)}%</div>
                    <div>Size: ${Math.round(finalWidth)}×${Math.round(finalHeight)}px</div>
                    <div>Ratio: ${aspectRatio} ${isCorrectRatio ? '✓' : '✗'}</div>
                `;
                debugInfo.classList.remove('hidden');
            }
        }

        // Create image element for A4 layout
        function createImageElement(image) {
            const container = document.createElement('div');
            container.className = 'image-container absolute cursor-move select-none group';
            container.style.left = image.x + 'px';
            container.style.top = image.y + 'px';
            container.style.width = image.width + 'px';
            container.style.height = image.height + 'px';
            container.dataset.imageId = image.id;

            const img = document.createElement('img');
            // Use rotated source if available, otherwise use original
            img.src = image.isRotated && image.rotatedSrc ? image.rotatedSrc : image.src;
            img.alt = image.name;
            // Set appropriate object-fit class based on card type
            const objectFitClass = (image.cardType === 'inner-dial' || image.cardType === 'front-dial') ? 'object-contain' : 'object-cover';
            img.className = `w-full h-full ${objectFitClass} rounded border-2 border-transparent group-hover:border-blue-400 transition-colors`;
            img.draggable = false;

            // Ensure image fills container properly
            img.style.width = '100%';
            img.style.height = '100%';

            // For dials, use contain to ensure the full circular image is visible
            if (image.cardType === 'inner-dial' || image.cardType === 'front-dial') {
                img.style.objectFit = 'contain';
            } else {
                // For rotated images, we need to ensure the image fits without cropping
                // The container dimensions are already swapped, so just use cover
                img.style.objectFit = 'cover';
            }

            const controlPositions = getControlPositions(image.isRotated);

            // Clone button
            const cloneBtn = document.createElement('button');
            cloneBtn.className = 'clone-btn control-bottom-right';
            cloneBtn.style.bottom = CONTROL_OFFSET + 'px';
            cloneBtn.style.right = (CONTROL_OFFSET + 32) + 'px'; // Position to the left of remove button
            cloneBtn.innerHTML = '⧉'; // Clone symbol
            cloneBtn.title = 'Clone image';
            cloneBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                cloneImage(image.id);
            };
            cloneBtn.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn control-bottom-right';
            removeBtn.style.bottom = CONTROL_OFFSET + 'px';
            removeBtn.style.right = CONTROL_OFFSET + 'px';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                removeImage(image.id);
            };
            removeBtn.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            // Resize functionality removed per application.mdc

            // Add rotation indicator (only for non-dial cards)
            let rotationIndicator = null;
            if (image.cardType !== 'inner-dial' && image.cardType !== 'front-dial') {
                rotationIndicator = document.createElement('div');
                rotationIndicator.className = 'control-top-left bg-blue-500 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 select-none';
                rotationIndicator.style.top = CONTROL_OFFSET + 'px';
                rotationIndicator.style.left = CONTROL_OFFSET + 'px';
            rotationIndicator.textContent = image.isRotated ? '↻' : '↻';
                rotationIndicator.title = image.isRotated ? 'Click to rotate back (88×63.5mm)' : 'Click to rotate (63.5×88mm)';
                rotationIndicator.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Rotation indicator clicked', { imageId: image.id });
                    rotateImage(image.id);
                };
                rotationIndicator.onmousedown = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                };
            }

            // Add card type selector
            const cardTypeSelect = document.createElement('select');
            cardTypeSelect.className = 'control-bottom-left card-type-select bg-white text-gray-700 text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100 select-none border';
            cardTypeSelect.style.bottom = CONTROL_OFFSET + 'px';
            cardTypeSelect.style.left = CONTROL_OFFSET + 'px';
            cardTypeSelect.style.fontSize = '10px';
            cardTypeSelect.style.padding = '2px';
            cardTypeSelect.title = 'Change card type';
            
            // Add options
            Object.keys(CARD_TYPES).forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = CARD_TYPES[type].name;
                if (type === image.cardType) {
                    option.selected = true;
                }
                cardTypeSelect.appendChild(option);
            });
            
            cardTypeSelect.onchange = (e) => {
                e.stopPropagation();
                console.log('Card type selector changed for image', image.id, 'to', e.target.value);
                changeCardType(image.id, e.target.value);
            };
            cardTypeSelect.onmousedown = (e) => {
                e.stopPropagation();
            };
            cardTypeSelect.onclick = (e) => {
                e.stopPropagation();
            };

            // Add ship name input field (only for front dials)
            let shipNameInput = null;
            if (image.cardType === 'front-dial') {
                shipNameInput = document.createElement('textarea');
                shipNameInput.className = 'ship-name-input';
                shipNameInput.placeholder = 'Ship Name';
                shipNameInput.value = image.shipName || '';
                shipNameInput.title = 'Enter ship name (up to 2 lines)';
                shipNameInput.rows = 1;

                // Position from the top of the image for screen display
                const topOffsetMm = SHIP_NAME_TOP_OFFSET_SCREEN_MM;
                const topOffsetPx = mmToPixels(topOffsetMm) * a4Dimensions.scale;
                
                // Function to update text box position
                const updateTextBoxPosition = (textarea) => {
                    const topPosition = topOffsetPx;
                    textarea.style.top = topPosition + 'px';
                };
                
                shipNameInput.style.left = '50%';
                shipNameInput.style.transform = 'translateX(-50%)';
                
                // Handle input changes
                shipNameInput.oninput = (e) => {
                    e.stopPropagation();
                    image.shipName = e.target.value;
                    console.log('Ship name changed for image', image.id, 'to', e.target.value, 'Lines:', e.target.value.split(/\r?\n/).length);
                    
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 32) + 'px';
                    // Update position after resize
                    updateTextBoxPosition(e.target);
                };
                
                // Initial position setup
                updateTextBoxPosition(shipNameInput);
                
                shipNameInput.onmousedown = (e) => {
                    e.stopPropagation();
                };
                
                shipNameInput.onclick = (e) => {
                    e.stopPropagation();
                };
            }

            container.appendChild(img);
            container.appendChild(cloneBtn);
            container.appendChild(removeBtn);
            if (rotationIndicator) {
            container.appendChild(rotationIndicator);
            }
            container.appendChild(cardTypeSelect);
            if (shipNameInput) {
                container.appendChild(shipNameInput);
            }

            // Add drag functionality for A4 layout
            container.onmousedown = (e) => {
                // Don't start drag if clicking on controls
                if (e.target.classList.contains('clone-btn') ||
                    e.target.classList.contains('remove-btn') || 
                    e.target.classList.contains('card-type-select') ||
                    e.target.classList.contains('ship-name-input') ||
                    e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'OPTION' ||
                    e.target.tagName === 'INPUT' ||
                    e.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                e.preventDefault();
                console.log('A4 image mousedown triggered', { imageId: image.id, clientX: e.clientX, clientY: e.clientY, target: e.target.className });
                startDrag(image, e, images, a4Dimensions, a4Canvas);
            };
            
            console.log('A4 image element created with event handlers', {
                imageId: image.id,
                hasOnmousedown: !!container.onmousedown,
                hasOndblclick: !!container.ondblclick,
                className: container.className
            });

            // Add click handler to select image
            container.onclick = (e) => {
                // Don't select if clicking on control buttons
                if (e.target.tagName === 'BUTTON' ||
                    e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'INPUT') {
                    return;
                }
                selectImage(image.id);
            };

            // Add double-click to rotate (only for non-dial cards)
            if (image.cardType !== 'inner-dial' && image.cardType !== 'front-dial') {
                container.ondblclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('A4 image double-clicked for rotation', { imageId: image.id });
                    rotateImage(image.id);
                };
            }

            return container;
        }

        // Gallery functionality removed per application.mdc - 2-section layout only
        // Drag and drop functionality now in dragDrop.js

        // Get effective dimensions for collision detection
        // Note: width and height are already swapped during rotation, so just return them as-is
        function getEffectiveDimensions(card) {
            return {
                width: card.width,
                height: card.height
            };
        }

        // Resize functionality removed per application.mdc - users cannot resize images

        // Rotate image by pre-rotating the image data
        async function rotateImageData(imageSrc, originalWidth, originalHeight) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Swap canvas dimensions for rotation
                canvas.width = originalHeight;
                canvas.height = originalWidth;

                const img = new Image();
                img.onload = () => {
                    // Rotate the canvas 90 degrees clockwise
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);

                    // Convert to data URL
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = imageSrc;
            });
        }

        // Rotate image
        async function rotateImage(imageId) {
            const image = images.find(img => img.id === imageId);
            if (!image) return;

            console.log('Rotating image', { imageId, wasRotated: image.isRotated });

            // Toggle rotation state
            image.isRotated = !image.isRotated;

            // Swap width and height for both display and PDF dimensions
            const tempWidth = image.width;
            const tempHeight = image.height;
            image.width = tempHeight;
            image.height = tempWidth;

            // Swap card dimensions in mm (for PDF generation)
            const tempWidthMm = image.cardWidthMm;
            const tempHeightMm = image.cardHeightMm;
            image.cardWidthMm = tempHeightMm;
            image.cardHeightMm = tempWidthMm;

            // Swap original dimensions
            const tempOriginalWidth = image.originalWidth;
            const tempOriginalHeight = image.originalHeight;
            image.originalWidth = tempOriginalHeight;
            image.originalHeight = tempOriginalWidth;

            // Pre-rotate the image data if rotating, or keep original if unrotating
            if (image.isRotated) {
                // Rotating: create rotated version
                image.rotatedSrc = await rotateImageData(image.src, tempOriginalWidth, tempOriginalHeight);
            } else {
                // Unrotating: clear rotated version to use original
                image.rotatedSrc = null;
            }

            // Adjust position to keep the card centered at the same point
            // When rotating, the visual center shifts, so we need to compensate
            const centerX = image.x + tempWidth / 2;
            const centerY = image.y + tempHeight / 2;
            image.x = centerX - image.width / 2;
            image.y = centerY - image.height / 2;

            // Constrain to A4 bounds
            const effectiveDims = getEffectiveDimensions(image);
            image.x = Math.max(0, Math.min(image.x, a4Dimensions.width - effectiveDims.width));
            image.y = Math.max(0, Math.min(image.y, a4Dimensions.height - effectiveDims.height));

            // Update DOM element
            const element = document.querySelector(`[data-image-id="${imageId}"]`);
            if (element) {
                // Update container dimensions (swapped)
                element.style.width = image.width + 'px';
                element.style.height = image.height + 'px';
                element.style.left = image.x + 'px';
                element.style.top = image.y + 'px';

                // Update image element with pre-rotated image
                const imgElement = element.querySelector('img');
                if (imgElement) {
                    // Use the rotated image source or original
                    imgElement.src = image.isRotated ? image.rotatedSrc : image.src;
                    imgElement.style.objectFit = 'cover';
                }

                // Update rotation indicator
                const rotationIndicator = element.querySelector('.control-top-left');
                if (rotationIndicator) {
                    rotationIndicator.title = image.isRotated ?
                        `Click to rotate back (${image.cardHeightMm}×${image.cardWidthMm}mm)` :
                        `Click to rotate (${image.cardHeightMm}×${image.cardWidthMm}mm)`;
                }
            }

            console.log('Image rotated', {
                imageId,
                isRotated: image.isRotated,
                dimensions: { width: image.width, height: image.height },
                cardDimensions: { width: image.cardWidthMm, height: image.cardHeightMm },
                position: { x: image.x, y: image.y }
            });
        }

        // Add image to A4 canvas
        function addImageToCanvas(image) {
            console.log('Adding image to A4 canvas', { imageId: image.id, imageName: image.name });
            const element = createImageElement(image);
            a4Canvas.appendChild(element);
            a4EmptyState.style.display = 'none';
            console.log('Image added to A4 canvas', { element, hasOnmousedown: !!element.onmousedown });
        }

        // Gallery functionality removed per application.mdc

        // Remove image
        function removeImage(id) {
            images = images.filter(img => img.id !== id);
            const element = document.querySelector(`[data-image-id="${id}"]`);
            if (element) {
                element.remove();
            }

            // Clear selection if the removed image was selected
            if (selectedImageId === id) {
                selectedImageId = null;
            }

            // Show empty state if no images
            if (images.length === 0) {
                a4EmptyState.style.display = 'flex';
            }

            updateUI();
        }

        // Select image for keyboard shortcuts
        function selectImage(id) {
            // Remove selection from previously selected image
            if (selectedImageId) {
                const prevElement = document.querySelector(`[data-image-id="${selectedImageId}"]`);
                if (prevElement) {
                    prevElement.classList.remove('image-selected');
                }
            }

            // Set new selection
            selectedImageId = id;
            const element = document.querySelector(`[data-image-id="${id}"]`);
            if (element) {
                element.classList.add('image-selected');
            }
        }

        // Deselect current image
        function deselectImage() {
            if (selectedImageId) {
                const element = document.querySelector(`[data-image-id="${selectedImageId}"]`);
                if (element) {
                    element.classList.remove('image-selected');
                }
                selectedImageId = null;
            }
        }

        function cloneImage(id) {
            const originalImage = images.find(img => img.id === id);
            if (!originalImage) {
                console.log('Original image not found for cloning');
                return;
            }

            console.log('Cloning image:', originalImage);

            // Create a clone with a new ID and slightly offset position
            const clonedImage = {
                ...originalImage,
                id: Math.random().toString(36).substr(2, 9),
                x: originalImage.x + CLONE_OFFSET_X, // Offset to the right
                y: originalImage.y + CLONE_OFFSET_Y  // Offset down
            };

            // Ensure the clone stays within A4 bounds
            clonedImage.x = Math.max(0, Math.min(clonedImage.x, a4Dimensions.width - clonedImage.width));
            clonedImage.y = Math.max(0, Math.min(clonedImage.y, a4Dimensions.height - clonedImage.height));

            console.log('Cloned image data:', clonedImage);

            // Add to images array
            images.push(clonedImage);

            // Create and add the visual element to canvas
            const element = createImageElement(clonedImage);
            a4Canvas.appendChild(element);

            // Hide empty state
            a4EmptyState.style.display = 'none';

            updateUI();
            
            console.log('Clone created, total images:', images.length);
        }

        // Get control positions - absolute positioning regardless of rotation
        function getControlPositions(isRotated = false) {
            const offsetPx = CONTROL_OFFSET + 'px';
            if (isRotated) {
                // When container is rotated 90°, we need to adjust positions
                // The "bottom-left" of a rotated container is actually the "left-bottom" of the original
                return {
                    rotate: { top: offsetPx, left: offsetPx },           // Top-left: rotate button (stays same)
                    cardType: { bottom: offsetPx, left: offsetPx },       // Bottom-left: card type selector (stays same)
                    remove: { bottom: offsetPx, right: offsetPx }         // Bottom-right: remove button (stays same)
                };
            } else {
                // Normal orientation
                return {
                    rotate: { top: offsetPx, left: offsetPx },           // Top-left: rotate button
                    cardType: { bottom: offsetPx, left: offsetPx },       // Bottom-left: card type selector
                    remove: { bottom: offsetPx, right: offsetPx }         // Bottom-right: remove button
                };
            }
        }

        // Change card type of an existing image
        function changeCardType(imageId, newCardType) {
            const image = images.find(img => img.id === imageId);
            if (!image) return;

            console.log('Changing card type for image', imageId, 'from', image.cardType, 'to', newCardType);

            // Calculate new dimensions with the new card type
            const cardDims = calculateCardDimensions(image.originalWidth, image.originalHeight, newCardType);
            
            // Update image properties
            image.cardType = newCardType;
            image.cardWidthMm = cardDims.cardWidthMm;
            image.cardHeightMm = cardDims.cardHeightMm;
            image.isRotated = cardDims.isRotated;
            
            // Handle ship name property
            if (newCardType === 'front-dial') {
                image.shipName = image.shipName || ''; // Initialize if changing to front dial
            } else {
                image.shipName = undefined; // Remove ship name for non-front dial types
            }
            
            // Recalculate scaled dimensions
            const cardWidthScaled = cardDims.width * a4Dimensions.scale;
            const cardHeightScaled = cardDims.height * a4Dimensions.scale;
            
            // Update dimensions
            image.width = cardWidthScaled;
            image.height = cardHeightScaled;
            
            // Constrain to A4 bounds
            image.x = Math.max(0, Math.min(image.x, a4Dimensions.width - image.width));
            image.y = Math.max(0, Math.min(image.y, a4Dimensions.height - image.height));
            
            // Update DOM element
            const element = document.querySelector(`[data-image-id="${imageId}"]`);
            if (element) {
                element.style.width = image.width + 'px';
                element.style.height = image.height + 'px';
                element.style.left = image.x + 'px';
                element.style.top = image.y + 'px';

                // Update image element
                const imgElement = element.querySelector('img');
                if (imgElement) {
                    // Use rotated source if available
                    imgElement.src = image.isRotated && image.rotatedSrc ? image.rotatedSrc : image.src;

                    // For dials, use contain to ensure the full circular image is visible
                    if (image.cardType === 'inner-dial' || image.cardType === 'front-dial') {
                        imgElement.style.objectFit = 'contain';
                    } else {
                        imgElement.style.objectFit = 'cover';
                    }
                }
                
                // Update control positions
                const controlPositions = getControlPositions(image.isRotated);
                
                // Update remove button position
                const removeBtn = element.querySelector('.remove-btn');
                if (removeBtn) {
                    removeBtn.style.bottom = controlPositions.remove.bottom;
                    removeBtn.style.right = controlPositions.remove.right;
                }
                
                // Update rotation indicator position (only for non-dial cards)
                if (image.cardType !== 'inner-dial' && image.cardType !== 'front-dial') {
                    const rotationIndicator = element.querySelector('.control-top-left');
                    if (rotationIndicator) {
                        rotationIndicator.style.top = controlPositions.rotate.top;
                        rotationIndicator.style.left = controlPositions.rotate.left;
                    }
                } else {
                    // Remove rotation indicator for dials
                    const rotationIndicator = element.querySelector('.control-top-left');
                    if (rotationIndicator) {
                        rotationIndicator.remove();
                    }
                }
                
                // Update card type selector position
                const cardTypeSelect = element.querySelector('.card-type-select');
                if (cardTypeSelect) {
                    cardTypeSelect.style.bottom = controlPositions.cardType.bottom;
                    cardTypeSelect.style.left = controlPositions.cardType.left;
                }
                
                // Handle ship name input
                const existingShipNameInput = element.querySelector('.ship-name-input');
                if (image.cardType === 'front-dial') {
                    if (!existingShipNameInput) {
                        // Create new ship name input
                        const shipNameInput = document.createElement('textarea');
                        shipNameInput.className = 'ship-name-input';
                        shipNameInput.placeholder = 'Ship Name';
                        shipNameInput.value = image.shipName || '';
                        shipNameInput.title = 'Enter ship name (up to 2 lines)';
                        shipNameInput.rows = 1;

                        // Position from the top of the image for screen display
                        const topOffsetMm = SHIP_NAME_TOP_OFFSET_SCREEN_MM;
                        const topOffsetPx = mmToPixels(topOffsetMm) * a4Dimensions.scale;
                        
                        // Function to update text box position
                        const updateTextBoxPosition = (textarea) => {
                            const topPosition = topOffsetPx;
                            textarea.style.top = topPosition + 'px';
                        };
                        
                        shipNameInput.style.left = '50%';
                        shipNameInput.style.transform = 'translateX(-50%)';
                        
                        // Handle input changes
                        shipNameInput.oninput = (e) => {
                            e.stopPropagation();
                            image.shipName = e.target.value;
                            console.log('Ship name changed for image', image.id, 'to', e.target.value);
                            
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 32) + 'px';
                            // Update position after resize
                            updateTextBoxPosition(e.target);
                        };
                        
                        // Initial position setup
                        updateTextBoxPosition(shipNameInput);
                        
                        shipNameInput.onmousedown = (e) => {
                            e.stopPropagation();
                        };
                        
                        shipNameInput.onclick = (e) => {
                            e.stopPropagation();
                        };
                        
                        element.appendChild(shipNameInput);
                    } else {
                        // Update existing ship name input value and position
                        existingShipNameInput.value = image.shipName || '';
                        image.shipName = image.shipName || '';

                        // Recalculate position for existing text box (for screen display)
                        const topOffsetMm = SHIP_NAME_TOP_OFFSET_SCREEN_MM;
                        const topOffsetPx = mmToPixels(topOffsetMm) * a4Dimensions.scale;
                        
                        const topPosition = topOffsetPx;
                        existingShipNameInput.style.top = topPosition + 'px';
                        
                        // Handle input changes for existing input
                        existingShipNameInput.oninput = (e) => {
                            e.stopPropagation();
                            image.shipName = e.target.value;
                            console.log('Ship name changed for image', image.id, 'to', e.target.value);
                            
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 32) + 'px';
                            // Position remains at topOffsetPx (no dynamic centering)
                        };
                    }
                } else {
                    // Remove ship name input for non-front dial types
                    if (existingShipNameInput) {
                        existingShipNameInput.remove();
                    }
                }
            }
            
            console.log('Card type changed successfully for image', imageId, 'to', newCardType);
        }

        // Clear all images
        function clearAllImages() {
            images = [];
            a4Canvas.querySelectorAll('.image-container').forEach(el => el.remove());
            a4EmptyState.style.display = 'flex';
            updateUI();
        }

        // Update UI
        function updateUI() {
            imageCount.textContent = images.length;
            generatePdfBtn.disabled = images.length === 0;
            clearAllBtn.style.display = images.length > 0 ? 'block' : 'none';
            pdfStatus.textContent = images.length === 0 ? 'Add cards first' : `${images.length} card${images.length !== 1 ? 's' : ''} ready`;
            
            if (images.length === 0) {
                a4EmptyState.style.display = 'flex';
            }
        }

        // Process dropped files
        async function processFiles(files) {
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
                            let detectedCardType = selectedCardType;
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
                                a4CanvasChildren: a4Canvas.children.length,
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

        // Generate PDF - now uses external module
        async function handleGeneratePDF() {
            await generatePDF(images, a4Dimensions, pixelsToMm);
        }

        // Event listeners
        fileInput.onchange = (e) => processFiles(e.target.files);
        generatePdfBtn.onclick = handleGeneratePDF;
        clearAllBtn.onclick = clearAllImages;

        // Drag and drop for A4 canvas
        a4Canvas.ondragover = (e) => {
            e.preventDefault();
            dropOverlay.style.display = 'flex';
        };

        a4Canvas.ondragleave = (e) => {
            if (!a4Canvas.contains(e.relatedTarget)) {
                dropOverlay.style.display = 'none';
            }
        };

        a4Canvas.ondrop = (e) => {
            e.preventDefault();
            dropOverlay.style.display = 'none';
            processFiles(e.dataTransfer.files);
        };

        // Gallery drag and drop removed per application.mdc - 2-section layout only

        // Detect which font is actually available on the system
        function detectAvailableFont() {
            const fontList = [
                { name: 'Bank Gothic', display: 'Bank Gothic Bold' },
                { name: 'BankGothic', display: 'BankGothic Bold' },
                { name: 'Arial Narrow', display: 'Arial Narrow Bold' },
                { name: 'Arial', display: 'Arial Bold' }
            ];
            const testString = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const testSize = 72;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Measure with fallback font (monospace)
            ctx.font = `bold ${testSize}px monospace`;
            const fallbackWidth = ctx.measureText(testString).width;
            
            // Test each font in the list (using bold weight)
            for (const font of fontList) {
                ctx.font = `bold ${testSize}px "${font.name}", monospace`;
                const testWidth = ctx.measureText(testString).width;
                
                // If width differs, the font is available
                if (Math.abs(testWidth - fallbackWidth) > 1) {
                    return font.display;
                }
            }
            
            // If no font matched, return the last fallback
            return 'Arial Bold (fallback)';
        }

        // Update font status in the UI
        function updateFontStatus() {
            const detectedFont = detectAvailableFont();
            const fontStatusElement = document.getElementById('detectedFont');
            
            if (fontStatusElement) {
                fontStatusElement.textContent = detectedFont;
                
                // Color code based on font quality
                if (detectedFont.includes('Bank Gothic') || detectedFont.includes('BankGothic')) {
                    fontStatusElement.className = 'font-semibold text-green-600';
                } else if (detectedFont.includes('Arial Narrow')) {
                    fontStatusElement.className = 'font-semibold text-yellow-600';
                } else {
                    fontStatusElement.className = 'font-semibold text-orange-600';
                }
            }
            
            console.log('Detected font for ship names:', detectedFont);
        }

        // Initialize
        window.onload = () => {
            initA4Dimensions();
            updateUI();
            updateFontStatus();
        };

        // Event listeners
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // Card type selector
        document.getElementById('cardTypeSelect').addEventListener('change', (e) => {
            selectedCardType = e.target.value;
            console.log('Card type changed to:', selectedCardType);
        });

        // Keyboard shortcuts for selected image
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // If no image is selected, ignore keyboard shortcuts
            if (!selectedImageId) {
                return;
            }

            const selectedImage = images.find(img => img.id === selectedImageId);
            if (!selectedImage) {
                return;
            }

            // R key - Rotate image (only for non-dial cards)
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                if (selectedImage.cardType !== 'inner-dial' && selectedImage.cardType !== 'front-dial') {
                    rotateImage(selectedImageId);
                }
            }

            // Backspace or Delete key - Remove image
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                removeImage(selectedImageId);
            }
        });

        // Deselect image when clicking on A4 canvas background
        a4Canvas.addEventListener('click', (e) => {
            // Only deselect if clicking directly on the canvas (not on an image)
            if (e.target === a4Canvas) {
                deselectImage();
            }
        });

        window.onresize = () => {
            initA4Dimensions();
            // Reposition all images
            images.forEach(image => {
                const element = document.querySelector(`[data-image-id="${image.id}"]`);
                if (element) {
                    element.style.left = image.x + 'px';
                    element.style.top = image.y + 'px';
                }
            });
        };

        // Set last updated date (fixed date when app was last updated)
        function setLastUpdated() {
            const lastUpdatedElement = document.getElementById('lastUpdated');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = LAST_UPDATED_DATE;
            }
        }

        // Initialize last updated date when page loads
        document.addEventListener('DOMContentLoaded', setLastUpdated);
