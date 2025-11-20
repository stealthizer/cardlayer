        // Configuration is now loaded from config.js
        // Image processing functions are now in imageProcessing.js

        // All non-autodetected cards will be treated as 'custom'

        // Global state for multiple pages
        let pages = [{ id: 1, images: [] }]; // Array of pages, each with its own images
        let currentPageIndex = 0; // Currently active page
        let nextPageId = 2; // Counter for generating unique page IDs
        let a4Dimensions = { width: 0, height: 0, scale: 1 };
        let selectedImageId = null; // Track selected image for keyboard shortcuts

        // Legacy compatibility - get current page images
        function getCurrentImages() {
            return pages[currentPageIndex].images;
        }

        // Legacy compatibility - set current page images
        function setCurrentImages(newImages) {
            pages[currentPageIndex].images = newImages;
        }

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
        const addPageBtn = document.getElementById('addPageBtn');
        const pageList = document.getElementById('pageList');
        const currentPageNumber = document.getElementById('currentPageNumber');
        const totalPages = document.getElementById('totalPages');
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
            if (shipNameInput) {
                container.appendChild(shipNameInput);
            }

            // Add drag functionality for A4 layout
            container.onmousedown = (e) => {
                // Don't start drag if clicking on controls
                if (e.target.classList.contains('clone-btn') ||
                    e.target.classList.contains('remove-btn') ||
                    e.target.classList.contains('ship-name-input') ||
                    e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'OPTION' ||
                    e.target.tagName === 'INPUT' ||
                    e.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                e.preventDefault();
                console.log('A4 image mousedown triggered', { imageId: image.id, clientX: e.clientX, clientY: e.clientY, target: e.target.className });
                startDrag(image, e, getCurrentImages(), a4Dimensions, a4Canvas);
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
            const currentImages = getCurrentImages();
            const image = currentImages.find(img => img.id === imageId);
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

        // Page management functions
        function addNewPage() {
            const newPage = { id: nextPageId++, images: [] };
            pages.push(newPage);
            updatePageList();
            switchToPage(pages.length - 1);
        }

        function switchToPage(pageIndex) {
            if (pageIndex < 0 || pageIndex >= pages.length) return;

            // Save current page state is already maintained in pages array
            currentPageIndex = pageIndex;

            // Clear canvas and redraw current page
            a4Canvas.querySelectorAll('.image-container').forEach(el => el.remove());

            const currentImages = getCurrentImages();
            currentImages.forEach(image => {
                addImageToCanvas(image);
            });

            // Update empty state
            if (currentImages.length === 0) {
                a4EmptyState.style.display = 'flex';
            } else {
                a4EmptyState.style.display = 'none';
            }

            updateUI();
            updatePageList();
        }

        function deletePage(pageIndex) {
            if (pages.length === 1) {
                // Don't delete the last page, just clear it
                pages[0].images = [];
                switchToPage(0);
                return;
            }

            pages.splice(pageIndex, 1);

            // Adjust current page index if needed
            if (currentPageIndex >= pages.length) {
                currentPageIndex = pages.length - 1;
            }

            switchToPage(currentPageIndex);
        }

        function updatePageList() {
            pageList.innerHTML = '';

            pages.forEach((page, index) => {
                const pageItem = document.createElement('div');
                pageItem.className = `flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    index === currentPageIndex ? 'bg-blue-100 border border-blue-300' : 'bg-white hover:bg-gray-100'
                }`;

                const pageInfo = document.createElement('div');
                pageInfo.className = 'flex-1 text-sm';
                pageInfo.textContent = `Page ${index + 1} (${page.images.length} cards)`;
                pageInfo.onclick = () => switchToPage(index);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-600 hover:text-red-800 text-xs px-2 py-1';
                deleteBtn.textContent = '✕';
                deleteBtn.title = 'Delete page';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (pages.length > 1 || page.images.length === 0 || confirm('Delete this page and all its cards?')) {
                        deletePage(index);
                    }
                };

                pageItem.appendChild(pageInfo);
                pageItem.appendChild(deleteBtn);
                pageList.appendChild(pageItem);
            });

            currentPageNumber.textContent = currentPageIndex + 1;
            totalPages.textContent = pages.length;
        }

        // Remove image with undo/redo support
        function removeImage(id) {
            const command = new DeleteImageCommand(
                id,
                currentPageIndex,
                getCurrentImages,
                setCurrentImages,
                (imageId) => {
                    // Remove element function
                    const element = document.querySelector(`[data-image-id="${imageId}"]`);
                    if (element) {
                        element.remove();
                    }

                    // Clear selection if the removed image was selected
                    if (selectedImageId === imageId) {
                        selectedImageId = null;
                    }

                    // Show empty state if no images
                    if (getCurrentImages().length === 0) {
                        a4EmptyState.style.display = 'flex';
                    }
                },
                (image) => {
                    // Add element function (for undo)
                    addImageToCanvas(image);
                },
                () => {
                    // Update UI function
                    updateUI();
                    updatePageList();
                }
            );

            undoRedoManager.execute(command);
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
            const currentImages = getCurrentImages();
            const originalImage = currentImages.find(img => img.id === id);
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
            currentImages.push(clonedImage);

            // Create and add the visual element to canvas
            const element = createImageElement(clonedImage);
            a4Canvas.appendChild(element);

            // Hide empty state
            a4EmptyState.style.display = 'none';

            updateUI();
            updatePageList();

            console.log('Clone created, total images:', getCurrentImages().length);
        }

        // Get control positions - absolute positioning regardless of rotation
        function getControlPositions(isRotated = false) {
            const offsetPx = CONTROL_OFFSET + 'px';
            if (isRotated) {
                // When container is rotated 90°, we need to adjust positions
                return {
                    rotate: { top: offsetPx, left: offsetPx },           // Top-left: rotate button
                    remove: { bottom: offsetPx, right: offsetPx }         // Bottom-right: remove button
                };
            } else {
                // Normal orientation
                return {
                    rotate: { top: offsetPx, left: offsetPx },           // Top-left: rotate button
                    remove: { bottom: offsetPx, right: offsetPx }         // Bottom-right: remove button
                };
            }
        }

        // Clear all images
        function clearAllImages() {
            setCurrentImages([]);
            a4Canvas.querySelectorAll('.image-container').forEach(el => el.remove());
            a4EmptyState.style.display = 'flex';
            updateUI();
            updatePageList();
        }

        // Update UI
        function updateUI() {
            const currentImages = getCurrentImages();
            const totalCards = pages.reduce((sum, page) => sum + page.images.length, 0);

            imageCount.textContent = totalCards;
            generatePdfBtn.disabled = totalCards === 0;
            clearAllBtn.style.display = currentImages.length > 0 ? 'block' : 'none';

            if (totalCards === 0) {
                pdfStatus.textContent = 'Add cards first';
            } else if (pages.length === 1) {
                pdfStatus.textContent = `${totalCards} card${totalCards !== 1 ? 's' : ''} ready`;
            } else {
                pdfStatus.textContent = `${totalCards} card${totalCards !== 1 ? 's' : ''} on ${pages.length} pages`;
            }

            if (currentImages.length === 0) {
                a4EmptyState.style.display = 'flex';
            }
        }

        // Process files wrapper - now uses external fileImporter module
        async function handleProcessFiles(files) {
            await processFiles(files, {
                images: getCurrentImages(),
                a4Dimensions,
                addImageToCanvas,
                updateUI: () => {
                    updateUI();
                    updatePageList();
                }
            });
        }

        // Generate PDF - now uses external module with multi-page support
        async function handleGeneratePDF() {
            await generatePDF(pages, a4Dimensions, pixelsToMm);
        }

        // Event listeners
        fileInput.onchange = (e) => handleProcessFiles(e.target.files);
        generatePdfBtn.onclick = handleGeneratePDF;
        clearAllBtn.onclick = clearAllImages;
        addPageBtn.onclick = addNewPage;

        // PDF Preview modal event listeners
        document.getElementById('exportPdfBtn').onclick = exportPDF;
        document.getElementById('cancelPreviewBtn').onclick = closePreviewModal;

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
            handleProcessFiles(e.dataTransfer.files);
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
            updatePageList();
        };

        // Event listeners
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });


        // Keyboard shortcuts for selected image and global shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // Global undo/redo shortcuts (Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Shift+Z)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;

            if (modifier && e.key === 'z' && !e.shiftKey) {
                // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
                e.preventDefault();
                if (undoRedoManager.undo()) {
                    console.log('Undo performed');
                }
                return;
            }

            if (modifier && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac) or Ctrl+Shift+Z (Windows/Linux)
                e.preventDefault();
                if (undoRedoManager.redo()) {
                    console.log('Redo performed');
                }
                return;
            }

            // If no image is selected, ignore image-specific keyboard shortcuts
            if (!selectedImageId) {
                return;
            }

            const currentImages = getCurrentImages();
            const selectedImage = currentImages.find(img => img.id === selectedImageId);
            if (!selectedImage) {
                return;
            }

            // R key - Rotate image (only for non-dial cards)
            // Don't interfere with Cmd+R, Ctrl+R, or other modifier combinations
            if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
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
            // Reposition all images on current page
            const currentImages = getCurrentImages();
            currentImages.forEach(image => {
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
