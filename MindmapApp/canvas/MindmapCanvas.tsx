import React, { useRef, useEffect, useCallback, useMemo, useState, forwardRef } from 'react';
import { Loader } from '../../components/Loader';

// Type for a mindmap node, extended for layout calculations
export type MindmapNode = {
    id: string;
    name: string;
    children?: MindmapNode[];
    cardContent?: string;
    // Layout properties
    x: number;
    y: number;
    width: number;
    height: number;
    level: number;
    parent?: MindmapNode;
    isCollapsed?: boolean;
};

// --- Constants ---
const HORIZONTAL_SPACING = 80;
const PADDING = 20;

export const COLOR_THEMES = {
    Default: {
        bg: '#FFFFFF',
        root: '#1F2937',
        rootText: '#FFFFFF',
        levels: ["#E5E7EB", "#D1D5DB", "#9CA3AF", "#6B7280"],
        text: '#111827',
        connector: '#9CA3AF',
        selected: '#2563EB',
    },
    Dawn: {
        bg: '#FFFBEB',
        root: '#78350F',
        rootText: '#FFFFFF',
        levels: ["#FDE68A", "#FCD34D", "#FBBF24", "#F59E0B"],
        text: '#422006',
        connector: '#D97706',
        selected: '#9A3412',
    },
    Dusk: {
        bg: '#111827',
        root: '#D1D5DB',
        rootText: '#1F2937',
        levels: ["#374151", "#4B5563", "#6B7280", "#9CA3AF"],
        text: '#F9FAFB',
        connector: '#4B5563',
        selected: '#60A5FA',
    },
    Ocean: {
        bg: '#F0F9FF',
        root: '#0C4A6E',
        rootText: '#FFFFFF',
        levels: ["#7DD3FC", "#38BDF8", "#0EA5E9", "#0284C7"],
        text: '#075985',
        connector: '#38BDF8',
        selected: '#2563EB',
    },
};

// --- Helper Functions ---
const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    const startY = y - (lineHeight * (lines.length - 1)) / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), x, startY + i * lineHeight);
    }
    return lines.length;
};


export const findNodeById = (node: MindmapNode, id: string): MindmapNode | null => {
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
};

export const getNodePath = (node: MindmapNode): string => {
    const path = [];
    let current: MindmapNode | undefined = node;
    while(current) {
        path.unshift(current.name);
        current = current.parent;
    }
    return path.join(' -> ');
};

interface MindmapCanvasProps {
    activeMapData: MindmapNode | null;
    activeTheme: string;
    activeFont: string;
    transform: { scale: number; translateX: number; translateY: number };
    setTransform: React.Dispatch<React.SetStateAction<{ scale: number; translateX: number; translateY: number; }>>;
    selectedNodeId: string | null;
    editingNodeId: string | null;
    onNodeSelect: (id: string | null) => void;
    onNodeDoubleClick: (nodeId: string) => void;
    onToggleCollapse: (nodeId: string) => void;
    onNodeCardView: (nodeId: string, position: { x: number; y: number }) => void;
}

