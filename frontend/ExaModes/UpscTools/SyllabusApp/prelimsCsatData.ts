import { SyllabusPaper } from './types';

export const prelimsCsatData: SyllabusPaper = {
    title: 'Prelims CSAT',
    subjects: [
        {
            name: 'Comprehension',
            children: [
                { name: 'Reading passages and answering questions based on them.' },
                { name: 'Identifying the main idea/theme of the passage.' },
                { name: 'Drawing inferences and conclusions from the passage.' },
                { name: 'Identifying assumptions and implications.' },
            ]
        },
        {
            name: 'Interpersonal skills including communication skills',
        },
        {
            name: 'Logical Reasoning and Analytical Ability',
            children: [
                { name: 'Syllogism' },
                { name: 'Statement and Assumption, Argument, Course of Action, Conclusion, Cause & Effect' },
                { name: 'Puzzles and Seating Arrangement (Linear, Circular)' },
                { name: 'Coding-Decoding' },
                { name: 'Blood Relations' },
                { name: 'Direction Sense Test' },
                { name: 'Series and Sequences' },
                { name: 'Ranking and Order' },
            ]
        },
        {
            name: 'Decision Making and Problem Solving',
        },
        {
            name: 'General Mental Ability',
            children: [
                { name: 'Calendars and Clocks' },
                { name: 'Venn Diagrams' },
                { name: 'Cubes and Dice' },
            ]
        },
        {
            name: 'Basic Numeracy (Class X level)',
            children: [
                { name: 'Number System' },
                { name: 'LCM and HCF' },
                { name: 'Percentage' },
                { name: 'Profit and Loss' },
                { name: 'Simple and Compound Interest' },
                { name: 'Ratio and Proportion' },
                { name: 'Average' },
                { name: 'Time, Speed, and Distance' },
                { name: 'Time and Work' },
                { name: 'Permutation and Combination' },
                { name: 'Probability' },
                { name: 'Basic Algebra' },
                { name: 'Geometry and Mensuration' },
            ]
        },
        {
            name: 'Data Interpretation (Class X level)',
            children: [
                { name: 'Tables' },
                { name: 'Bar Charts' },
                { name: 'Line Graphs' },
                { name: 'Pie Charts' },
                { name: 'Data Sufficiency' },
            ]
        }
    ]
};
