export class Viewport {
    constructor(x = 0, y = 0, zoom = 1) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
    }

    pan(dx, dy) {
        return new Viewport(this.x + dx, this.y + dy, this.zoom);
    }

    zoomAt(factor, centerX, centerY) {
        // Determine the point in world coordinates
        // Not fully implementing point-based zoom for simplicity in this step, 
        // sticking to the simple zoom model from original code but prepared for future.
        const newZoom = Math.max(0.1, Math.min(5, this.zoom * factor));
        return new Viewport(this.x, this.y, newZoom);
    }

    apply(ctx) {
        ctx.translate(this.x, this.y);
        ctx.scale(this.zoom, this.zoom);
    }
}

export const calculateBounds = (model) => {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    const updateMinMax = (x, y) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    };

    model.components.forEach(c => {
        if (typeof c.x === 'number' && typeof c.y === 'number') {
            // Approximate component size as 100x60 (from renderer)
            updateMinMax(c.x - 50, c.y - 30);
            updateMinMax(c.x + 50, c.y + 30);
        }
    });

    model.wires.forEach(w => {
        updateMinMax(w.x1, w.y1);
        updateMinMax(w.x2, w.y2);
    });

    model.labels.forEach(l => {
        updateMinMax(l.x, l.y);
        // Approximate label width
        updateMinMax(l.x + (l.text.length * 8), l.y + 12);
    });

    if (minX === Infinity) return { x: 0, y: 0, width: 1000, height: 1000 };

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

export const getFitViewport = (model, containerWidth, containerHeight, padding = 40) => {
    const bounds = calculateBounds(model);

    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2);

    if (bounds.width === 0 || bounds.height === 0) {
        return new Viewport(containerWidth / 2, containerHeight / 2, 1);
    }

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;

    // Choose the smaller scale to fit both dimensions
    let zoom = Math.min(scaleX, scaleY);

    // Clamp zoom to reasonable limits (e.g. don't zoom in to 100x for a single resistor)
    zoom = Math.min(zoom, 5);
    zoom = Math.max(zoom, 0.1);

    // Calculate center of the bounds in world space
    const boundsCenterX = bounds.x + (bounds.width / 2);
    const boundsCenterY = bounds.y + (bounds.height / 2);

    // We want the bounds center to be at the container center
    // ScreenX = (WorldX * Zoom) + PanX
    // PanX = ScreenX - (WorldX * Zoom)

    const panX = (containerWidth / 2) - (boundsCenterX * zoom);
    const panY = (containerHeight / 2) - (boundsCenterY * zoom);

    return new Viewport(panX, panY, zoom);
};
