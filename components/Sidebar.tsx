import React, { useState } from 'react';
import { Mode } from '../types';
import { SIDEBAR_STRUCTURE, MODES } from '../constants';
import { SquarePen, ChevronRight, PanelLeftClose, PanelLeftOpen, BookOpen, Sun, Moon, X } from './icons';

interface SidebarProps {
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onNewChat: () => void;
  theme: string;
  setTheme: (theme: string) => void;
}

// These types are internal to how the sidebar is structured and rendered.
interface SidebarItemDef {
  id: Mode;
  name: string;
}
interface SidebarCategoryDef {
  category: string;
  items?: SidebarItemDef[];
  subCategories?: SidebarCategoryDef[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    activeMode, 
    setActiveMode,
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    onNewChat,
    theme,
    setTheme
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['ExaModes']);

  const isEffectivelyCollapsed = isCollapsed && !isMobileOpen;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const renderItems = (items: SidebarItemDef[]) => {
      return items.map(item => {
        const details = MODES[item.id];
        const isActive = activeMode === item.id;
        return (
            <button
                key={item.id}
                onClick={() => {
                    setActiveMode(item.id);
                    if (isMobileOpen) {
                        setIsMobileOpen(false);
                    }
                }}
                title={isEffectivelyCollapsed ? item.name : ""}
                className={`flex items-center w-full p-3 rounded-lg text-sm transition-colors duration-200 ${
                    isActive 
                        ? 'sidebar-item-active font-medium shadow-md' 
                        : 'text-[var(--text-secondary)] sidebar-item-hover'
                } ${isEffectivelyCollapsed ? 'justify-center' : ''}`}
            >
                {React.cloneElement(details?.icon || <BookOpen />, { className: 'w-5 h-5 flex-shrink-0' })}
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${isEffectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>
                    {item.name}
                </span>
            </button>
        );
      });
  }

  const renderCategoryTree = (categoryDef: SidebarCategoryDef, level: number) => {
    const { category, items, subCategories } = categoryDef;
    const isExpanded = expandedCategories.includes(category);
    const hasContent = (items && items.length > 0) || (subCategories && subCategories.length > 0);

    return (
        <div key={category}>
            {/* Category Header: hidden when collapsed */}
            {!isEffectivelyCollapsed && (
                <button 
                    onClick={() => hasContent && toggleCategory(category)} 
                    className="flex items-center w-full p-2 mt-2 text-left text-sm font-semibold text-[var(--text-secondary)] rounded-md sidebar-item-hover"
                    style={{ paddingLeft: `${8 + level * 16}px` }}
                >
                    <span>{category}</span>
                    {hasContent && <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                </button>
            )}
            
            {/* Items & Sub-categories List */}
            {/* When collapsed, we always want to show content. When expanded, we respect the toggle state. */}
            <div className={`space-y-1 ${!isEffectivelyCollapsed && !isExpanded ? 'hidden' : ''}`}>
                {items && renderItems(items)}
                {subCategories?.map(subCat => renderCategoryTree(subCat, level + 1))}
            </div>
        </div>
    );
  };


  const sidebarContent = (
    <div className="flex-1 flex flex-col p-2 space-y-1 overflow-y-auto min-h-0">
        <button
            onClick={onNewChat}
            className={`flex items-center w-full p-3 rounded-lg text-[var(--text-primary)] sidebar-item-hover transition-colors ${isEffectivelyCollapsed ? 'justify-center' : ''}`}
            title={isEffectivelyCollapsed ? "New Chat" : ""}
        >
            <SquarePen className="w-6 h-6 flex-shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${isEffectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3 font-semibold'}`}>
                New Chat
            </span>
        </button>
        
        <div className={`pt-2 pb-10 ${isEffectivelyCollapsed ? '' : 'space-y-1'}`}>
            {(SIDEBAR_STRUCTURE as SidebarCategoryDef[]).map((category) => renderCategoryTree(category, 0))}
        </div>
      </div>
  );
  
  const sidebarFooter = (
      <div className="p-2 border-t border-[var(--border-color)] flex-shrink-0">
         <button 
          onClick={toggleTheme}
          className={`flex items-center w-full p-3 rounded-lg text-[var(--text-secondary)] sidebar-item-hover transition-colors ${isEffectivelyCollapsed ? 'justify-center' : ''}`}
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
             <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${isEffectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
        </button>
        <button 
          onClick={isMobileOpen ? () => setIsMobileOpen(false) : () => setIsCollapsed(!isCollapsed)}
          className={`flex items-center w-full p-3 rounded-lg text-[var(--text-secondary)] sidebar-item-hover transition-colors ${isEffectivelyCollapsed ? 'justify-center' : ''}`}
          title={isMobileOpen ? "Close menu" : (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar")}
        >
            {isMobileOpen 
                ? <X className="w-6 h-6" /> 
                : (isCollapsed ? <PanelLeftOpen className="w-6 h-6" /> : <PanelLeftClose className="w-6 h-6" />)
            }
             <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${isEffectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>
                {isMobileOpen ? 'Close' : 'Collapse'}
            </span>
        </button>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />
      
      {/* Sidebar Navigation */}
      <nav className={`
        sidebar flex flex-col border-r 
        transition-all duration-300 ease-in-out
        fixed md:static inset-y-0 left-0 z-50
        w-72 /* Base width for mobile menu */
        ${isCollapsed ? 'md:w-20' : 'md:w-72'} /* Desktop widths */
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} /* Mobile position */
        md:translate-x-0 /* Keep on screen for desktop */
      `}>
        {sidebarContent}
        {sidebarFooter}
      </nav>
    </>
  );
};