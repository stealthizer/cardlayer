// Save/Load functionality for Cardlayer application

/**
 * Serialize the current state to JSON
 * @param {Array} pages - Array of pages with images
 * @returns {string} JSON string of the project state
 */
function serializeProject(pages) {
    const projectData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        pages: pages.map(page => ({
            id: page.id,
            images: page.images.map(img => ({
                id: img.id,
                src: img.src,
                rotatedSrc: img.rotatedSrc || null,
                name: img.name,
                cardType: img.cardType,
                xMm: img.xMm,
                yMm: img.yMm,
                widthMm: img.widthMm,
                heightMm: img.heightMm,
                originalWidth: img.originalWidth,
                originalHeight: img.originalHeight,
                isRotated: img.isRotated || false,
                shipName: img.shipName || ''
            }))
        }))
    };
    
    return JSON.stringify(projectData, null, 2);
}

/**
 * Deserialize JSON to project state
 * @param {string} jsonString - JSON string of the project
 * @returns {Object} Project data with pages array
 */
function deserializeProject(jsonString) {
    try {
        const projectData = JSON.parse(jsonString);
        
        // Validate version
        if (!projectData.version) {
            throw new Error('Invalid project file: missing version');
        }
        
        // Validate pages
        if (!Array.isArray(projectData.pages) || projectData.pages.length === 0) {
            throw new Error('Invalid project file: no pages found');
        }
        
        return projectData;
    } catch (error) {
        console.error('Error deserializing project:', error);
        throw error;
    }
}

/**
 * Save project to a JSON file (download)
 * @param {Array} pages - Array of pages with images
 * @param {string} filename - Optional filename (without extension)
 */
function saveProjectToFile(pages, filename = 'cardlayer-project') {
    try {
        const jsonString = serializeProject(pages);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Project saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Error saving project: ' + error.message);
        return false;
    }
}

/**
 * Load project from a JSON file
 * @param {File} file - The file object to read
 * @param {Function} callback - Callback function with loaded project data
 */
function loadProjectFromFile(file, callback) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const projectData = deserializeProject(e.target.result);
            callback(projectData, null);
        } catch (error) {
            console.error('Error loading project:', error);
            callback(null, error);
        }
    };
    
    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        callback(null, error);
    };
    
    reader.readAsText(file);
}

/**
 * Save project to localStorage
 * @param {Array} pages - Array of pages with images
 * @param {string} key - LocalStorage key (default: 'cardlayer-autosave')
 */
function saveProjectToLocalStorage(pages, key = 'cardlayer-autosave') {
    try {
        const jsonString = serializeProject(pages);
        localStorage.setItem(key, jsonString);
        localStorage.setItem(key + '-timestamp', new Date().toISOString());
        console.log('Project auto-saved to localStorage');
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        // If quota exceeded, clear old saves
        if (error.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded, clearing autosave');
            localStorage.removeItem(key);
        }
        return false;
    }
}

/**
 * Load project from localStorage
 * @param {string} key - LocalStorage key (default: 'cardlayer-autosave')
 * @returns {Object|null} Project data or null if not found
 */
function loadProjectFromLocalStorage(key = 'cardlayer-autosave') {
    try {
        const jsonString = localStorage.getItem(key);
        if (!jsonString) {
            console.log('No autosave found in localStorage');
            return null;
        }
        
        const projectData = deserializeProject(jsonString);
        const timestamp = localStorage.getItem(key + '-timestamp');
        
        console.log('Project loaded from localStorage', { timestamp });
        return projectData;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

/**
 * Check if there's an autosave available
 * @param {string} key - LocalStorage key (default: 'cardlayer-autosave')
 * @returns {Object|null} Autosave info or null
 */
function checkAutosave(key = 'cardlayer-autosave') {
    const jsonString = localStorage.getItem(key);
    const timestamp = localStorage.getItem(key + '-timestamp');
    
    if (!jsonString) {
        return null;
    }
    
    try {
        const projectData = JSON.parse(jsonString);
        const totalImages = projectData.pages.reduce((sum, page) => sum + page.images.length, 0);
        
        return {
            timestamp: timestamp ? new Date(timestamp) : null,
            pageCount: projectData.pages.length,
            imageCount: totalImages
        };
    } catch (error) {
        console.error('Error checking autosave:', error);
        return null;
    }
}

/**
 * Clear autosave from localStorage
 * @param {string} key - LocalStorage key (default: 'cardlayer-autosave')
 */
function clearAutosave(key = 'cardlayer-autosave') {
    localStorage.removeItem(key);
    localStorage.removeItem(key + '-timestamp');
    console.log('Autosave cleared');
}

