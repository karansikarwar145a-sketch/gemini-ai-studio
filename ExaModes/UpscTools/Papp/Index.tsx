



import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { FLTApp } from './flt.tsx';
import './Index.css';

declare var marked: any;

export type QuizQuestion = {
    question: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    pyq_year?: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
};

export type QuizResult = {
    id: string;
    title: string;
    questions: QuizQuestion[];
    userAnswers: Array<string | null>;
    score: number;
    total: number;
    markedForReview?: number[];
};


type QuizState = 'config' | 'generating' | 'active' | 'finished';
type AppMode = 'quiz' | 'flt';
type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-review' | 'answered-review';

const formatQuizResultAsMarkdown = (result: QuizResult): string => {
    let content = `# Quiz Results: ${result.title}\n\n`;
    content += `**Final Score:** ${result.score} / ${result.total}\n\n---\n\n`;

    result.questions.forEach((q, i) => {
        const userAnswer = result.userAnswers[i];
        const isCorrect = userAnswer === q.correct_answer;
        const wasMarked = result.markedForReview?.includes(i);

        let questionTitle = `## Question ${i + 1}`;
        if (q.pyq_year) {
            questionTitle += ` (PYQ ${q.pyq_year})`;
        }
        if (q.difficulty) {
            questionTitle += ` - Difficulty: ${q.difficulty}`;
        }
        if (wasMarked) {
             questionTitle += ` (Marked for Review)`;
        }
        content += `${questionTitle}\n\n`;

        content += `${q.question}\n\n`;
        content += `**Options:**\n`;
        q.options.forEach(opt => content += `- ${opt}\n`);
        content += `\n`;
        content += `**Your Answer:** ${userAnswer || 'Not Answered'}\n`;
        content += `**Correct Answer:** ${q.correct_answer}\n`;
        content += `**Result:** ${isCorrect ? 'Correct' : 'Incorrect'}\n\n`;
        if (q.explanation) {
            content += `**Explanation:**\n${q.explanation}\n\n`;
        }
        content += `---\n\n`;
    });

    return content;
};

