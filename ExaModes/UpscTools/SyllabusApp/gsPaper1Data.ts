import { SyllabusPaper } from './types';

export const gsPaper1Data: SyllabusPaper = {
    title: 'GS Paper I',
    subjects: [
        {
            name: 'Indian Heritage and Culture',
            children: [
                {
                    name: 'Visual Arts',
                    children: [
                        {
                            name: 'Architecture',
                            children: [
                                { name: 'Harappan Architecture (Town Planning, Great Bath)' },
                                { name: 'Mauryan Architecture (Palaces, Pillars, Stupas, Caves)' },
                                { name: 'Post-Mauryan Architecture (Stupas at Sanchi, Gandhara School)' },
                                { name: 'Gupta Age Architecture (Beginning of Temple Architecture, Dasavatara Temple)' },
                                { name: 'South Indian Architecture (Pallava, Chola, Vijayanagara, Nayaka styles)' },
                                { name: 'Temple Architecture Styles (Nagara, Dravida, Vesara, and regional styles)' },
                                { name: 'Indo-Islamic Architecture (Sultanate and Mughal periods)' },
                                { name: 'Colonial Architecture (Indo-Saracenic, Neoclassical)' },
                                { name: 'Modern and Post-Independence Architecture' }
                            ]
                        },
                        {
                            name: 'Sculpture',
                            children: [
                                { name: 'Harappan Sculptures (Bronze Dancing Girl, Seals)' },
                                { name: 'Buddhist Sculptures (Gandhara, Mathura, Amaravati Schools)' },
                                { name: 'Gupta and Post-Gupta Sculptures (Sarnath School)' },
                                { name: 'Medieval School of Sculptures (Pallava, Chola bronzes)' },
                                { name: 'Modern Indian Sculpture' }
                            ]
                        },
                        {
                            name: 'Paintings',
                            children: [
                                { name: 'Prehistoric Paintings (Bhimbetka)' },
                                { name: 'Mural Paintings (Ajanta, Ellora, Bagh Caves)' },
                                { name: 'Miniature Paintings (Pala, Apabhramsa, Sultanate)' },
                                { name: 'Mughal School of Painting' },
                                { name: 'Deccani and Rajasthani Schools' },
                                { name: 'Pahari School and other regional styles' },
                                { name: 'Modern Indian Paintings (Bengal School, Progressive Artists)' }
                            ]
                        },
                        {
                            name: 'Handicrafts',
                            children: [
                                { name: 'Textiles and Weaving (e.g., Pashmina, Ikat, Kalamkari)' },
                                { name: 'Pottery and Ceramics' },
                                { name: 'Woodwork, Stonework, and Metalwork' },
                                { name: 'GI Tagged Handicrafts' }
                            ]
                        }
                    ]
                },
                {
                    name: 'Performing Arts',
                    children: [
                        {
                            name: 'Music',
                            children: [
                                { name: 'Hindustani Classical Music (Dhrupad, Khayal, Thumri, Gharanas)' },
                                { name: 'Carnatic Classical Music (Trinity, Varnam, Kriti)' },
                                { name: 'Folk Music Traditions' },
                                { name: 'Modern and Fusion Music' }
                            ]
                        },
                        {
                            name: 'Dance',
                            children: [
                                { name: 'Classical Dance Forms (Bharatanatyam, Kathak, Kathakali, Kuchipudi, Odissi, Sattriya, Manipuri, Mohiniyattam)' },
                                { name: 'Folk Dances of India (region-wise)' },
                                { name: 'Martial Arts of India' }
                            ]
                        },
                        {
                            name: 'Theatre & Puppetry',
                            children: [
                                { name: 'Classical Sanskrit Theatre' },
                                { name: 'Folk Theatre (e.g., Jatra, Nautanki, Tamasha, Bhavai)' },
                                { name: 'Indian Puppetry (String, Shadow, Rod, Glove)' }
                            ]
                        }
                    ]
                },
                {
                    name: 'Literature',
                    children: [
                        { name: 'Ancient Indian Literature (Vedas, Upanishads, Puranas, Epics, Sangam Literature)' },
                        { name: 'Classical Sanskrit Literature (Kalidasa, Bhasa)' },
                        { name: 'Pali and Prakrit Literature' },
                        { name: 'Medieval Literature (Bhakti, Sufi, Regional Languages)' },
                        { name: 'Modern Indian Literature' }
                    ]
                },
                {
                    name: 'Philosophy & Religion',
                    children: [
                        { name: 'Schools of Indian Philosophy (Orthodox and Heterodox)' },
                        { name: 'Buddhism and Jainism: Doctrines and Impact' },
                        { name: 'Bhakti and Sufi Movements' }
                    ]
                },
                {
                    name: 'Culture & Society',
                    children: [
                        { name: 'Indian Languages and Scripts' },
                        { name: 'Fairs and Festivals of India' },
                        { name: 'Indian Cinema' },
                        { name: 'Science and Technology in Ancient India' },
                        { name: 'UNESCO World Heritage Sites in India' }
                    ]
                }
            ]
        },
        {
            name: 'History',
            children: [
                { 
                    name: 'Modern Indian history from about the middle of the eighteenth century until the present - significant events, personalities, issues.',
                    children: [
                        { name: 'Decline of Mughal Empire & Rise of Regional States' },
                        { name: 'The British Conquest of India' },
                        { name: 'Colonial Rule: Administrative Structure & Policies' },
                        { name: 'Economic Impact of British Rule' },
                        { name: 'Socio-Religious Reform Movements' },
                        { name: 'The Revolt of 1857' },
                    ]
                },
                { 
                    name: 'The Freedom Struggle - its various stages and important contributors /contributions from different parts of the country.',
                    children: [
                        { name: 'Early Nationalism & Formation of INC' },
                        { name: 'The Moderate & Extremist Phases' },
                        { name: 'Swadeshi Movement' },
                        { name: 'Revolutionary Nationalism' },
                        { name: 'The Gandhian Era: Non-Cooperation, Civil Disobedience, Quit India' },
                        { name: 'Role of Women, Peasants, and Tribals in Freedom Struggle' },
                        { name: 'Subhash Chandra Bose & INA' },
                        { name: 'Partition of India' },
                    ]
                },
                { 
                    name: 'Post-independence consolidation and reorganization within the country.',
                    children: [
                        { name: 'Integration of Princely States (Sardar Patel, Instrument of Accession)' },
                        { name: 'Reorganization of States on linguistic lines (Fazl Ali Commission)' },
                        { name: 'Nehruvian Era: Foreign Policy (NAM) & Economic Planning (Five Year Plans)' },
                        { name: 'The Green Revolution and its socio-economic impact' },
                        { name: 'The White Revolution (Operation Flood)' },
                        { name: 'Wars with neighbors (Pakistan 1965, 1971, China 1962)' },
                        { name: 'JP Movement and The Emergency (1975-77)' },
                        { name: 'Rise of regional parties and coalition politics' },
                    ]
                },
                { 
                    name: 'History of the world will include events from 18th century such as industrial revolution, world wars, redrawal of national boundaries, colonization, decolonization, political philosophies like communism, capitalism, socialism etc.- their forms and effect on the society.',
                    children: [
                        { name: 'Industrial Revolution' },
                        { name: 'American and French Revolutions' },
                        { name: 'World War I: Causes and Consequences' },
                        { name: 'The Russian Revolution of 1917' },
                        { name: 'Inter-War Years & The Great Depression' },
                        { name: 'World War II: Causes and Consequences' },
                        { name: 'The Cold War Era' },
                        { name: 'Decolonization in Asia and Africa' },
                        { name: 'Political Philosophies: Capitalism, Socialism, Communism' },
                    ]
                },
            ]
        },
        {
            name: 'Society',
            children: [
                { 
                    name: 'Salient features of Indian Society, Diversity of India.',
                    children: [
                        { name: 'Caste System: Features, Varna vs Jati, Issues' },
                        { name: 'Kinship, Marriage, and Family systems in India' },
                        { name: 'Unity in Diversity: Linguistic, Religious, Ethnic diversity' },
                        { name: 'Patriarchy and its impact' },
                        { name: 'Concept of Tribe, issues of tribal communities' },
                    ]
                },
                { 
                    name: 'Role of women and women’s organization, population and associated issues, poverty and developmental issues, urbanization, their problems and their remedies.',
                    children: [
                        { 
                            name: 'Women & Women\'s Organizations',
                            children: [
                                { name: 'Status of Women (Ancient, Medieval, Modern)' },
                                { name: 'Issues: Gender inequality, violence, property rights, political representation' },
                                { name: 'Women\'s Movements and Organizations in India' },
                            ]
                        },
                        {
                            name: 'Population & Associated Issues',
                            children: [
                                { name: 'Population growth, distribution, density' },
                                { name: 'Demographic Dividend and challenges' },
                                { name: 'National Population Policy' },
                            ]
                        },
                         {
                            name: 'Poverty & Developmental Issues',
                            children: [
                                { name: 'Concepts and measurement of poverty' },
                                { name: 'Causes and consequences of poverty' },
                                { name: 'Poverty alleviation programs' },
                            ]
                        },
                        {
                            name: 'Urbanization',
                            children: [
                                { name: 'Patterns and trends of urbanization in India' },
                                { name: 'Problems of urbanization (housing, sanitation, transport)' },
                                { name: 'Smart Cities Mission and other urban development schemes' },
                            ]
                        }
                    ]
                },
                { 
                    name: 'Effects of globalization on Indian society.',
                    children: [
                        { name: 'Impact on Culture & Social Structure' },
                        { name: 'Economic & Political Impact of Globalization' },
                         { name: 'Globalization and its impact on women, farmers, and the informal sector' },
                         { name: 'Cultural homogenization vs. glocalization' },
                    ]
                },
                { 
                    name: 'Social empowerment, communalism, regionalism & secularism.',
                    children: [
                        { name: 'Social Empowerment: Concepts and indicators' },
                        { name: 'Communalism: Causes, consequences, and remedies' },
                        { name: 'Regionalism: Types, causes, and impact on national integration' },
                        { name: 'Secularism: Indian vs. Western models' },
                    ]
                },
            ]
        },
        {
            name: 'Geography',
            children: [
                { 
                    name: 'Salient features of world’s physical geography.',
                    children: [
                         { 
                            name: 'Geomorphology',
                            children: [
                                { name: 'Interior of the Earth (Crust, Mantle, Core)' },
                                { name: 'Theory of Plate Tectonics, Continental Drift' },
                                { name: 'Earthquakes and Volcanoes: Distribution and types' },
                                { name: 'Endogenetic & Exogenetic forces' },
                                { name: 'Major Landforms: Mountains, Plateaus, Plains' },
                                { name: 'Weathering, Erosion, and Deposition' },
                            ]
                        },
                        { 
                            name: 'Climatology',
                            children: [
                                { name: 'Structure and Composition of Atmosphere' },
                                { name: 'Insolation and Heat Budget of the Earth' },
                                { name: 'Atmospheric Pressure and Wind Systems (Planetary, Seasonal, Local Winds)' },
                                { name: 'Air Masses, Fronts, Cyclones (Tropical & Temperate)' },
                                { name: 'Humidity, Condensation, and Precipitation (Rain, Snow, Hail)' },
                                { name: 'Climatic Classification (Koppen\'s classification)' },
                            ]
                        },
                        { 
                            name: 'Oceanography',
                            children: [
                                { name: 'Ocean Bottom Relief' },
                                { name: 'Temperature and Salinity of Ocean Waters' },
                                { name: 'Ocean Waves, Tides, and Currents (e.g., Gulf Stream, Kuroshio)' },
                                { name: 'Marine Resources' },
                            ]
                        },
                    ]
                },
                { 
                    name: 'Distribution of key natural resources across the world (including South Asia and the Indian sub-continent); factors responsible for the location of primary, secondary, and tertiary sector industries in various parts of the world (including India).',
                    children: [
                        { name: 'Distribution of Mineral and Energy Resources' },
                        { name: 'Location factors for Primary, Secondary, and Tertiary industries' },
                    ]
                },
                { 
                    name: 'Important Geophysical phenomena such as earthquakes, Tsunami, Volcanic activity, cyclone etc., geographical features and their location- changes in critical geographical features (including water-bodies and ice-caps) and in flora and fauna and the effects of such changes.',
                    children: [
                        { name: 'Earthquakes, Tsunamis, and Volcanoes' },
                        { name: 'Cyclones (Tropical and Temperate)' },
                        { name: 'Changes in Water-bodies, Ice-caps, Flora and Fauna' },
                    ]
                },
            ]
        }
    ]
};