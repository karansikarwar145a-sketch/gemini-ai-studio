export type TimelineEvent = {
    year: number;
    title: string;
    description: string;
    period: '1700-1857' | '1857-1947' | '1947-Present';
};

export const historyData: TimelineEvent[] = [
    {
        year: 1757,
        title: 'Battle of Plassey',
        description: 'The British East India Company, led by Robert Clive, defeats the Nawab of Bengal, marking the beginning of Company rule in India.',
        period: '1700-1857',
    },
    {
        year: 1764,
        title: 'Battle of Buxar',
        description: 'The Company defeats the combined forces of the Mughal Emperor, Nawab of Awadh, and Nawab of Bengal, consolidating its power.',
        period: '1700-1857',
    },
    {
        year: 1773,
        title: 'Regulating Act of 1773',
        description: 'The first step by the British government to regulate the affairs of the East India Company. It established the post of Governor-General of Bengal.',
        period: '1700-1857',
    },
    {
        year: 1829,
        title: 'Abolition of Sati',
        description: 'Governor-General Lord William Bentinck, influenced by social reformers like Raja Ram Mohan Roy, abolishes the practice of Sati.',
        period: '1700-1857',
    },
    {
        year: 1853,
        title: 'First Railway Line',
        description: 'The first passenger railway line in India is established between Bombay (Mumbai) and Thane, revolutionizing transport.',
        period: '1700-1857',
    },
    {
        year: 1857,
        title: 'Revolt of 1857 (Sepoy Mutiny)',
        description: 'A major, but ultimately unsuccessful, uprising against the rule of the British East India Company, which functioned as a sovereign power on behalf of the British Crown.',
        period: '1857-1947',
    },
    {
        year: 1858,
        title: 'Government of India Act 1858',
        description: 'Following the Revolt, the rule of the East India Company is transferred to the British Crown, establishing the British Raj.',
        period: '1857-1947',
    },
    {
        year: 1885,
        title: 'Formation of Indian National Congress',
        description: 'The INC is founded by Allan Octavian Hume to form a platform for civil and political dialogue among educated Indians.',
        period: '1857-1947',
    },
    {
        year: 1905,
        title: 'Partition of Bengal',
        description: 'Viceroy Curzon partitions Bengal, leading to widespread protests and the launch of the Swadeshi movement.',
        period: '1857-1947',
    },
    {
        year: 1915,
        title: 'Gandhi returns to India',
        description: 'Mahatma Gandhi returns to India from South Africa, bringing his philosophy of Satyagraha to the Indian freedom struggle.',
        period: '1857-1947',
    },
    {
        year: 1919,
        title: 'Jallianwala Bagh Massacre',
        description: 'British troops fire on a large crowd of unarmed Indians in Amritsar, a turning point that fueled the independence movement.',
        period: '1857-1947',
    },
    {
        year: 1920,
        title: 'Non-Cooperation Movement',
        description: 'Gandhi launches his first large-scale civil disobedience movement against British rule.',
        period: '1857-1947',
    },
    {
        year: 1930,
        title: 'Dandi March (Salt March)',
        description: 'Gandhi leads a march to the sea to protest the British salt tax, initiating the Civil Disobedience Movement.',
        period: '1857-1947',
    },
    {
        year: 1942,
        title: 'Quit India Movement',
        description: 'The INC launches a mass protest demanding an end to British rule in India, with the slogan "Do or Die".',
        period: '1857-1947',
    },
    {
        year: 1947,
        title: 'Independence and Partition',
        description: 'India gains independence from British rule. The country is partitioned into India and Pakistan, leading to widespread violence.',
        period: '1947-Present',
    },
    {
        year: 1950,
        title: 'Constitution of India Adopted',
        description: 'The Constitution of India comes into effect, declaring India a sovereign, socialist, secular, and democratic republic.',
        period: '1947-Present',
    },
    {
        year: 1956,
        title: 'States Reorganisation Act',
        description: 'Indian states are reorganized on a linguistic basis, reshaping the political map of the country.',
        period: '1947-Present',
    },
    {
        year: 1962,
        title: 'Sino-Indian War',
        description: 'A border dispute between India and China escalates into a brief but decisive war, which India loses.',
        period: '1947-Present',
    },
    {
        year: 1975,
        title: 'The Emergency',
        description: 'Prime Minister Indira Gandhi declares a state of emergency, suspending civil liberties for 21 months.',
        period: '1947-Present',
    },
    {
        year: 1991,
        title: 'Economic Liberalization',
        description: 'India initiates a series of economic reforms (LPG), moving from a socialist-inspired economy to a more market-oriented one.',
        period: '1947-Present',
    },
];
