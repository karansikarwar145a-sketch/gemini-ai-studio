import React from 'react';
import { FileText, CheckSquare, ClipboardList, Link, Tag, Image, FunctionSquare } from '../../components/icons';

type ContextMenuProps = {
    x: number;
    y: number;
    onAction: (action: string) => void;
};

const menuItems = [
    { id: 'note', label: 'Note', icon: <FileText className="w-5 h-5" /> },
    { id: 'todo', label: 'To-Do', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'task', label: 'Task', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'hyperlink', label: 'Hyperlink', icon: <Link className="w-5 h-5" /> },
    { id: 'label', label: 'Label', icon: <Tag className="w-5 h-5" /> },
    { id: 'image', label: 'Image', icon: <Image className="w-5 h-5" /> },
    { id: 'equation', label: 'Equation', icon: <FunctionSquare className="w-5 h-5" /> },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onAction }) => {
    return (
        <div className="context-menu" style={{ top: y, left: x }}>
            {menuItems.map(item => (
                <button key={item.id} className="context-menu-item" onClick={() => onAction(item.id)}>
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};
