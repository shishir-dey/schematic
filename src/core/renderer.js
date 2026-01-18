export class SchematicRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    draw(model, viewport) {
        if (!model || !this.ctx) return;

        const { width, height } = this.canvas;
        const { ctx } = this;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        ctx.save();

        // Apply Viewport Transform
        if (viewport) {
            viewport.apply(ctx);
            this.drawGrid(ctx, viewport);
        }

        // Draw Content
        this.drawWires(ctx, model.wires, viewport);
        this.drawComponents(ctx, model.components, viewport);
        this.drawLabels(ctx, model.labels, viewport);

        ctx.restore();

        // Draw Overlay (UI elements that don't scale)
        this.drawTitleBlock(ctx, model);
    }

    drawGrid(ctx, viewport) {
        if (!viewport) return;
        const { zoom } = viewport;

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5 / zoom;

        // Using fixed large bounds from original code for now
        for (let x = -5000; x < 15000; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, -5000);
            ctx.lineTo(x, 10000);
            ctx.stroke();
        }
        for (let y = -5000; y < 10000; y += 100) {
            ctx.beginPath();
            ctx.moveTo(-5000, y);
            ctx.lineTo(15000, y);
            ctx.stroke();
        }
    }

    drawWires(ctx, wires, viewport) {
        const { zoom } = viewport;
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 2 / zoom;

        wires.forEach(wire => {
            ctx.beginPath();
            ctx.moveTo(wire.x1, wire.y1);
            ctx.lineTo(wire.x2, wire.y2);
            ctx.stroke();
        });
    }

    drawComponents(ctx, components, viewport) {
        const { zoom } = viewport;
        ctx.strokeStyle = '#cc0000';
        ctx.fillStyle = '#cc0000';
        ctx.lineWidth = 2 / zoom;
        ctx.font = `${14 / zoom}px monospace`;

        components.forEach(comp => {
            if (comp.x && comp.y) {
                // Draw component rectangle
                ctx.strokeRect(comp.x - 50, comp.y - 30, 100, 60);

                // Draw component name
                ctx.fillText(comp.name || comp.library || '?', comp.x - 40, comp.y);

                // Draw fields (reference, value, etc.)
                comp.fields.forEach(field => {
                    if (field.text) {
                        ctx.fillStyle = '#0000cc';
                        ctx.fillText(field.text, field.x || comp.x, field.y || comp.y + 20);
                        ctx.fillStyle = '#cc0000';
                    }
                });
            }
        });
    }

    drawLabels(ctx, labels, viewport) {
        const { zoom } = viewport;
        ctx.fillStyle = '#ff6600';
        ctx.font = `${12 / zoom}px monospace`;

        labels.forEach(label => {
            ctx.fillText(label.text, label.x, label.y);
            // Draw connection point
            ctx.beginPath();
            ctx.arc(label.x - 10, label.y - 5, 3 / zoom, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawTitleBlock(ctx, model) {
        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Title: ${model.title}`, 10, 20);
        ctx.fillText(`Rev: ${model.rev}`, 10, 40);
        ctx.fillText(`Date: ${model.date}`, 10, 60);
    }
}
