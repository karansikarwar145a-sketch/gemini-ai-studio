import React, { useState, useRef } from 'react';
import { Mode, GroundingSource } from '../../../types';
import { generateResponse } from '../../../services/geminiService';
import { Search, ArrowRight, Paperclip, Link, X } from '../../../components/icons';
import { Loader } from '../../../components/Loader';
import './Index.css';

declare var marked: any;

const EXAMPLE_SEARCHES = [
    "Impact of El Niño on Indian monsoon",
    "Role of the Governor in Indian polity",
    "Significance of the G20 summit for India",
    "Challenges of urban planning in India"
];

const SearchSkeleton: React.FC = () => (
    <div className="search-results-view">
        <div className="search-header-results" style={{ borderBottom: 'none' }}>
            {/* Skeleton for header can be minimal */}
        </div>
        <div className="search-summary-container skeleton search-skeleton-summary"></div>
        <div className="search-sources-container">
            <div className="skeleton" style={{ height: '2rem', width: '40%', marginBottom: '1.5rem' }}></div>
            <div className="search-sources-list">
                <div className="skeleton search-skeleton-source"></div>
                <div className="skeleton search-skeleton-source"></div>
                <div className="skeleton search-skeleton-source"></div>
            </div>
        </div>
    </div>
);


export const InvictusSearchApp: React.FC = () => {
    const [query, setQuery] = useState('');
    const [url, setUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchResult, setSearchResult] = useState<{ text: string; sources: GroundingSource[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setUrl(''); // Can't have both
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (e.target.value) {
            removeImage(); // Can't have both
        }
    }
    
    const removeUrl = () => {
        setUrl('');
    };

    const handleSubmit = async (searchQuery: string) => {
        let finalQuery = searchQuery;
        if (url.trim()) {
            finalQuery = `Based on the content of this URL: ${url.trim()}\n\n${searchQuery}`;
        }

        if (!finalQuery.trim() && !imageFile) return;

        setIsLoading(true);
        setError(null);
        setSearchResult(null);
        setQuery(searchQuery);

        try {
            let fullText = "";
            let allSources: GroundingSource[] = [];
            const sourceMap = new Map<string, GroundingSource>();
            
            const stream = generateResponse(Mode.InvictusSearch, finalQuery, imageFile ?? undefined);

            for await (const chunk of stream) {
                if (typeof chunk === 'string') {
                    fullText += chunk;
                } else if (chunk && 'sources' in chunk) {
                    chunk.sources.forEach(source => {
                        if (source.uri && !sourceMap.has(source.uri)) {
                            sourceMap.set(source.uri, source);
                        }
                    });
                }
                
                allSources = Array.from(sourceMap.values());
                setSearchResult({ text: fullText, sources: allSources });
            }

        } catch (e) {
            console.error(e);
            setError(`An error occurred: ${(e as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(query);
    };
    
    const handleReset = () => {
        setQuery('');
        setUrl('');
        setImageFile(null);
        setImagePreview(null);
        setSearchResult(null);
        setError(null);
        setIsLoading(false);
    };

    if (isLoading) {
        return <SearchSkeleton />;
    }

    if (error) {
        return (
            <div className="card error" role="alert">
                <p>{error}</p>
                <button className="action-button secondary" onClick={handleReset}>New Search</button>
            </div>
        );
    }
    
    if (searchResult) {
        return (
            <div className="invictus-search-container">
                <div className="search-results-view">
                    <header className="search-header-results">
                         <form onSubmit={handleFormSubmit} className="search-input-form-results">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for any topic..."
                            />
                            <button type="submit" disabled={isLoading}>
                                <Search className="w-5 h-5" />
                            </button>
                        </form>
                        <button className="action-button secondary" onClick={handleReset}>New Search</button>
                    </header>
                    
                    <div className="search-summary-container">
                        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(searchResult.text) }}></div>
                    </div>
                    
                    {searchResult.sources.length > 0 && (
                        <div className="search-sources-container">
                            <h3>Sources</h3>
                            <div className="search-sources-list">
                                {searchResult.sources.map((source, index) => (
                                    <a href={source.uri} key={index} target="_blank" rel="noopener noreferrer" className="source-card">
                                        <p className="source-card-title">{source.title || new URL(source.uri).hostname}</p>
                                        <p className="source-card-uri">{source.uri}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="invictus-search-container">
            <div className="search-initial-view">
                <h1 className="font-serif">
                    <Search className="w-10 h-10 search-icon-header" />
                    Invictus Search
                </h1>
                <p>Get AI-powered summaries and sources for any topic.</p>
                
                <form onSubmit={handleFormSubmit} className="search-input-form-wrapper">
                    <div className="search-input-form-main">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask anything, or add an image/URL below..."
                        />
                        <button type="submit" disabled={isLoading || (!query.trim() && !imageFile && !url.trim())} aria-label="Search">
                            {isLoading ? <Loader /> : <ArrowRight className="w-6 h-6" />}
                        </button>
                    </div>

                    <div className="search-addons-container">
                        {imagePreview && (
                            <div className="image-preview-addon">
                                <img src={imagePreview} alt="preview" />
                                <div className="image-info">
                                    <span>{imageFile?.name}</span>
                                    <span className="file-size">{(imageFile?.size ?? 0) / 1024 > 1024 ? `${((imageFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB` : `${((imageFile?.size ?? 0) / 1024).toFixed(2)} KB`}</span>
                                </div>
                                <button type="button" onClick={removeImage} className="remove-addon-btn" aria-label="Remove image"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                         {!imagePreview && (
                            <div className="url-input-addon">
                                <Link className="url-icon" />
                                <input 
                                    type="url" 
                                    value={url} 
                                    onChange={handleUrlInputChange}
                                    placeholder="Or paste a URL to analyze..."
                                    disabled={!!imageFile}
                                />
                                {url && <button type="button" onClick={removeUrl} className="remove-addon-btn" aria-label="Remove URL"><X className="w-4 h-4" /></button>}
                            </div>
                        )}
                    </div>
                    
                    <div className="search-tools">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={!!url} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="tool-btn" disabled={!!url}>
                            <Paperclip className="w-5 h-5"/> Upload Image
                        </button>
                        <span className="tool-helper-text">You can search with text, an image, or a URL.</span>
                    </div>

                </form>

                 <div className="example-searches">
                    {EXAMPLE_SEARCHES.map(ex => (
                        <button key={ex} onClick={() => handleSubmit(ex)}>{ex}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};