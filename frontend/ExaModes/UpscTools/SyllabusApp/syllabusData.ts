export type SyllabusTopic = {
  name: string;
  children?: SyllabusTopic[];
  isLoadingChildren?: boolean;
  areChildrenGenerated?: boolean;
};

type SyllabusPaper = {
  title: string;
  subjects: SyllabusTopic[];
};

export const syllabusData: SyllabusPaper[] = [
    {
        title: 'GS Paper I',
        subjects: [
            {
                name: 'Indian Heritage and Culture',
                children: [
                    { 
                        name: 'Salient aspects of Art Forms, Literature and Architecture from ancient to modern times.',
                        children: [
                            { name: 'Prehistoric Art (e.g., Bhimbetka paintings)' },
                            { name: 'Indus Valley Civilization Art & Architecture' },
                            { name: 'Mauryan & Post-Mauryan Art (Pillars, Stupas, Caves)' },
                            { name: 'Gupta Age Art & Architecture' },
                            { name: 'Temple Architecture (Nagara, Dravida, Vesara)' },
                            { name: 'Indo-Islamic Architecture' },
                            { name: 'Colonial & Modern Architecture' },
                            { name: 'Indian Paintings (Murals, Miniatures)' },
                            { name: 'Performing Arts (Music, Dance, Theatre, Puppetry)' },
                            { name: 'Indian Literature (Ancient, Medieval, Modern)' },
                        ]
                    },
                ],
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
    },
    {
        title: 'GS Paper II',
        subjects: [
            {
                name: 'Constitution & Polity',
                children: [
                    { 
                        name: 'Indian Constitution- historical underpinnings, evolution, features, amendments, significant provisions and basic structure.',
                        children: [
                            { name: 'Historical Evolution (Regulating Act to 1947 Act)' },
                            { name: 'Making of the Constitution & Constituent Assembly' },
                            { name: 'Preamble, Fundamental Rights, DPSP, Fundamental Duties' },
                            { name: 'Key Amendments (42nd, 44th, 73rd, 74th, 101st etc.)' },
                            { name: 'Doctrine of Basic Structure' },
                        ]
                    },
                    { 
                        name: 'Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure, devolution of powers and finances up to local levels and challenges therein.',
                        children: [
                            { name: 'Federalism in India: Nature and Challenges' },
                            { name: 'Centre-State Relations (Legislative, Administrative, Financial)' },
                            { name: 'Role of Governor' },
                            { name: 'Local Self-Government (Panchayati Raj and Municipalities)' },
                        ]
                    },
                    { 
                        name: 'Separation of powers between various organs dispute redressal mechanisms and institutions.',
                        children: [
                            { name: 'Doctrine of Separation of Powers' },
                            { name: 'Checks and Balances' },
                            { name: 'Judicial Review and Activism' },
                        ]
                    },
                    { 
                        name: 'Comparison of the Indian constitutional scheme with that of other countries.',
                        children: [
                            { name: 'Comparison with UK, USA, France, Germany, Japan etc.' },
                        ]
                    },
                    { 
                        name: 'Parliament and State Legislatures - structure, functioning, conduct of business, powers & privileges and issues arising out of these.',
                        children: [
                            { name: 'Composition and functioning of Parliament' },
                            { name: 'Parliamentary Committees' },
                            { name: 'Parliamentary Privileges' },
                            { name: 'Decline in the role of Parliament' },
                        ]
                    },
                    { 
                        name: 'Structure, organization and functioning of the Executive and the Judiciary Ministries and Departments of the Government; pressure groups and formal/informal associations and their role in the Polity.',
                        children: [
                            { name: 'The President, Prime Minister, Council of Ministers' },
                            { name: 'The Supreme Court and High Courts' },
                            { name: 'Judicial accountability and reforms' },
                            { name: 'Pressure Groups and their role in policy-making' },
                        ]
                    },
                    { 
                        name: 'Salient features of the Representation of People’s Act.',
                        children: [
                            { name: 'Key provisions of RPA 1950 and 1951' },
                            { name: 'Electoral Reforms' },
                        ]
                    },
                    { 
                        name: 'Appointment to various Constitutional posts, powers, functions and responsibilities of various Constitutional Bodies.',
                        children: [
                            { name: 'Election Commission of India (ECI)' },
                            { name: 'Union Public Service Commission (UPSC)' },
                            { name: 'State Public Service Commission (SPSC)' },
                            { name: 'Finance Commission' },
                            { name: 'Comptroller and Auditor General of India (CAG)' },
                            { name: 'National Commission for SCs (NCSC)' },
                            { name: 'National Commission for STs (NCST)' },
                            { name: 'National Commission for Backward Classes (NCBC)' },
                            { name: 'Attorney General of India & Advocate General of the State' },
                        ]
                    },
                    { 
                        name: 'Statutory, regulatory and various quasi-judicial bodies.',
                        children: [
                            { name: 'NITI Aayog' },
                            { name: 'National Human Rights Commission (NHRC)' },
                            { name: 'State Human Rights Commission (SHRC)' },
                            { name: 'Central Information Commission (CIC)' },
                            { name: 'Central Vigilance Commission (CVC)' },
                            { name: 'Lokpal and Lokayuktas' },
                            { name: 'National Green Tribunal (NGT)' },
                            { name: 'SEBI, IRDAI, TRAI' },
                        ]
                    },
                ],
            },
            {
                name: 'Governance & Social Justice',
                children: [
                    { 
                        name: 'Government policies and interventions for development in various sectors and issues arising out of their design and implementation.',
                        children: [
                            { name: 'Policy making process in India' },
                            { name: 'Implementation challenges and suggestions for reform' },
                        ]
                    },
                    { 
                        name: 'Development processes and the development industry the role of NGOs, SHGs, various groups and associations, donors, charities, institutional and other stakeholders.',
                        children: [
                            { name: 'Role of Civil Society in development' },
                            { name: 'Self-Help Groups (SHGs) and microfinance' },
                        ]
                    },
                    { 
                        name: 'Welfare schemes for vulnerable sections of the population by the Centre and States and the performance of these schemes; mechanisms, laws, institutions and Bodies constituted for the protection and betterment of these vulnerable sections.',
                        children: [
                            { name: 'Schemes for SCs, STs, Women, Children, Minorities, Differently-abled' },
                            { name: 'Performance audit and social audit of welfare schemes' },
                        ]
                    },
                    { 
                        name: 'Issues relating to development and management of Social Sector/Services relating to Health, Education, Human Resources.',
                        children: [
                            { name: 'National Health Policy' },
                            { name: 'National Education Policy' },
                            { name: 'Skill Development' },
                        ]
                    },
                    { 
                        name: 'Issues relating to poverty and hunger.',
                        children: [
                            { name: 'PDS and Food Security' },
                            { name: 'Malnutrition and its dimensions' },
                        ]
                    },
                    { 
                        name: 'Important aspects of governance, transparency and accountability, e-governance- applications, models, successes, limitations, and potential; citizens charters, transparency & accountability and institutional and other measures.',
                        children: [
                            { name: 'Good Governance & Citizen Centric Governance' },
                            { name: 'Right to Information (RTI)' },
                            { name: 'E-Governance Models' },
                            { name: 'Citizen\'s Charters' },
                        ]
                    },
                    { 
                        name: 'Role of civil services in a democracy.',
                        children: [
                            { name: 'Civil Service Reforms (e.g., Mission Karmayogi)' },
                            { name: 'Relationship between political executive and permanent executive' },
                        ]
                    },
                ],
            },
            {
                name: 'International Relations',
                children: [
                    { 
                        name: 'India and its neighborhood- relations.',
                        children: [
                            { name: 'India-Pakistan Relations' },
                            { name: 'India-China Relations' },
                            { name: 'India-Bangladesh Relations' },
                            { name: 'India-Sri Lanka Relations' },
                            { name: 'India-Nepal & India-Bhutan Relations' },
                            { name: 'India-Maldives & India-Afghanistan Relations' },
                        ]
                    },
                    { 
                        name: 'Bilateral, regional and global groupings and agreements involving India and/or affecting India’s interests.',
                        children: [
                            { name: 'SAARC, BIMSTEC, SCO, ASEAN' },
                            { name: 'BRICS, G20, G7, QUAD' },
                            { name: 'United Nations and its agencies' },
                        ]
                    },
                    { 
                        name: 'Effect of policies and politics of developed and developing countries on India’s interests, Indian diaspora.',
                        children: [
                            { name: 'India-US, India-Russia, India-EU relations' },
                            { name: 'Role and significance of Indian Diaspora' },
                        ]
                    },
                    { 
                        name: 'Important International institutions, agencies and fora, their structure, mandate.',
                        children: [
                            { name: 'UN, WTO, IMF, World Bank, WHO' },
                        ]
                    },
                ],
            },
        ],
    },
    {
        title: 'GS Paper III',
        subjects: [
             {
                name: 'Economy',
                children: [
                    { 
                        name: 'Indian Economy and issues relating to planning, mobilization of resources, growth, development and employment.',
                        children: [
                            { name: 'Economic Planning in India (Five Year Plans, NITI Aayog)' },
                            { name: 'Mobilization of Resources (Taxation, Public Debt)' },
                            { name: 'Unemployment and its types' },
                        ]
                    },
                    { 
                        name: 'Inclusive growth and issues arising from it.',
                        children: [
                            { name: 'Financial Inclusion (PMJDY)' },
                            { name: 'Dimensions of inclusive growth' },
                        ]
                    },
                    { 
                        name: 'Government Budgeting.',
                        children: [
                            { name: 'Components of the Budget (Revenue, Capital)' },
                            { name: 'Fiscal Policy, Fiscal Deficit, FRBM Act' },
                        ]
                    },
                    { 
                        name: 'Major crops cropping patterns in various parts of the country, different types of irrigation and irrigation systems storage, transport and marketing of agricultural produce and issues and related constraints; e-technology in the aid of farmers.',
                        children: [
                            { name: 'Agricultural Marketing and APMC reforms' },
                            { name: 'E-Technology for farmers (e-NAM)' },
                            { name: 'Technology missions in agriculture' },
                        ]
                    },
                    { 
                        name: 'Issues related to direct and indirect farm subsidies and minimum support prices; Public Distribution System objectives, functioning, limitations, revamping; issues of buffer stocks and food security; Technology missions; economics of animal-rearing.',
                        children: [
                            { name: 'MSP regime and its challenges' },
                            { name: 'PDS and National Food Security Act (NFSA)' },
                        ]
                    },
                    { 
                        name: 'Food processing and related industries in India- scope and significance, location, upstream and downstream requirements, supply chain management.',
                        children: [
                            { name: 'Scope and Significance of Food Processing' },
                            { name: 'Supply Chain Management' },
                        ]
                    },
                    { 
                        name: 'Land reforms in India.',
                        children: [
                           { name: 'Abolition of Intermediaries (Zamindari system)' },
                           { name: 'Tenancy Reforms' },
                           { name: 'Land Ceiling Acts and their implementation' },
                           { name: 'Bhoodan & Gramdan Movements' },
                           { name: 'Modernization of Land Records (e.g., SWAMITVA Scheme)' },
                        ]
                    },
                    { 
                        name: 'Effects of liberalization on the economy, changes in industrial policy and their effects on industrial growth.',
                        children: [
                            { name: 'LPG Reforms of 1991' },
                            { name: 'Industrial Policy changes' },
                        ]
                    },
                    { 
                        name: 'Infrastructure: Energy, Ports, Roads, Airports, Railways etc.',
                        children: [
                            { name: 'National Infrastructure Pipeline (NIP)' },
                            { name: 'Challenges in Infrastructure development' },
                        ]
                    },
                    { 
                        name: 'Investment models.',
                        children: [
                           { name: 'Public-Private Partnership (PPP) Models (BOT, BOOT, etc.)' },
                           { name: 'Engineering, Procurement, and Construction (EPC) Model' },
                           { name: 'Hybrid Annuity Model (HAM)' },
                           { name: 'Swiss Challenge Method' },
                        ]
                    },
                ],
            },
            {
                name: 'Science & Technology',
                children: [
                    { 
                        name: 'Science and Technology- developments and their applications and effects in everyday life.',
                        children: [
                            { name: 'Applications in Health, Agriculture, Communication' },
                        ]
                    },
                    { 
                        name: 'Achievements of Indians in science & technology; indigenization of technology and developing new technology.',
                        children: [
                            { name: 'Role of DRDO, CSIR, etc.' },
                        ]
                    },
                    { 
                        name: 'Awareness in the fields of IT, Space, Computers, robotics, nano-technology, bio-technology and issues relating to intellectual property rights.',
                        children: [
                            { name: 'Information Technology & Computers' },
                            { name: 'Space Technology (ISRO, Missions)' },
                            { name: 'Robotics & Artificial Intelligence' },
                            { name: 'Nanotechnology' },
                            { name: 'Biotechnology' },
                            { name: 'Intellectual Property Rights (IPR)' },
                        ]
                    },
                ],
            },
            {
                name: 'Environment',
                children: [
                    { 
                        name: 'Conservation, environmental pollution and degradation, environmental impact assessment.',
                        children: [
                            { name: 'Types of Pollution (Air, Water, Soil)' },
                            { name: 'Environmental Impact Assessment (EIA) 2020' },
                        ]
                    },
                    { 
                        name: 'Climate Change & related conventions',
                        children: [
                           { name: 'UNFCCC & Conference of Parties (COP)' },
                           { name: 'Kyoto Protocol & Paris Agreement' },
                           { name: 'IPCC Reports: Key Findings' },
                           { name: 'India\'s Nationally Determined Contributions (NDCs)' },
                           { name: 'National Action Plan on Climate Change (NAPCC)' },
                        ]
                    },
                    { 
                        name: 'Biodiversity & Conservation Efforts',
                        children: [
                           { name: 'In-situ Conservation (National Parks, Sanctuaries)' },
                           { name: 'Ex-situ Conservation (Zoos, Botanical Gardens)' },
                           { name: 'Biodiversity Hotspots' },
                           { name: 'Project Tiger, Project Elephant' },
                           { name: 'Biodiversity Act, 2002' },
                           { name: 'Nagoya Protocol' },
                        ]
                    },
                ],
            },
            {
                name: 'Disaster Management',
                children: [
                    { 
                        name: 'Disaster and Disaster Management',
                        children: [
                            { name: 'Definitions: Hazard, Disaster, Vulnerability, Risk, Capacity' },
                            { name: 'Types of Disasters: Natural (Geophysical, Hydrological, Climatological) and Man-made' },
                            { name: 'Disaster Management Cycle: Prevention, Mitigation, Preparedness, Response, Recovery, Reconstruction' },
                            { name: 'Key Institutions: NDMA, NDRF, SDMA, DDMA, NIDM' },
                        ]
                    },
                    { 
                        name: 'Disaster Management Frameworks',
                        children: [
                            { name: 'Sendai Framework for Disaster Risk Reduction' },
                            { name: 'PM\'s 10-Point Agenda on DRR' },
                            { name: 'Disaster Management Act, 2005' },
                        ]
                    },
                ],
            },
             {
                name: 'Security',
                children: [
                    { 
                        name: 'Linkages between development and spread of extremism.',
                        children: [
                            { name: 'Left-Wing Extremism (Naxalism): Causes and impact' },
                            { name: 'Insurgency in North-East: Linkages with development' },
                        ]
                    },
                    { 
                        name: 'Role of external state and non-state actors in creating challenges to internal security.',
                        children: [
                            { name: 'State-sponsored terrorism and cross-border terrorism' },
                            { name: 'Role of neighboring countries in fomenting instability' },
                            { name: 'Non-state actors: Terrorist groups, Organized crime syndicates, drug cartels' },
                            { name: 'Linkages between external and internal actors' },
                        ]
                    },
                    { 
                        name: 'Internal Security Challenges in Cyber Domain',
                        children: [
                           { name: 'Cyber Warfare and Cyber Terrorism' },
                           { name: 'Role of Social Media in radicalization' },
                           { name: 'Basics of Cyber Security: Prevention measures' },
                           { name: 'Money Laundering and its prevention (PMLA Act)' },
                        ]
                    },
                    { 
                        name: 'Security challenges and their management in border areas; linkages of organized crime with terrorism.',
                        children: [
                            { name: 'Border infrastructure and management' },
                            { name: 'Linkages of organized crime (e.g., smuggling, drug trafficking) with terrorism' },
                        ]
                    },
                    { 
                        name: 'Various Security forces and agencies and their mandate.',
                        children: [
                            { name: 'Central Armed Police Forces (CAPF): BSF, CRPF, CISF, ITBP, SSB - Mandates and roles' },
                            { name: 'Intelligence Agencies: Intelligence Bureau (IB), Research & Analysis Wing (R&AW)' },
                            { name: 'Investigative Agencies: National Investigation Agency (NIA), Central Bureau of Investigation (CBI), Enforcement Directorate (ED)' },
                            { name: 'Armed Forces (Army, Navy, Air Force) and their role in internal security' },
                        ]
                    },
                ],
            },
        ],
    },
     {
        title: 'GS Paper IV',
        subjects: [
            {
                name: 'Ethics and Human Interface',
                children: [
                    { name: 'Essence, determinants and consequences of Ethics in human actions; dimensions of ethics; ethics in private and public relationships.' },
                    { name: 'Human Values – lessons from the lives and teachings of great leaders, reformers and administrators; role of family, society and educational institutions in inculcating values.' },
                ],
            },
            {
                name: 'Attitude',
                children: [
                    { name: 'Attitude: content, structure, function; its influence and relation with thought and behaviour; moral and political attitudes; social influence and persuasion.' },
                ],
            },
            {
                name: 'Aptitude and Foundational Values for Civil Service',
                children: [
                    { name: 'Aptitude and foundational values for Civil Service, integrity, impartiality and non-partisanship, objectivity, dedication to public service, empathy, tolerance and compassion towards the weaker-sections.' },
                ],
            },
            {
                name: 'Emotional Intelligence',
                children: [
                    { name: 'Emotional intelligence-concepts, and their utilities and application in administration and governance.' },
                ],
            },
            {
                name: 'Contributions of Thinkers and Philosophers',
                children: [
                    { name: 'Indian Thinkers (e.g., Kautilya, Gandhi, Ambedkar, Vivekananda)' },
                    { name: 'Western Thinkers (e.g., Socrates, Plato, Aristotle, Kant, Bentham, Mill, Rawls)' },
                ],
            },
            {
                name: 'Public/Civil Service Values and Ethics',
                children: [
                    { name: 'Status and problems of ethics in Public administration' },
                    { name: 'Ethical dilemmas in government and private institutions' },
                    { name: 'Sources of ethical guidance (Laws, rules, conscience)' },
                    { name: 'Accountability and ethical governance' },
                    { name: 'Ethical issues in international relations and funding' },
                    { name: 'Corporate Governance' },
                ],
            },
            {
                name: 'Probity in Governance',
                children: [
                    { name: 'Concept of public service and its philosophical basis' },
                    { name: 'Information sharing and transparency (RTI)' },
                    { name: 'Codes of Ethics and Codes of Conduct' },
                    { name: 'Citizen’s Charters and work culture' },
                    { name: 'Quality of service delivery' },
                    { name: 'Utilization of public funds and challenges of corruption' },
                ],
            },
             {
                name: 'Case Studies',
                children: [
                    { name: 'Case Studies on above issues.' },
                ],
            },
        ],
    },
];
