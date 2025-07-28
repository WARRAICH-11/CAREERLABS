// Assessment questions for career paths
const assessmentQuestions = [
  {
    id: 'q1',
    question: 'How much do you enjoy solving technical problems?',
    type: 'rating',
    category: 'technical',
    options: [
      { value: 1, label: 'Not at all' },
      { value: 2, label: 'Slightly' },
      { value: 3, label: 'Moderately' },
      { value: 4, label: 'Considerably' },
      { value: 5, label: 'Very much' }
    ]
  },
  {
    id: 'q2',
    question: 'How comfortable are you expressing your creative ideas?',
    type: 'rating',
    category: 'creative',
    options: [
      { value: 1, label: 'Not at all' },
      { value: 2, label: 'Slightly' },
      { value: 3, label: 'Moderately' },
      { value: 4, label: 'Considerably' },
      { value: 5, label: 'Very much' }
    ]
  },
  {
    id: 'q3',
    question: 'How much do you enjoy analyzing data and finding patterns?',
    type: 'rating',
    category: 'analytical',
    options: [
      { value: 1, label: 'Not at all' },
      { value: 2, label: 'Slightly' },
      { value: 3, label: 'Moderately' },
      { value: 4, label: 'Considerably' },
      { value: 5, label: 'Very much' }
    ]
  },
  {
    id: 'q4',
    question: 'How confident are you in leading a team?',
    type: 'rating',
    category: 'managerial',
    options: [
      { value: 1, label: 'Not at all' },
      { value: 2, label: 'Slightly' },
      { value: 3, label: 'Moderately' },
      { value: 4, label: 'Considerably' },
      { value: 5, label: 'Very much' }
    ]
  },
  {
    id: 'q5',
    question: 'How interested are you in starting your own business?',
    type: 'rating',
    category: 'entrepreneurial',
    options: [
      { value: 1, label: 'Not at all' },
      { value: 2, label: 'Slightly' },
      { value: 3, label: 'Moderately' },
      { value: 4, label: 'Considerably' },
      { value: 5, label: 'Very much' }
    ]
  },
  {
    id: 'q6',
    question: 'Which technical skills are you most proficient in?',
    type: 'multiselect',
    category: 'technical',
    options: [
      { value: 'programming', label: 'Programming/Coding' },
      { value: 'database', label: 'Database Management' },
      { value: 'networking', label: 'Networking' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'cloud', label: 'Cloud Computing' },
      { value: 'hardware', label: 'Hardware/Electronics' }
    ]
  },
  {
    id: 'q7',
    question: 'Which creative activities do you enjoy the most?',
    type: 'multiselect',
    category: 'creative',
    options: [
      { value: 'design', label: 'Design' },
      { value: 'writing', label: 'Writing' },
      { value: 'music', label: 'Music' },
      { value: 'visual_arts', label: 'Visual Arts' },
      { value: 'performing_arts', label: 'Performing Arts' },
      { value: 'crafting', label: 'Crafting' }
    ]
  },
  {
    id: 'q8',
    question: 'Which analytical tasks do you prefer?',
    type: 'multiselect',
    category: 'analytical',
    options: [
      { value: 'data_analysis', label: 'Data Analysis' },
      { value: 'research', label: 'Research' },
      { value: 'problem_solving', label: 'Problem Solving' },
      { value: 'pattern_recognition', label: 'Pattern Recognition' },
      { value: 'critical_thinking', label: 'Critical Thinking' },
      { value: 'financial_analysis', label: 'Financial Analysis' }
    ]
  },
  {
    id: 'q9',
    question: 'Which leadership qualities do you possess?',
    type: 'multiselect',
    category: 'managerial',
    options: [
      { value: 'decision_making', label: 'Decision Making' },
      { value: 'delegation', label: 'Delegation' },
      { value: 'communication', label: 'Communication' },
      { value: 'conflict_resolution', label: 'Conflict Resolution' },
      { value: 'motivation', label: 'Team Motivation' },
      { value: 'strategic_planning', label: 'Strategic Planning' }
    ]
  },
  {
    id: 'q10',
    question: 'Which entrepreneurial skills are you developing?',
    type: 'multiselect',
    category: 'entrepreneurial',
    options: [
      { value: 'opportunity_recognition', label: 'Opportunity Recognition' },
      { value: 'risk_management', label: 'Risk Management' },
      { value: 'networking', label: 'Networking' },
      { value: 'fundraising', label: 'Fundraising' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'adaptability', label: 'Adaptability' }
    ]
  },
  {
    id: 'q11',
    question: 'In a project, which role would you naturally gravitate towards?',
    type: 'single',
    categories: ['technical', 'analytical'],
    options: [
      { value: 'implementer', label: 'Implementer - The one who builds the solution' },
      { value: 'researcher', label: 'Researcher - The one who gathers and analyzes information' },
      { value: 'designer', label: 'Designer - The one who creates the concept and plans' },
      { value: 'manager', label: 'Manager - The one who coordinates and ensures completion' },
      { value: 'innovator', label: 'Innovator - The one who comes up with original ideas' }
    ]
  },
  {
    id: 'q12',
    question: 'How do you prefer to solve problems?',
    type: 'single',
    categories: ['creative', 'entrepreneurial'],
    options: [
      { value: 'logical', label: 'Using logical step-by-step reasoning' },
      { value: 'intuitive', label: 'Using intuition and creative thinking' },
      { value: 'collaborative', label: 'Collaborating with others to find solutions' },
      { value: 'data_driven', label: 'Collecting and analyzing data' },
      { value: 'trial_error', label: 'Through trial and error experimentation' }
    ]
  },
  {
    id: 'q13',
    question: 'What motivates you the most in your career?',
    type: 'single',
    categories: ['managerial', 'entrepreneurial'],
    options: [
      { value: 'financial', label: 'Financial rewards' },
      { value: 'recognition', label: 'Recognition and status' },
      { value: 'impact', label: 'Making an impact on others' },
      { value: 'learning', label: 'Continuous learning and growth' },
      { value: 'autonomy', label: 'Autonomy and independence' }
    ]
  },
  {
    id: 'q14',
    question: 'Which work environment do you thrive in?',
    type: 'single',
    categories: ['technical', 'creative'],
    options: [
      { value: 'structured', label: 'Structured and organized' },
      { value: 'flexible', label: 'Flexible and adaptable' },
      { value: 'collaborative', label: 'Team-oriented and collaborative' },
      { value: 'autonomous', label: 'Independent with minimal supervision' },
      { value: 'innovative', label: 'Fast-paced and innovative' }
    ]
  },
  {
    id: 'q15',
    question: 'Where do you see yourself in 5 years?',
    type: 'single',
    categories: ['analytical', 'managerial'],
    options: [
      { value: 'expert', label: 'As a recognized expert in my field' },
      { value: 'leader', label: 'In a leadership position managing a team' },
      { value: 'entrepreneur', label: 'Running my own business' },
      { value: 'innovator', label: 'Developing innovative solutions' },
      { value: 'consultant', label: 'Working as a consultant or advisor' }
    ]
  }
];

export default assessmentQuestions; 