export const MindmapCanvas = forwardRef<HTMLCanvasElement, MindmapCanvasProps>(({
    activeMapData,
    activeTheme,
    activeFont,
    transform,
    setTransform,
    selectedNodeId,
    editingNodeId,
    onNodeSelect,
    onNodeDoubleClick,
    onToggleCollapse,
    onNodeCardView,
}, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || internalCanvasRef;
    
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const lastTapRef = useRef({ time: 0, target: null as string | null });
    const dragStartRef = useRef({x: 0, y: 0});

    const drawMindmap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !activeMapData) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const theme = COLOR_THEMES[activeTheme as keyof typeof COLOR_THEMES] || COLOR_THEMES.Default;

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(transform.translateX, transform.translateY);
        ctx.scale(transform.scale, transform.scale);
        
        const nodesToDraw: MindmapNode[] = [];
        const traverse = (node: MindmapNode) => {
            nodesToDraw.push(node);
            if (node.children && !node.isCollapsed) node.children.forEach(traverse);
        };
        traverse(activeMapData);

        // Draw connections with smooth curves
        nodesToDraw.forEach(node => {
            if (node.parent) {
                ctx.beginPath();
                const startX = node.parent.x + node.parent.width;
                const startY = node.parent.y + node.parent.height / 2;
                const endX = node.x;
                const endY = node.y + node.height / 2;
                
                const midX = startX + HORIZONTAL_SPACING / 2;
                
                ctx.moveTo(startX, startY);
                ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
                
                ctx.strokeStyle = theme.connector;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // Draw nodes and toggles
        nodesToDraw.forEach(node => {
            ctx.fillStyle = node.level === 0 ? theme.root : theme.levels[(node.level - 1) % theme.levels.length];
            const radius = 12;
            drawRoundRect(ctx, node.x, node.y, node.width, node.height, radius);
            ctx.fill();
            
            if (node.id === selectedNodeId) {
                ctx.strokeStyle = theme.selected;
                ctx.lineWidth = 3;
                drawRoundRect(ctx, node.x - 2, node.y - 2, node.width + 4, node.height + 4, radius + 2);
                ctx.stroke();
            }

            if (node.id !== editingNodeId) {
                const isRoot = node.level === 0;
                const fontSize = isRoot ? 16 : 14;
                const lineHeight = fontSize * 1.4;
                const fontStyle = activeFont === 'Playfair Display' ? '700' : '500';
                ctx.font = `${fontStyle} ${fontSize}px '${activeFont}', sans-serif`;

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isRoot ? theme.rootText : theme.text;
                
                wrapText(ctx, node.name, node.x + node.width / 2, node.y + node.height / 2, node.width - PADDING, lineHeight);
            }

             // Draw card indicator
            if (node.cardContent && node.cardContent.trim() !== '') {
                ctx.save();
                const iconSize = 18;
                const iconX = node.x + node.width - (iconSize / 2);
                const iconY = node.y - (iconSize / 2);

                // Background circle
                ctx.beginPath();
                ctx.arc(iconX, iconY, iconSize / 2 + 2, 0, Math.PI * 2);
                ctx.fillStyle = theme.bg;
                ctx.fill();
                ctx.strokeStyle = theme.connector;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Simple sticky note icon
                ctx.fillStyle = theme.text;
                ctx.globalAlpha = 0.6;
                const ix = iconX - iconSize/2 + 4;
                const iy = iconY - iconSize/2 + 4;
                const iw = iconSize - 8;
                const ih = iconSize - 8;
                ctx.fillRect(ix, iy, iw, ih);
                ctx.strokeStyle = theme.bg;
                ctx.lineWidth = 1;
                ctx.strokeRect(ix, iy, iw, ih);
                
                ctx.restore();
            }

            // Draw collapse/expand toggle
            if (node.children && node.children.length > 0) {
                const TOGGLE_SIZE = 16;
                const toggleX = node.x + node.width;
                const toggleY = node.y + node.height / 2;

                ctx.beginPath();
                ctx.arc(toggleX, toggleY, TOGGLE_SIZE / 2, 0, 2 * Math.PI);
                ctx.fillStyle = theme.bg;
                ctx.fill();
                ctx.strokeStyle = theme.connector;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Draw '+' or '-'
                ctx.beginPath();
                ctx.moveTo(toggleX - 4, toggleY);
                ctx.lineTo(toggleX + 4, toggleY);
                if (node.isCollapsed) {
                    ctx.moveTo(toggleX, toggleY - 4);
                    ctx.lineTo(toggleX, toggleY + 4);
                }
                ctx.strokeStyle = theme.connector;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        ctx.restore();
    }, [activeMapData, transform, selectedNodeId, editingNodeId, activeTheme, activeFont, canvasRef]);

    useEffect(() => {
        drawMindmap();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleResize = () => drawMindmap();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawMindmap]);

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.2, Math.min(2, transform.scale * zoomFactor));
        const worldMouseX = (mouseX - transform.translateX) / transform.scale;
        const worldMouseY = (mouseY - transform.translateY) / transform.scale;
        const newTranslateX = mouseX - worldMouseX * newScale;
        const newTranslateY = mouseY - worldMouseY * newScale;
        setTransform({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        setPanStart({ x: e.clientX, y: e.clientY }); setIsPanning(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPanning) return;
        const dx = e.clientX - panStart.x; const dy = e.clientY - panStart.y;
        setTransform(prev => ({ ...prev, translateX: prev.translateX + dx, translateY: prev.translateY + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const dist = Math.sqrt(Math.pow(e.clientX - dragStartRef.current.x, 2) + Math.pow(e.clientY - dragStartRef.current.y, 2));
        setIsPanning(false); 
        if (dist > 5) return; // It was a drag, not a click
        
        const canvas = canvasRef.current; if (!canvas || !activeMapData) return;
        const rect = canvas.getBoundingClientRect();
        const worldClickX = (e.clientX - rect.left - transform.translateX) / transform.scale;
        const worldClickY = (e.clientY - rect.top - transform.translateY) / transform.scale;
        
        let actionTaken = false;
        
        const allNodes: MindmapNode[] = [];
        const traverse = (node: MindmapNode) => { allNodes.push(node); if (node.children && !node.isCollapsed) node.children.forEach(traverse); };
        traverse(activeMapData);
        
        const reversedNodes = [...allNodes].reverse();
        
        // Check for card icon click first
        for (const node of reversedNodes) {
             if (node.cardContent && node.cardContent.trim() !== '') {
                const iconSize = 18;
                const iconX = node.x + node.width - (iconSize / 2);
                const iconY = node.y - (iconSize / 2);
                
                const dx = worldClickX - iconX;
                const dy = worldClickY - iconY;
                const clickRadius = iconSize / 2 + 4; // A bit larger for easier clicking

                if (dx * dx + dy * dy < clickRadius * clickRadius) {
                    onNodeCardView(node.id, { x: e.clientX, y: e.clientY });
                    actionTaken = true;
                    break;
                }
            }
        }

        if(actionTaken) return;

        // Check for toggle click
        for (const node of reversedNodes) {
            if (node.children && node.children.length > 0) {
                const TOGGLE_SIZE = 16;
                const toggleX = node.x + node.width;
                const toggleY = node.y + node.height / 2;
                const dx = worldClickX - toggleX;
                const dy = worldClickY - toggleY;
                if (dx * dx + dy * dy < (TOGGLE_SIZE / 2 + 2) * (TOGGLE_SIZE / 2 + 2)) { // +2 for bigger hit area
                    onToggleCollapse(node.id);
                    actionTaken = true;
                    break;
                }
            }
        }
        
        if (actionTaken) return;

        let clickedNodeId: string | null = null;
        for (const node of reversedNodes) {
            if (worldClickX >= node.x && worldClickX <= node.x + node.width && worldClickY >= node.y && worldClickY <= node.y + node.height) {
                clickedNodeId = node.id;
                break;
            }
        }
        
        const now = Date.now();
        if (clickedNodeId && lastTapRef.current.target === clickedNodeId && now - lastTapRef.current.time < 300) {
            onNodeDoubleClick(clickedNodeId);
            lastTapRef.current = { time: 0, target: null };
        } else {
            onNodeSelect(clickedNodeId);
            lastTapRef.current = { time: now, target: clickedNodeId };
        }
    };

    const touchStateRef = useRef<{
        lastTap: { time: number; target: string | null };
        panStart: { x: number; y: number } | null;
        isPanning: boolean;
        pinchStart: { distance: number; midPoint: { x: number; y: number } } | null;
        dragStart: { x: number; y: number } | null;
    }>({
        lastTap: { time: 0, target: null },
        panStart: null,
        isPanning: false,
        pinchStart: null,
        dragStart: null,
    });

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touches = e.touches;

        if (touches.length === 1) {
            touchStateRef.current.isPanning = true;
            touchStateRef.current.panStart = { x: touches[0].clientX, y: touches[0].clientY };
            touchStateRef.current.dragStart = { x: touches[0].clientX, y: touches[0].clientY };
        } else if (touches.length === 2) {
            touchStateRef.current.isPanning = false;
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const midPoint = {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2,
            };
            touchStateRef.current.pinchStart = { distance, midPoint };
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touches = e.touches;

        if (touches.length === 1 && touchStateRef.current.isPanning && touchStateRef.current.panStart) {
            const dx = touches[0].clientX - touchStateRef.current.panStart.x;
            const dy = touches[0].clientY - touchStateRef.current.panStart.y;
            setTransform(prev => ({
                ...prev,
                translateX: prev.translateX + dx,
                translateY: prev.translateY + dy,
            }));
            touchStateRef.current.panStart = { x: touches[0].clientX, y: touches[0].clientY };
        } else if (touches.length === 2 && touchStateRef.current.pinchStart) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);
            
            const newMidPoint = {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2,
            };

            const zoomFactor = newDistance / touchStateRef.current.pinchStart.distance;
            const newScale = Math.max(0.2, Math.min(2, transform.scale * zoomFactor));

            const rect = canvasRef.current!.getBoundingClientRect();
            const worldMidPointX = (touchStateRef.current.pinchStart.midPoint.x - rect.left - transform.translateX) / transform.scale;
            const worldMidPointY = (touchStateRef.current.pinchStart.midPoint.y - rect.top - transform.translateY) / transform.scale;
            
            const newTranslateX = newMidPoint.x - rect.left - worldMidPointX * newScale;
            const newTranslateY = newMidPoint.y - rect.top - worldMidPointY * newScale;

            setTransform({
                scale: newScale,
                translateX: newTranslateX,
                translateY: newTranslateY,
            });

            touchStateRef.current.pinchStart = { distance: newDistance, midPoint: newMidPoint };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touches = e.touches;
    
        if (touches.length < 2) {
            touchStateRef.current.pinchStart = null;
        }
        if (touches.length < 1) {
            touchStateRef.current.isPanning = false;
            touchStateRef.current.panStart = null;
        }
        
        if (e.changedTouches.length === 1 && touchStateRef.current.dragStart) {
            const touch = e.changedTouches[0];
            const dist = Math.sqrt(Math.pow(touch.clientX - touchStateRef.current.dragStart.x, 2) + Math.pow(touch.clientY - touchStateRef.current.dragStart.y, 2));
    
            if (dist < 10) { // It's a tap
                const canvas = canvasRef.current;
                if (!canvas || !activeMapData) return;
                const rect = canvas.getBoundingClientRect();
                const worldClickX = (touch.clientX - rect.left - transform.translateX) / transform.scale;
                const worldClickY = (touch.clientY - rect.top - transform.translateY) / transform.scale;
    
                let actionTaken = false;
    
                const allNodes: MindmapNode[] = [];
                const traverse = (node: MindmapNode) => { allNodes.push(node); if (node.children && !node.isCollapsed) node.children.forEach(traverse); };
                traverse(activeMapData);
                const reversedNodes = [...allNodes].reverse();
                
                // Check for card icon click first
                for (const node of reversedNodes) {
                    if (node.cardContent && node.cardContent.trim() !== '') {
                        const iconSize = 18;
                        const iconX = node.x + node.width - (iconSize / 2);
                        const iconY = node.y - (iconSize / 2);
                        const dx = worldClickX - iconX;
                        const dy = worldClickY - iconY;
                        const clickRadius = iconSize / 2 + 4;

                        if (dx * dx + dy * dy < clickRadius * clickRadius) {
                            onNodeCardView(node.id, { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY });
                            actionTaken = true;
                            break;
                        }
                    }
                }
                if(actionTaken) {
                    touchStateRef.current.dragStart = null;
                    return;
                }

                // Check for toggle click
                for (const node of reversedNodes) {
                    if (node.children && node.children.length > 0) {
                        const TOGGLE_SIZE = 16;
                        const toggleX = node.x + node.width;
                        const toggleY = node.y + node.height / 2;
                        const dx = worldClickX - toggleX;
                        const dy = worldClickY - toggleY;
                        if (dx * dx + dy * dy < (TOGGLE_SIZE / 2 + 2) * (TOGGLE_SIZE / 2 + 2)) {
                            onToggleCollapse(node.id);
                            actionTaken = true;
                            break;
                        }
                    }
                }
                if (actionTaken) {
                    touchStateRef.current.dragStart = null;
                    return;
                }
    
                let clickedNodeId: string | null = null;
                for (const node of reversedNodes) {
                    if (worldClickX >= node.x && worldClickX <= node.x + node.width && worldClickY >= node.y && worldClickY <= node.y + node.height) {
                        clickedNodeId = node.id;
                        break;
                    }
                }
                
                const now = Date.now();
                const lastTap = touchStateRef.current.lastTap;
                if (clickedNodeId && lastTap.target === clickedNodeId && now - lastTap.time < 300) {
                    onNodeDoubleClick(clickedNodeId);
                    touchStateRef.current.lastTap = { time: 0, target: null };
                } else {
                    onNodeSelect(clickedNodeId);
                    touchStateRef.current.lastTap = { time: now, target: clickedNodeId };
                }
            }
        }
        touchStateRef.current.dragStart = null;
    };

    return (
        <div className="mindmap-canvas-wrapper">
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsPanning(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />
        </div>
    );
});