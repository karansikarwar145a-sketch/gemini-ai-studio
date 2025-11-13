
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Plus, Minus, X } from '../components/icons';
import { Toolbar } from './tools/Toolbar';
import { StyleSidebar } from './styles/StyleSidebar';
import { MindmapCanvas, MindmapNode, findNodeById, getNodePath, COLOR_THEMES } from './canvas/MindmapCanvas';
import './Index.css';

declare var marked: any;

const LOCAL_STORAGE_KEY = 'mindZAppState';

const HORIZONTAL_SPACING = 80;
const PADDING = 20;


// The default map structure
const defaultMap: MindmapNode = {
    id: `map-root-${Date.now()}`,
    name: "New Mindmap",
    children: [
        { id: `map-child-1-${Date.now()}`, name: "Main Topic 1", x: 0, y: 0, width: 0, height: 0, level: 1 },
        { id: `map-child-2-${Date.now()}`, name: "Main Topic 2", x: 0, y: 0, width: 0, height: 0, level: 1 },
    ],
    x: 0, y: 0, width: 0, height: 0, level: 0
};

type MindmapData = {
    root: MindmapNode;
    theme: string;
    font: string;
    layout: string;
};

const initialMapData: MindmapData = {
    root: JSON.parse(JSON.stringify(defaultMap)),
    theme: 'Default',
    font: 'Inter',
    layout: 'Logic Chart (Right)',
};

const loadState = (): { history: MindmapData[][]; historyIndex: number; activeMapIndex: number } => {
    try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Basic validation
            if (Array.isArray(parsed.history) && typeof parsed.historyIndex === 'number' && typeof parsed.activeMapIndex === 'number') {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Failed to load mindmap state from localStorage", e);
    }
    return {
        history: [[initialMapData]],
        historyIndex: 0,
        activeMapIndex: 0,
    };
};

// Helper to find a node and its parent
const findNodeAndParent = (
    root: MindmapNode,
    nodeId: string,
): { node: MindmapNode; parent: MindmapNode | null; index: number } | null => {
    
    function traverse(current: MindmapNode, parent: MindmapNode | null, index: number): { node: MindmapNode; parent: MindmapNode | null; index: number } | null {
        if (current.id === nodeId) {
            return { node: current, parent, index };
        }
        if (current.children) {
            for (let i = 0; i < current.children.length; i++) {
                const found = traverse(current.children[i], current, i);
                if (found) return found;
            }
        }
        return null;
    }
    
    return traverse(root, null, -1);
};


