import React, { useState, useRef, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCw, FileText } from 'lucide-react';
import { parseSchematic } from '../core/parser';
import { Viewport, getFitViewport } from '../core/layout';
import { SchematicRenderer as Renderer } from '../core/renderer';

const SchematicRenderer = () => {
    const [model, setModel] = useState(null);
    const [viewport, setViewport] = useState(new Viewport(400, 300, 0.5));
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const rendererRef = useRef(null);

    // Draw loop and initialization
    useEffect(() => {
        if (model && canvasRef.current) {
            // Lazy init renderer if needed or if canvas changed
            if (!rendererRef.current || rendererRef.current.canvas !== canvasRef.current) {
                rendererRef.current = new Renderer(canvasRef.current);
            }

            // Ensure canvas size matches window (simple approach)
            // In a robust app, use ResizeObserver
            const canvas = canvasRef.current;
            rendererRef.current.draw(model, viewport);
        }
    }, [model, viewport]);

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const parsedData = parseSchematic(text);
                setModel(parsedData);

                // Auto fit view
                const width = window.innerWidth;
                const height = window.innerHeight - 140; // Subtract header/toolbar/footer approx height
                const newViewport = getFitViewport(parsedData, width, height);
                setViewport(newViewport);
            };
            reader.readAsText(file);
        }
    };

    // Mouse handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setViewport(new Viewport(newX, newY, viewport.zoom));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));
        setViewport(new Viewport(viewport.x, viewport.y, newZoom));
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(5, viewport.zoom * 1.2);
        setViewport(new Viewport(viewport.x, viewport.y, newZoom));
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(0.1, viewport.zoom / 1.2);
        setViewport(new Viewport(viewport.x, viewport.y, newZoom));
    };

    const handleReset = () => {
        setViewport(new Viewport(400, 300, 0.5));
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">schematic.js</h1>
                            <p className="text-sm text-gray-600">KiCad Schematic Renderer</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Load Schematic
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".sch,.kicad_sch"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            {model && (
                <div className="bg-white border-b border-gray-200 p-2 shadow-sm">
                    <div className="max-w-7xl mx-auto flex items-center gap-2">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Reset View"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                        <div className="ml-4 text-sm text-gray-600">
                            Zoom: {(viewport.zoom * 100).toFixed(0)}%
                        </div>
                        <div className="ml-4 text-sm text-gray-600">
                            Components: {model.components.length} | Wires: {model.wires.length} | Labels: {model.labels.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden">
                {!model ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <FileText className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Schematic Loaded</h2>
                            <p className="text-gray-500 mb-4">Upload a KiCad .sch file to visualize</p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Upload Schematic File
                            </button>
                        </div>
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        width={window.innerWidth}
                        height={window.innerHeight - 140}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        className="cursor-move bg-white"
                    />
                )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 p-2 text-center text-sm text-gray-600">
                <p>Pan: Click and drag | Zoom: Mouse wheel or toolbar buttons</p>
            </div>
        </div>
    );
};

export default SchematicRenderer;