const ProgressBar: React.FC<{ current: number; total: number; status: string }> = ({ current, total, status }) => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    return (
        <div className="card progress-container" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Quiz Generation Progress">
            <p className="progress-status">{status}</p>
            <div className="progress-bar-track">
                <div 
                    className={`progress-bar-fill`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const ScoreGauge: React.FC<{ score: number; maxScore: number; }> = ({ score, maxScore }) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    let barColorClass = 'score-gauge-fill-good';
    if (percentage < 75) barColorClass = 'score-gauge-fill-medium';
    if (percentage < 40) barColorClass = 'score-gauge-fill-low';

    return (
        <div className="score-container">
            <div className="score-header">
                <p className="score-text">Final Score: <strong>{score} / {maxScore}</strong></p>
            </div>
            <div className="score-gauge" aria-label={`Score: ${score} out of ${maxScore}`}>
                <div 
                    className={`score-gauge-fill ${barColorClass}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};


export const PrelimsApp: React.FC<{
    onQuizComplete?: (result: QuizResult) => void;
    initialData?: QuizResult | null;
    initialTopic?: string | null;
}> = ({ onQuizComplete, initialData, initialTopic }) => {
    const [appMode, setAppMode] = useState<AppMode>('quiz');
    const [quizState, setQuizState] = useState<QuizState>(initialData ? 'finished' : 'config');
    const [quizPrompt, setQuizPrompt] = useState(initialTopic ? `A quiz on ${initialTopic}` : 'Include at least 2 PYQs.');
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Medium');
    const [inputMode, setInputMode] = useState<'text' | 'manual' | 'both'>(initialTopic ? 'text' : 'text');
    
    const [manualSubject, setManualSubject] = useState('Indian Polity');
    const [manualTopic, setManualTopic] = useState('');
    const [manualSubTopic, setManualSubTopic] = useState('');
    const [manualMicroTopic, setManualMicroTopic] = useState('');

    const [questions, setQuestions] = useState<QuizQuestion[]>(initialData?.questions || []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Array<string | null>>(initialData?.userAnswers || []);
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(
        initialData?.markedForReview ? new Set(initialData.markedForReview) : new Set()
    );
    const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 10, status: '' });
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const progressIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI", e);
            setError("Could not initialize AI. Please check your API key setup.");
        }
        
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        }
    }, []);
    
    useEffect(() => {
        if (initialData) {
            setQuestions(initialData.questions);
            setUserAnswers(initialData.userAnswers);
             setMarkedForReview(initialData.markedForReview ? new Set(initialData.markedForReview) : new Set());
            const visited = new Set<number>();
            initialData.userAnswers.forEach((_, i) => visited.add(i));
            setVisitedQuestions(visited);
            setQuizState('finished');
            setAppMode('quiz');
        }
    }, [initialData]);

    const handleGenerateQuiz = async () => {
        if (!aiRef.current) {
            setError('AI service is not initialized.');
            return;
        }

        let finalQuizRequest = '';

        if (inputMode === 'text') {
            if (!quizPrompt.trim()) {
                setError('Please enter a description for the quiz.');
                return;
            }
            finalQuizRequest = `Generate a ${numQuestions}-question quiz. ${quizPrompt}`;
        } else {
            const manualParts = [
                manualSubject && `Subject: ${manualSubject}`,
                manualTopic && `Topic: ${manualTopic}`,
                manualSubTopic && `Sub-Topic: ${manualSubTopic}`,
                manualMicroTopic && `Micro-Topic: ${manualMicroTopic}`,
            ].filter(Boolean).join(', ');

            if (!manualParts) {
                setError('Please specify at least a subject for the quiz.');
                return;
            }

            if (inputMode === 'manual') {
                finalQuizRequest = `Generate a ${numQuestions}-question quiz on ${manualParts}.`;
            } else { // 'both'
                finalQuizRequest = `Generate a ${numQuestions}-question quiz. Additional instructions: "${quizPrompt}". The quiz must strictly cover the following: ${manualParts}.`;
            }
        }

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

        setQuizState('generating');
        setError(null);
        setMarkedForReview(new Set());
        setVisitedQuestions(new Set([0]));
        
        const totalQuestions = numQuestions;
        setProgress({ current: 0, total: totalQuestions, status: 'Preparing to generate quiz...' });

        // Simulate progress
        progressIntervalRef.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev.current >= totalQuestions) {
                    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                    return { ...prev, status: 'Finalizing quiz...' };
                }
                const newCurrent = prev.current + 1;
                return { 
                    ...prev, 
                    current: newCurrent, 
                    status: `Generating question ${newCurrent} of ${totalQuestions}...` 
                };
            });
        }, 1200);

        let difficultyInstruction = `**Difficulty Level:** "${difficulty}"`;
        if (difficulty === 'Mixed') {
            difficultyInstruction = `**Difficulty Level:** "A mix of Easy, Medium, and Hard questions."`;
        }

        const prompt = `
            You are a subject matter expert and quiz creator for the UPSC Civil Services Preliminary Examination. Your primary task is to generate a high-quality, multiple-choice quiz that is STRICTLY focused on the user's requested topic, mimicking the complexity and variety of the real exam.

            **User Request:** "${finalQuizRequest}"
            ${difficultyInstruction}

            **CRITICAL INSTRUCTIONS:**
            1.  **TOPIC ADHERENCE IS PARAMOUNT:** You MUST generate questions ONLY from the subject and topic specified in the "User Request". Do not include questions from other topics, even if they are related. For example, if the user asks for "Fundamental Rights", do not include questions about "Directive Principles of State Policy".
            2.  **QUESTION VARIETY & ANALYTICAL DEPTH (MOST IMPORTANT):** You MUST generate a diverse mix of question types to truly test the aspirant's analytical abilities, not just factual recall. The quiz must include:
                *   **Statement-Based Questions:** Questions with multiple statements where options are like "1 only", "1 and 2 only", "All of the above", "None of the above".
                *   **"How many of the above..." Questions:** The recent UPSC pattern. The question provides several pairs or statements, and the options are "Only one", "Only two", "All three", "None". This requires precise knowledge of all items.
                *   **Assertion and Reason (A/R) Questions:** The question text should contain an 'Assertion (A)' and a 'Reason (R)'. The options must be the standard four choices for A/R questions.
                *   **Match-the-List Questions:** The question text should contain two lists (e.g., List-I and List-II) to be matched. The options should be the coded answer choices.
                *   **Chronological Order Questions:** Ask to arrange historical events, policies, or legal acts in the correct time sequence.
                *   **Map-Based / Location Questions:** Questions testing geographical knowledge, such as arranging rivers from North to South, or identifying which national park a particular river flows through.
                *   **Conceptual & Analytical MCQs:** Standard MCQs that require deep understanding and application of concepts, not just direct recall.
            3.  **Use Google Search:** You **must** use Google Search for up-to-date information, especially for dynamic topics like Current Affairs, Economy, and Science & Tech.
            4.  **PYQ Identification:** If the user requests Previous Year Questions (PYQs), you must identify them accurately. Provide the year in the "pyq_year" field. If it's not a PYQ, this field should be omitted or null.
            5.  **Strict JSON Output:** Your entire response MUST be a single, valid JSON array of question objects. Do not include any text, comments, or markdown formatting (like \`\`\`json\`) outside of the main JSON array. The raw response body must be parsable as JSON. Each object in the array must have the following structure:
                - \`question\`: (string) The full text of the question, formatted with Markdown for readability.
                    - **For Assertion/Reason questions:** You MUST format the question with "**Assertion (A):**" and "**Reason (R):**" on separate lines. Use bold for the labels. Example: \`**Assertion (A):** The sky is blue.\\n**Reason (R):** The atmosphere scatters blue light more than other colors.\`
                    - **For Match-the-List questions:** You MUST format the lists as a Markdown table with two columns. Example: \`| List I | List II |\\n|---|---|\\n| A. Item 1 | 1. Match 1 |\\n| B. Item 2 | 2. Match 2 |\`
                - \`options\`: (string array) An array of exactly 4 possible answer strings.
                - \`correct_answer\`: (string) The correct answer, which must exactly match one of the strings in the 'options' array.
                - \`explanation\`: (string) A detailed explanation for why the correct answer is right and the others are wrong. This is mandatory.
                - \`pyq_year\`: (number or null) If the question is a PYQ, provide the year. Otherwise, this field should be omitted or null.
                - \`difficulty\`: (string) One of 'Easy', 'Medium', or 'Hard'.
        `;

        try {
            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });

            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setProgress({ current: totalQuestions, total: totalQuestions, status: 'Quiz generated!' });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let responseText = response.text.trim();
            const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```|(\[[\s\S]*\])/s);

            if (!jsonMatch) {
                throw new Error("Could not find a valid JSON array in the AI response.");
            }
            
            const jsonString = jsonMatch[1] || jsonMatch[2];
            const quizData = JSON.parse(jsonString);
            
            setQuestions(quizData);
            setUserAnswers(new Array(quizData.length).fill(null));
            setCurrentQuestionIndex(0);
            setQuizState('active');
        } catch (err) {
            console.error("Quiz generation failed:", err);
            setError("Sorry, an error occurred while generating the quiz. The AI response may have been invalid or in an unexpected format. Please try a different topic or try again later.");
            setQuizState('config');
        } finally {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        }
    };

    const handleFinishQuiz = () => {
        if (!initialData && onQuizComplete) {
            const score = userAnswers.filter((ans, i) => ans === questions[i].correct_answer).length;
             let title = 'Quiz';
             if (inputMode !== 'text' && manualSubject) {
                 title = `${manualSubject} Quiz`;
             } else if (inputMode !== 'manual' && quizPrompt) {
                 title = quizPrompt.substring(0, 30) + (quizPrompt.length > 30 ? '...' : '');
             }
             
             onQuizComplete({
                id: `quiz-${Date.now()}`,
                title: title,
                questions: questions,
                userAnswers: userAnswers,
                score: score,
                total: questions.length,
                markedForReview: Array.from(markedForReview),
             });
        }
        setQuizState('finished');
    };
    
    const handleAnswerSelect = (option: string) => {
        if (userAnswers[currentQuestionIndex] !== null) return; // Prevent changing answer
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = option;
        setUserAnswers(newAnswers);
    };

    const handleReset = () => {
        setAppMode('quiz');
        setQuizState('config');
        setQuestions([]);
        setUserAnswers([]);
        setCurrentQuestionIndex(0);
        setError(null);
    };

    const handleFltComplete = (result: QuizResult) => {
        if (onQuizComplete) {
            onQuizComplete(result);
        }
        setAppMode('quiz');
    };
    
    const handleExport = () => {
        setIsDownloading(true);
        const score = userAnswers.filter((ans, i) => ans === questions[i].correct_answer).length;
        const resultToExport: QuizResult = {
            id: initialData?.id || `quiz-${Date.now()}`,
            title: initialData?.title || 'Quiz',
            questions: questions,
            userAnswers: userAnswers,
            score: score,
            total: questions.length,
            markedForReview: Array.from(markedForReview)
        };
        const markdownContent = formatQuizResultAsMarkdown(resultToExport);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${resultToExport.title.replace(/\s+/g, '_')}_Results.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
    };

    const handleNavigation = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < questions.length) {
            setVisitedQuestions(prev => new Set(prev).add(newIndex));
            setCurrentQuestionIndex(newIndex);
            setIsExplanationVisible(false);
            setIsPaletteOpen(false);
        }
    };

    const handleMarkForReview = () => {
        setMarkedForReview(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentQuestionIndex)) {
                newSet.delete(currentQuestionIndex);
            } else {
                newSet.add(currentQuestionIndex);
            }
            return newSet;
        });
    };

    const getQuestionStatus = (index: number): QuestionStatus => {
        const isAnswered = userAnswers[index] !== null;
        const isMarked = markedForReview.has(index);
        const isVisited = visitedQuestions.has(index);

        if (isAnswered && isMarked) return 'answered-review';
        if (isAnswered) return 'answered';
        if (isMarked) return 'marked-review';
        if (isVisited) return 'not-answered';
        return 'not-visited';
    };


    const renderQuizContent = () => {
        switch (quizState) {
            case 'config':
                return (
                    <>
                    <div className="card quiz-config-container">
                        <div className="quiz-setup-header">
                            <h2 className="font-serif">Prelims Quiz Generator</h2>
                            <p className="subtitle">Use a text prompt, manual topic selection, or both to create your perfect quiz.</p>
                        </div>
                        <div className="quiz-config-form">
                             <div className="manual-inputs-container">
                                <div className="form-group">
                                    <label htmlFor="numQuestions">Number of Questions</label>
                                    <select id="numQuestions" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                        <option value={20}>20</option>
                                        <option value={30}>30</option>
                                        <option value={40}>40</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="difficulty">Difficulty Level</label>
                                    <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard' | 'Mixed')}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Input Method</label>
                                <div className="input-mode-selector">
                                    <button className={inputMode === 'text' ? 'active' : ''} onClick={() => setInputMode('text')}>Text Prompt</button>
                                    <button className={inputMode === 'manual' ? 'active' : ''} onClick={() => setInputMode('manual')}>Manual Topic</button>
                                    <button className={inputMode === 'both' ? 'active' : ''} onClick={() => setInputMode('both')}>Both</button>
                                </div>
                            </div>
                            
                            {inputMode !== 'text' && (
                                <div className="manual-inputs-container">
                                    <div className="form-group">
                                        <label htmlFor="manualSubject">Subject</label>
                                        <input type="text" id="manualSubject" value={manualSubject} onChange={e => setManualSubject(e.target.value)} placeholder="e.g., Indian Polity"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="manualTopic">Topic</label>
                                        <input type="text" id="manualTopic" value={manualTopic} onChange={e => setManualTopic(e.target.value)} placeholder="e.g., Parliament"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="manualSubTopic">Sub-Topic</label>
                                        <input type="text" id="manualSubTopic" value={manualSubTopic} onChange={e => setManualSubTopic(e.target.value)} placeholder="e.g., Rajya Sabha"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="manualMicroTopic">Micro-Topic</label>
                                        <input type="text" id="manualMicroTopic" value={manualMicroTopic} onChange={e => setManualMicroTopic(e.target.value)} placeholder="e.g., Powers of the Chairman"/>
                                    </div>
                                </div>
                            )}

                            {inputMode !== 'manual' && (
                                <div className="form-group">
                                    <label htmlFor="quizPrompt">
                                        {inputMode === 'text' ? 'Quiz Description' : 'Additional Instructions'}
                                    </label>
                                    <textarea
                                        id="quizPrompt"
                                        rows={3}
                                        value={quizPrompt}
                                        onChange={(e) => setQuizPrompt(e.target.value)}
                                        placeholder={
                                            inputMode === 'text' 
                                            ? "e.g., A quiz on modern Indian history from 1857 to 1947."
                                            : "e.g., Focus on statement-based questions."
                                        }
                                    />
                                </div>
                            )}

                            <button className="action-button primary large" onClick={handleGenerateQuiz}>Generate with AI</button>
                        </div>
                    </div>
                    <div className="card flt-promo-card">
                         <h3>Full-Length Test Simulator</h3>
                         <p>Experience a real-time UPSC Prelims simulation with 100 questions and a 2-hour timer.</p>
                         <button className="action-button secondary" onClick={() => setAppMode('flt')}>Start GS Paper I Test</button>
                    </div>
                    </>
                );
            case 'generating':
                return <ProgressBar current={progress.current} total={progress.total} status={progress.status} />;
            case 'active':
                const currentQuestion = questions[currentQuestionIndex];
                const userAnswer = userAnswers[currentQuestionIndex];
                return (
                    <>
                    {isPaletteOpen && (
                        <div className="question-palette-overlay" onClick={() => setIsPaletteOpen(false)}>
                            <div className="question-palette-container" onClick={e => e.stopPropagation()}>
                               <h3>Question Palette</h3>
                               <div className="palette-legend">
                                   <div><span className="legend-box answered"></span> Answered</div>
                                   <div><span className="legend-box not-answered"></span> Not Answered</div>
                                   <div><span className="legend-box marked-review"></span> Marked for Review</div>
                                   <div><span className="legend-box answered-review"></span> Answered & Marked</div>
                                   <div><span className="legend-box not-visited"></span> Not Visited</div>
                               </div>
                               <div className="question-palette-grid">
                                   {questions.map((_, i) => (
                                       <button 
                                         key={i} 
                                         className={`palette-btn ${getQuestionStatus(i)} ${i === currentQuestionIndex ? 'current' : ''}`}
                                         onClick={() => handleNavigation(i)}
                                        >
                                           {i + 1}
                                       </button>
                                   ))}
                               </div>
                            </div>
                        </div>
                    )}
                    <div className="card quiz-question-container">
                        <div className="question-header">
                            <span className="question-counter">Question {currentQuestionIndex + 1} of {questions.length}</span>
                             <div className="question-tags">
                                {currentQuestion.difficulty && <span className={`difficulty-badge difficulty-${currentQuestion.difficulty.toLowerCase()}`}>{currentQuestion.difficulty}</span>}
                                {currentQuestion.pyq_year && <span className="pyq-badge">PYQ {currentQuestion.pyq_year}</span>}
                            </div>
                            <button className="action-button secondary palette-toggle" onClick={() => setIsPaletteOpen(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                                Palette
                            </button>
                        </div>
                        <div className="question-text markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(currentQuestion.question) }}></div>
                        <div className="options-grid">
                            {currentQuestion.options.map((opt, i) => {
                                let cardClass = 'option-card';
                                if (userAnswer) {
                                    const isCorrect = opt === currentQuestion.correct_answer;
                                    const isSelected = opt === userAnswer;
                                
                                    if (isSelected) {
                                        cardClass += isCorrect ? ' correct' : ' incorrect';
                                    } else if (userAnswer !== currentQuestion.correct_answer && isCorrect) {
                                        cardClass += ' correct-unselected';
                                    }
                                }
                                
                                return (
                                    <button key={i} className={cardClass} onClick={() => handleAnswerSelect(opt)} disabled={!!userAnswer}>
                                        <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                                        <span className="option-text">{opt.trim().replace(/^[a-d][.)]\s*/i, '')}</span>
                                         {userAnswer && (
                                            <span className="option-icon">
                                                {opt === currentQuestion.correct_answer && <span className="correct-icon">✓</span>}
                                                {opt !== currentQuestion.correct_answer && opt === userAnswer && <span className="incorrect-icon">✗</span>}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {userAnswer && currentQuestion.explanation && (
                            <div className="explanation-container">
                                <button
                                    className="action-button secondary"
                                    onClick={() => setIsExplanationVisible(p => !p)}
                                    aria-expanded={isExplanationVisible}
                                >
                                    {isExplanationVisible ? 'Hide Explanation' : 'Show Explanation'}
                                </button>
                                {isExplanationVisible && (
                                    <div className="explanation-box">
                                        <h3>Explanation</h3>
                                        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(currentQuestion.explanation) }}></div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="quiz-nav">
                             <div className="quiz-nav-group left">
                                <button className="action-button secondary" onClick={() => handleNavigation(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>Previous</button>
                             </div>
                             <div className="quiz-nav-group center">
                                <button 
                                    className={`action-button secondary ${markedForReview.has(currentQuestionIndex) ? 'active' : ''}`} 
                                    onClick={handleMarkForReview}
                                >
                                    {markedForReview.has(currentQuestionIndex) ? 'Unmark Review' : 'Mark for Review'}
                                </button>
                             </div>
                             <div className="quiz-nav-group right">
                                {currentQuestionIndex < questions.length - 1 ? (
                                    userAnswer ? (
                                        <button className="action-button primary" onClick={() => handleNavigation(currentQuestionIndex + 1)}>Next</button>
                                    ) : (
                                        <button className="action-button secondary" onClick={() => handleNavigation(currentQuestionIndex + 1)}>Skip</button>
                                    )
                                ) : (
                                    userAnswer ? (
                                        <button className="action-button primary" onClick={handleFinishQuiz}>Finish Quiz</button>
                                    ) : (
                                        <button className="action-button secondary" onClick={handleFinishQuiz}>Skip & Finish</button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                    </>
                );
            case 'finished':
                const score = userAnswers.filter((ans, i) => ans === questions[i].correct_answer).length;

                return (
                    <div className="card quiz-results-container">
                        <div className="results-summary">
                            <h2>{initialData?.title || 'Quiz Complete!'}</h2>
                            <ScoreGauge score={score} maxScore={questions.length} />
                        </div>

                        <div className="accordion" style={{textAlign: 'left', marginTop: '2rem'}}>
                            {questions.map((q, i) => {
                                const isCorrect = userAnswers[i] === q.correct_answer;
                                const wasMarked = markedForReview.has(i);
                                return (
                                    <div className="accordion-item" key={i}>
                                        <div className="accordion-header">
                                            <span className={`review-question-header ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                {`Q${i+1}: ${isCorrect ? 'Correct' : 'Incorrect'}`}
                                            </span>
                                             <div className="question-tags">
                                                {wasMarked && <span className="review-badge">Marked</span>}
                                                {q.difficulty && <span className={`difficulty-badge difficulty-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>}
                                                {q.pyq_year && <span className="pyq-badge">PYQ {q.pyq_year}</span>}
                                            </div>
                                        </div>
                                        <div className="accordion-content" style={{padding: '1.5rem'}}>
                                            <div className="question-text markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(q.question)}}></div>
                                            <p><strong>Your Answer:</strong> {userAnswers[i] || 'Not Answered'}</p>
                                            <p><strong>Correct Answer:</strong> {q.correct_answer}</p>
                                            {q.explanation && (
                                                <div className="explanation-box" style={{marginTop: '1rem'}}>
                                                    <h3>Explanation</h3>
                                                    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(q.explanation) }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="results-actions">
                             <button className="action-button secondary" onClick={handleExport} disabled={isDownloading}>
                                {isDownloading ? 'Exporting...' : 'Export Results'}
                            </button>
                            <button className="action-button primary" onClick={handleReset}>Take New Quiz</button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="quiz-container">
            {error && appMode === 'quiz' && <div className="card error" role="alert">{error}</div>}
            {appMode === 'quiz' ? renderQuizContent() : <FLTApp onTestComplete={handleFltComplete} />}
        </div>
    );
};