// Card Editor Component
const CardEditor: React.FC<{
    node: MindmapNode;
    onSave: (content: string) => void;
    onClose: () => void;
}> = ({ node, onSave, onClose }) => {
    const [content, setContent] = useState(node.cardContent || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSave = () => {
        onSave(content);
    };

    return (
        <div className="card-editor-modal">
            <div className="card-editor-header">
                <h3>Card for: {node.name}</h3>
                <button onClick={onClose}><X className="w-5 h-5" /></button>
            </div>
            <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter detailed notes here... (Markdown supported)"
            />
            <div className="card-editor-footer">
                <button onClick={onClose} className="btn secondary">Cancel</button>
                <button onClick={handleSave} className="btn primary">Save</button>
            </div>
        </div>
    );
};

// New CardViewer Component
const CardViewer: React.FC<{
    node: MindmapNode;
    position: { x: number; y: number };
    onEdit: (nodeId: string) => void;
    onClose: () => void;
}> = ({ node, position, onEdit, onClose }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        opacity: 0,
        transform: 'scale(0.95)',
        top: position.y,
        left: position.x,
    });

    // Position the popover intelligently
    useEffect(() => {
        if (viewerRef.current) {
            const rect = viewerRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let finalX = position.x + 20;
            let finalY = position.y + 20;

            // Adjust if it overflows the viewport
            if (finalX + rect.width > vw - 20) {
                finalX = position.x - rect.width - 20;
            }
            if (finalY + rect.height > vh - 20) {
                finalY = position.y - rect.height - 20;
            }

            // Ensure it doesn't go off-screen at the top/left
            finalX = Math.max(20, finalX);
            finalY = Math.max(20, finalY);

            setStyle({
                top: `${finalY}px`,
                left: `${finalX}px`,
                opacity: 1,
                transform: 'scale(1)',
            });
        }
    // We only want to run this positioning logic once when the component mounts with initial position
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return (
        <div ref={viewerRef} className="card-viewer-popover" style={style}>
            <div className="card-viewer-header">
                <h4>Card for: {node.name}</h4>
                <div className="card-viewer-actions">
                    <button onClick={() => onEdit(node.id)}>Edit</button>
                    <button onClick={onClose}><X className="w-4 h-4" /></button>
                </div>
            </div>
            <div
                className="card-viewer-content markdown-content"
                dangerouslySetInnerHTML={{ __html: marked.parse(node.cardContent || '*No content.*') }}
            ></div>
        </div>
    );
};


export const MindmapApp: React.FC = () => {
    const { history: initialHistory, historyIndex: initialHistoryIndex, activeMapIndex: initialActiveMapIndex } = useMemo(() => loadState(), []);
    
    const [history, setHistory] = useState<MindmapData[][]>(initialHistory);
    const [historyIndex, setHistoryIndex] = useState(initialHistoryIndex);
    const [activeMapIndex, setActiveMapIndex] = useState(initialActiveMapIndex);
    
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [transform, setTransform] = useState({ scale: 1, translateX: 50, translateY: 300 });
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [editingNode, setEditingNode] = useState<{ id: string; name: string; x: number; y: number; width: number; height: number; } | null>(null);
    const [editingCardNodeId, setEditingCardNodeId] = useState<string | null>(null);
    const [viewingCard, setViewingCard] = useState<{ node: MindmapNode; position: { x: number; y: number } } | null>(null);


    const aiRef = useRef<GoogleGenAI | null>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isTabDown = useRef(false);

    const maps = history[historyIndex];
    const activeMap = maps[activeMapIndex];
    const fonts = ['Inter', 'Playfair Display', 'Roboto Mono', 'Kalam', 'Lobster'];

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            const stateToSave = { history, historyIndex, activeMapIndex };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.error("Failed to save mindmap state to localStorage", e);
        }
    }, [history, historyIndex, activeMapIndex]);


    const updateCurrentMaps = useCallback((updater: (currentMaps: MindmapData[]) => MindmapData[], addToHistory: boolean = true) => {
        const currentMaps = history[historyIndex];
        const newMaps = updater(currentMaps);

        if (JSON.stringify(newMaps) === JSON.stringify(currentMaps)) return;

        if (addToHistory) {
            const newHistory = [...history.slice(0, historyIndex + 1), newMaps];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        } else {
            const newHistory = [...history];
            newHistory[historyIndex] = newMaps;
            setHistory(newHistory);
        }
    }, [history, historyIndex]);

    useEffect(() => {
        try { aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY }); } 
        catch (e) { console.error(e); setError("Could not initialize AI service."); }
    }, []);

    const activeMapLayout = useMemo(() => {
        if (!activeMap) return null;
        const dataCopy = JSON.parse(JSON.stringify(activeMap.root));
        
        const calculateLayout = (node: MindmapNode, level = 0, y = 0): { height: number; y: number } => {
            const isRoot = level === 0;
            const fontSize = isRoot ? 16 : 14;
            const fontStyle = activeMap.font === 'Playfair Display' ? '700' : '500';
            const font = `${fontStyle} ${fontSize}px '${activeMap.font}', sans-serif`;
            
            const tempCtx = document.createElement('canvas').getContext('2d')!;
            tempCtx.font = font;

            const nodeWidth = Math.min(220, Math.max(120, tempCtx.measureText(node.name).width + 40));
            const lineHeight = fontSize * 1.4;

            // Calculate lines for wrapping
            const words = node.name.split(' ');
            let line = '';
            let lineCount = 1;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                if (tempCtx.measureText(testLine).width > nodeWidth - 20 && n > 0) {
                    line = words[n] + ' ';
                    lineCount++;
                } else {
                    line = testLine;
                }
            }

            const nodeHeight = Math.max(isRoot ? 50 : 40, (lineCount * lineHeight) + 20);

            node.level = level;
            node.x = level * (160 + HORIZONTAL_SPACING);
            node.y = y;
            node.width = nodeWidth;
            node.height = nodeHeight;

            let totalChildHeight = 0;
            if (node.children && !node.isCollapsed) {
                node.children.forEach((child, index) => {
                    child.parent = node;
                    const childLayout = calculateLayout(child, level + 1, y + totalChildHeight);
                    totalChildHeight += childLayout.height;
                    if (index < node.children!.length - 1) totalChildHeight += PADDING;
                });
            }
            
            const finalHeight = Math.max(nodeHeight, totalChildHeight);
            if (node.children && node.children.length > 0 && !node.isCollapsed) {
                const firstChild = node.children[0];
                const lastChild = node.children[node.children.length - 1];
                node.y = firstChild.y! + (lastChild.y! + lastChild.height - (firstChild.y!)) / 2 - node.height / 2;
            }
            return { height: finalHeight, y: node.y };
        };
        calculateLayout(dataCopy, 0, 0);
        return dataCopy;
    }, [activeMap]);

    const handleExtendNode = useCallback(async () => {
        if (!selectedNodeId || !aiRef.current || !activeMapLayout) return;
        const node = findNodeById(activeMapLayout, selectedNodeId);
        if (!node) return;

        setIsLoadingAI(true);
        const path = getNodePath(node);
        
        let prompt = `Given the mindmap path "${path}"`;
        if (node.cardContent) {
            prompt += ` and the following detailed notes in a card attached to the last node: "${node.cardContent}"`;
        }
        prompt += `, generate 3 to 5 relevant sub-topics. Return as a JSON array of strings. Example: ["Sub-topic A", "Sub-topic B"]`;
        
        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash', contents: prompt,
                config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
            });
            const newChildrenNames: string[] = JSON.parse(response.text);
            const newChildren: MindmapNode[] = newChildrenNames.map(name => ({ id: `node-${Date.now()}-${Math.random()}`, name, x:0, y:0, width:0, height:0, level:0 }));

            updateCurrentMaps(prevMaps => {
                const newMaps = JSON.parse(JSON.stringify(prevMaps));
                const nodeInState = findNodeById(newMaps[activeMapIndex].root, selectedNodeId);
                if (nodeInState) {
                    nodeInState.children = [...(nodeInState.children || []), ...newChildren];
                    nodeInState.isCollapsed = false;
                }
                return newMaps;
            });

        } catch (err) { console.error(err); setError("Failed to generate sub-topics."); } 
        finally { setIsLoadingAI(false); }
    }, [selectedNodeId, activeMapLayout, activeMapIndex, updateCurrentMaps]);

    const handleEditNode = useCallback((nodeIdToEdit?: string | null) => {
        if (!nodeIdToEdit || !activeMapLayout) return;
        const nodeId = nodeIdToEdit || selectedNodeId;
        if (!nodeId) return;

        const node = findNodeById(activeMapLayout, nodeId);
        if (!node) return;

        const mainRect = mainContentRef.current?.getBoundingClientRect();
        if (!mainRect) return;

        const screenX = node.x * transform.scale + transform.translateX;
        const screenY = node.y * transform.scale + transform.translateY;
        const screenWidth = node.width * transform.scale;
        const screenHeight = node.height * transform.scale;

        setEditingNode({
            id: node.id,
            name: node.name,
            x: screenX,
            y: screenY,
            width: screenWidth,
            height: screenHeight,
        });
    }, [selectedNodeId, activeMapLayout, transform]);

    const handleUpdateNodeName = (newName: string) => {
        if (!editingNode) return;
    
        const trimmedName = newName.trim();
        if (trimmedName) {
            updateCurrentMaps(prevMaps => {
                const newMaps = JSON.parse(JSON.stringify(prevMaps));
                const nodeInState = findNodeById(newMaps[activeMapIndex].root, editingNode.id);
                if (nodeInState) {
                    nodeInState.name = trimmedName;
                }
                return newMaps;
            });
        }
        setEditingNode(null);
    };
    
    const handleOpenCardEditor = (nodeId: string | null) => {
        if (nodeId) {
            setEditingCardNodeId(nodeId);
        }
    };

    const handleSaveCardContent = (content: string) => {
        if (!editingCardNodeId) return;
        updateCurrentMaps(prevMaps => {
            const newMaps = JSON.parse(JSON.stringify(prevMaps));
            const node = findNodeById(newMaps[activeMapIndex].root, editingCardNodeId);
            if (node) {
                // Set to undefined if empty to clean up data
                node.cardContent = content.trim() ? content.trim() : undefined;
            }
            return newMaps;
        });
        setEditingCardNodeId(null);
    };

    const handleNodeDoubleClick = useCallback((nodeId: string) => {
        handleEditNode(nodeId);
    }, [handleEditNode]);

    const handleAddChildNode = useCallback(() => {
        if (!selectedNodeId) return;

        const newNodeId = `node-${Date.now()}-${Math.random()}`;
        updateCurrentMaps(prevMaps => {
            const newMaps = JSON.parse(JSON.stringify(prevMaps));
            const mapToEdit = newMaps[activeMapIndex];
            const parentNode = findNodeById(mapToEdit.root, selectedNodeId);

            if (parentNode) {
                const newNode: MindmapNode = {
                    id: newNodeId,
                    name: "New Node",
                    x: 0, y: 0, width: 0, height: 0, level: 0
                };
                if (!parentNode.children) {
                    parentNode.children = [];
                }
                parentNode.children.push(newNode);
                parentNode.isCollapsed = false;
            }
            return newMaps;
        });
        setSelectedNodeId(newNodeId);
        setTimeout(() => handleEditNode(newNodeId), 50);

    }, [selectedNodeId, activeMapIndex, handleEditNode, updateCurrentMaps]);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNodeId || selectedNodeId === activeMap.root.id) {
            if (selectedNodeId === activeMap.root.id) {
                alert("The root node cannot be deleted.");
            }
            return;
        }
    
        updateCurrentMaps(prevMaps => {
            const newMaps = JSON.parse(JSON.stringify(prevMaps));
            const mapToEdit = newMaps[activeMapIndex];
    
            const result = findNodeAndParent(mapToEdit.root, selectedNodeId);
    
            if (result && result.parent && result.parent.children) {
                result.parent.children.splice(result.index, 1);
            }
            
            return newMaps;
        });
    
        setSelectedNodeId(null);
    }, [selectedNodeId, activeMapIndex, activeMap.root.id, updateCurrentMaps]);
    
    const handleCenterView = useCallback(() => {
        setTransform({ scale: 1, translateX: 50, translateY: 300 });
    }, []);

    const handleToggleCollapse = (nodeId: string) => {
        updateCurrentMaps(prevMaps => {
            const newMaps = JSON.parse(JSON.stringify(prevMaps));
            const mapToEdit = newMaps[activeMapIndex];
            const node = findNodeById(mapToEdit.root, nodeId);

            if (node && node.children && node.children.length > 0) {
                node.isCollapsed = !node.isCollapsed;
            }
            
            return newMaps;
        }, true); // Add to history for undo/redo
    };

    const handleViewCard = useCallback((nodeId: string, clickPosition: { x: number; y: number }) => {
        if (!activeMapLayout) return;
        const node = findNodeById(activeMapLayout, nodeId);
        if (node && node.cardContent) {
            setViewingCard({ node, position: clickPosition });
        }
    }, [activeMapLayout]);

    const handleEditFromViewer = (nodeId: string) => {
        setViewingCard(null);
        handleOpenCardEditor(nodeId);
    };
    
    const handleNewMap = () => {
        const newMap = { ...initialMapData, root: { ...defaultMap, id: `map-root-${Date.now()}` }};
        updateCurrentMaps(prev => [...prev, newMap]);
        setActiveMapIndex(maps.length);
        setSelectedNodeId(null);
    };

    const handleSetTheme = (theme: string) => {
        updateCurrentMaps(prev => prev.map((map, index) => index === activeMapIndex ? { ...map, theme } : map));
    };
    const handleSetFont = (font: string) => {
        updateCurrentMaps(prev => prev.map((map, index) => index === activeMapIndex ? { ...map, font } : map));
    };

    const handleSetLayout = (layout: string) => {
        updateCurrentMaps(prev => prev.map((map, index) => index === activeMapIndex ? { ...map, layout } : map));
    };

    const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
    const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

    const handleExportPNG = () => {
        if (!canvasRef.current) return;
        const tempCanvas = canvasRef.current;
        const link = document.createElement('a');
        link.download = `${activeMap.root.name.replace(/\s+/g, '_')}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    };

    const handleExportHTML = useCallback(() => {
        if (!activeMapLayout || !activeMap) return;

        const theme = COLOR_THEMES[activeMap.theme as keyof typeof COLOR_THEMES] || COLOR_THEMES.Default;
        const font = activeMap.font;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const nodes: MindmapNode[] = [];
        const traverse = (node: MindmapNode) => {
            nodes.push(node);
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
            if (node.children && !node.isCollapsed) node.children.forEach(traverse);
        };
        traverse(activeMapLayout);

        const PADDING_EXPORT = 50; // Padding around the content
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const offsetX = -minX + PADDING_EXPORT;
        const offsetY = -minY + PADDING_EXPORT;
        
        const svgPaths = nodes.filter(n => n.parent).map(node => {
            const startX = node.parent!.x + node.parent!.width + offsetX;
            const startY = node.parent!.y + node.parent!.height / 2 + offsetY;
            const endX = node.x + offsetX;
            const endY = node.y + node.height / 2 + offsetY;
            const midX1 = startX + 80 / 2; // HORIZONTAL_SPACING / 2
            
            return `<path d="M ${startX} ${startY} C ${midX1} ${startY}, ${midX1} ${endY}, ${endX} ${endY}" stroke="${theme.connector}" stroke-width="2" fill="none" />`;
        }).join('');

        const nodeDivs = nodes.map(node => {
            const isRoot = node.level === 0;
            const backgroundColor = isRoot ? theme.root : theme.levels[(node.level - 1) % theme.levels.length];
            const textColor = isRoot ? theme.rootText : theme.text;
            const fontSize = isRoot ? '16px' : '14px';
            const fontWeight = font === 'Playfair Display' ? '700' : '500';

            return `
                <div class="node" style="
                    left: ${node.x + offsetX}px; 
                    top: ${node.y + offsetY}px; 
                    width: ${node.width}px; 
                    height: ${node.height}px;
                    background-color: ${backgroundColor};
                    color: ${textColor};
                    font-size: ${fontSize};
                    font-weight: ${fontWeight};
                ">
                    ${node.name}
                </div>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${activeMap.root.name}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@700&family=Kalam:wght@400;700&family=Roboto+Mono&family=Lobster&display=swap');
                    body { 
                        font-family: '${font}', sans-serif; 
                        background-color: ${theme.bg};
                        margin: 0;
                        overflow: auto;
                    }
                    .container {
                        position: relative;
                        width: ${contentWidth + PADDING_EXPORT * 2}px;
                        height: ${contentHeight + PADDING_EXPORT * 2}px;
                    }
                    .node {
                        position: absolute;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 10px;
                        box-sizing: border-box;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        overflow: hidden;
                        word-break: break-word;
                    }
                    svg {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <svg width="${contentWidth + PADDING_EXPORT * 2}" height="${contentHeight + PADDING_EXPORT * 2}">
                        ${svgPaths}
                    </svg>
                    ${nodeDivs}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${activeMap.root.name.replace(/\s+/g, '_')}.html`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

    }, [activeMapLayout, activeMap]);
    
    const handleNodeSelect = (id: string | null) => {
        if(editingNode) {
            setEditingNode(null); // Cancel editing if selecting another node
        }
        if (viewingCard) {
            setViewingCard(null);
        }
        setSelectedNodeId(id);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingNode || editingCardNodeId || viewingCard) {
                return;
            }
            
            // Handle Tab+Q for renaming
            if ((e.key.toLowerCase() === 'q') && isTabDown.current) {
                e.preventDefault();
                isTabDown.current = false; // Consume combo
                if (selectedNodeId) {
                    handleEditNode(selectedNodeId);
                }
                return;
            }

            // If Tab is down and another key is pressed, cancel the combo for child creation
            if (isTabDown.current && e.key !== 'Tab') {
                isTabDown.current = false;
            }

            if (!selectedNodeId) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    if (activeMapLayout?.children?.[0]) {
                        setSelectedNodeId(activeMapLayout.children[0].id);
                        e.preventDefault();
                    }
                }
                return;
            }

            const result = findNodeAndParent(activeMapLayout!, selectedNodeId);
            if (!result) return;
            const { node, parent, index } = result;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (parent?.children && index > 0) {
                        setSelectedNodeId(parent.children[index - 1].id);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (parent?.children && index < parent.children.length - 1) {
                        setSelectedNodeId(parent.children[index + 1].id);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (parent) {
                        setSelectedNodeId(parent.id);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (node.children && node.children.length > 0 && !node.isCollapsed) {
                        setSelectedNodeId(node.children[0].id);
                    }
                    break;

                case 'Tab': {
                    e.preventDefault();
                    isTabDown.current = true;
                    break;
                }

                case 'Enter': {
                    e.preventDefault();
                    if (parent) { // Cannot create sibling for root
                        const newSiblingId = `node-${Date.now()}-${Math.random()}`;
                        updateCurrentMaps(prevMaps => {
                            const newMaps = JSON.parse(JSON.stringify(prevMaps));
                            const mapToEdit = newMaps[activeMapIndex];
                            const parentNode = findNodeById(mapToEdit.root, parent.id);
                            if (parentNode && parentNode.children) {
                                const currentIndex = parentNode.children.findIndex(c => c.id === selectedNodeId);
                                const newNode: MindmapNode = { id: newSiblingId, name: "New Node", x: 0, y: 0, width: 0, height: 0, level: 0 };
                                parentNode.children.splice(currentIndex + 1, 0, newNode);
                            }
                            return newMaps;
                        });
                        setSelectedNodeId(newSiblingId);
                        setTimeout(() => handleEditNode(newSiblingId), 50);
                    }
                    break;
                }
                
                case 'Delete':
                case 'Backspace': {
                    e.preventDefault();
                    if (selectedNodeId) {
                        handleDeleteNode();
                    }
                    break;
                }

                default:
                    // Any other key press will cancel the tab combo
                    isTabDown.current = false;
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (editingNode || editingCardNodeId || viewingCard) {
                return;
            }
            if (e.key === 'Tab') {
                if (isTabDown.current) { // If true, it means Tab was released without another key being pressed
                    isTabDown.current = false;
                    if (selectedNodeId) {
                        const newNodeId = `node-${Date.now()}-${Math.random()}`;
                        updateCurrentMaps(prevMaps => {
                            const newMaps = JSON.parse(JSON.stringify(prevMaps));
                            const mapToEdit = newMaps[activeMapIndex];
                            const parentNode = findNodeById(mapToEdit.root, selectedNodeId);
                            if (parentNode) {
                                const newNode: MindmapNode = { id: newNodeId, name: "New Node", x: 0, y: 0, width: 0, height: 0, level: 0 };
                                if (!parentNode.children) parentNode.children = [];
                                parentNode.children.push(newNode);
                                parentNode.isCollapsed = false;
                            }
                            return newMaps;
                        });
                        setSelectedNodeId(newNodeId);
                        setTimeout(() => handleEditNode(newNodeId), 50);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedNodeId, activeMapLayout, handleEditNode, activeMapIndex, editingCardNodeId, viewingCard, updateCurrentMaps, handleDeleteNode]);

    const editingCardNode = useMemo(() => {
        if (!editingCardNodeId || !activeMapLayout) return null;
        return findNodeById(activeMapLayout, editingCardNodeId);
    }, [editingCardNodeId, activeMapLayout]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="mindmap-main-layout">
            <Toolbar 
                // FIX: Cannot find name 'onNewMap'.
                onNewMap={handleNewMap}
                onUndo={handleUndo} 
                onRedo={handleRedo} 
                canUndo={canUndo} 
                canRedo={canRedo} 
                isSidebarVisible={isSidebarVisible}
                onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                onExportPNG={handleExportPNG}
                onExportHTML={handleExportHTML}
                selectedNodeId={selectedNodeId}
                onAddChildNode={handleAddChildNode}
                onDeleteNode={handleDeleteNode}
                onEditNode={() => handleEditNode(selectedNodeId)}
                onEditCard={() => handleOpenCardEditor(selectedNodeId)}
                onCenterView={handleCenterView}
                onExtendNode={handleExtendNode}
                isLoadingAI={isLoadingAI}
            />

            <main ref={mainContentRef} className="mindmap-main-content" onClick={(e) => {
                if (e.target === mainContentRef.current) handleNodeSelect(null);
            }}>
                <MindmapCanvas 
                    ref={canvasRef}
                    activeMapData={activeMapLayout}
                    activeTheme={activeMap.theme}
                    activeFont={activeMap.font}
                    transform={transform}
                    setTransform={setTransform}
                    selectedNodeId={selectedNodeId}
                    editingNodeId={editingNode?.id || null}
                    onNodeSelect={handleNodeSelect}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onToggleCollapse={handleToggleCollapse}
                    onNodeCardView={handleViewCard}
                />
                {editingNode && (
                    <textarea
                        className="mindmap-node-editor"
                        style={{
                            left: editingNode.x,
                            top: editingNode.y,
                            width: editingNode.width,
                            height: editingNode.height,
                            fontSize: activeMapLayout?.level === 0 ? '16px' : '14px',
                            fontWeight: activeMap.font === 'Playfair Display' ? '700' : '500',
                            fontFamily: `'${activeMap.font}', sans-serif`,
                            padding: editingNode.height > 40 ? '15px 20px' : '10px 20px',
                        }}
                        defaultValue={editingNode.name}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => handleUpdateNodeName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleUpdateNodeName(e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                                setEditingNode(null);
                            }
                        }}
                    />
                )}
                 {editingCardNodeId && editingCardNode && (
                    <div className="card-editor-overlay" onClick={() => setEditingCardNodeId(null)}>
                        <div onClick={e => e.stopPropagation()}>
                            <CardEditor 
                                node={editingCardNode}
                                onSave={handleSaveCardContent}
                                onClose={() => setEditingCardNodeId(null)}
                            />
                        </div>
                    </div>
                )}
                 {viewingCard && (
                    <div className="card-viewer-overlay" onClick={() => setViewingCard(null)}>
                        <div onClick={e => e.stopPropagation()}>
                            <CardViewer 
                                node={viewingCard.node}
                                position={viewingCard.position}
                                onEdit={handleEditFromViewer}
                                onClose={() => setViewingCard(null)}
                            />
                        </div>
                    </div>
                )}
            </main>
            
            {isSidebarVisible && (
                <StyleSidebar
                    themes={Object.keys(COLOR_THEMES)}
                    activeTheme={activeMap.theme}
                    onSetTheme={handleSetTheme}
                    fonts={fonts}
                    activeFont={activeMap.font}
                    onSetFont={handleSetFont}
                    activeLayout={activeMap.layout}
                    onSetLayout={handleSetLayout}
                />
            )}
            
            <footer className="mindmap-bottom-bar">
                <div className="map-tabs">
                    {maps.map((_, index) => (
                        <button key={index} className={`map-tab ${index === activeMapIndex ? 'active' : ''}`} onClick={() => { setActiveMapIndex(index); setSelectedNodeId(null); }}>
                            Map {index + 1}
                        </button>
                    ))}
                </div>
                <div className="zoom-controls">
                    <button onClick={() => setTransform(t => ({...t, scale: Math.max(0.2, t.scale - 0.1)}))} title="Zoom Out"><Minus className="w-5 h-5"/></button>
                    <span>{Math.round(transform.scale * 100)}%</span>
                    <button onClick={() => setTransform(t => ({...t, scale: Math.min(2, t.scale + 0.1)}))} title="Zoom In"><Plus className="w-5 h-5"/></button>
                </div>
            </footer>
        </div>
    );
};
