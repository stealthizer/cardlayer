// Undo/Redo System for Cardlayer
// Implements a command pattern for undoable actions

class UndoRedoManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50; // Limit history to prevent memory issues
    }

    // Execute a command and add it to the undo stack
    execute(command) {
        command.execute();
        this.undoStack.push(command);

        // Clear redo stack when a new action is performed
        this.redoStack = [];

        // Limit history size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    // Undo the last action
    undo() {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return false;
        }

        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        return true;
    }

    // Redo the last undone action
    redo() {
        if (this.redoStack.length === 0) {
            console.log('Nothing to redo');
            return false;
        }

        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
        return true;
    }

    // Check if undo is available
    canUndo() {
        return this.undoStack.length > 0;
    }

    // Check if redo is available
    canRedo() {
        return this.redoStack.length > 0;
    }

    // Clear all history
    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}

// Command for deleting an image
class DeleteImageCommand {
    constructor(imageId, pageIndex, getImagesFunc, setImagesFunc, removeElementFunc, addElementFunc, updateUIFunc) {
        this.imageId = imageId;
        this.pageIndex = pageIndex;
        this.getImages = getImagesFunc;
        this.setImages = setImagesFunc;
        this.removeElement = removeElementFunc;
        this.addElement = addElementFunc;
        this.updateUI = updateUIFunc;
        this.deletedImage = null;
        this.deletedIndex = -1;
    }

    execute() {
        const images = this.getImages();
        const index = images.findIndex(img => img.id === this.imageId);

        if (index === -1) {
            console.warn('Image not found for deletion:', this.imageId);
            return;
        }

        // Store the deleted image and its index for undo
        this.deletedImage = { ...images[index] };
        this.deletedIndex = index;

        // Remove the image
        const newImages = images.filter(img => img.id !== this.imageId);
        this.setImages(newImages);

        // Remove DOM element
        this.removeElement(this.imageId);

        // Update UI
        this.updateUI();

        console.log('Image deleted:', this.imageId);
    }

    undo() {
        if (!this.deletedImage) {
            console.warn('No deleted image to restore');
            return;
        }

        const images = this.getImages();

        // Insert the image back at its original position
        const newImages = [...images];
        newImages.splice(this.deletedIndex, 0, this.deletedImage);
        this.setImages(newImages);

        // Recreate DOM element
        this.addElement(this.deletedImage);

        // Update UI
        this.updateUI();

        console.log('Image restored:', this.imageId);
    }
}

// Global undo/redo manager instance
const undoRedoManager = new UndoRedoManager();
