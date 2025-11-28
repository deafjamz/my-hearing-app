import { ActivityData } from '@/types/activity';

const NOISE_CAFE = '/noise_files/cafe_light.m4a';
const NOISE_OFFICE = '/noise_files/office_moderate.m4a';
const NOISE_STREET = '/noise_files/street_busy.m4a';

export const scenarios: ActivityData[] = [
  {
    id: 'scenario-coffee-basic',
    title: 'Coffee Shop: Basic Orders',
    audioSrc: '/hearing-rehab-audio/sarah_audio/scenarios_coffee_basic_greeting.mp3',
    noiseSrc: NOISE_CAFE,
    transcript: "What can I get for you?",
    questions: [
      {
        id: 'q1',
        text: 'What did the barista ask?',
        choices: [
          { id: 'c1', text: 'What can I get for you?', isCorrect: true },
          { id: 'c2', text: 'What is your name?', isCorrect: false }
        ],
        feedback: "This is the most common opening question at coffee shops."
      }
    ]
  },
  {
    id: 'scenario-coffee-price',
    title: 'Coffee Shop: Price',
    audioSrc: '/hearing-rehab-audio/david_audio/scenarios_coffee_price_simple.mp3',
    noiseSrc: NOISE_CAFE,
    transcript: "That'll be four dollars and fifty cents.",
    questions: [
      {
        id: 'q1',
        text: 'How much did the barista say it costs?',
        choices: [
          { id: 'c1', text: '$4.50', isCorrect: true },
          { id: 'c2', text: '$3.50', isCorrect: false },
          { id: 'c3', text: '$5.50', isCorrect: false }
        ],
        feedback: "Price comprehension is essential. Focus on the numbers."
      }
    ]
  },
  {
    id: 'scenario-coffee-complex',
    title: 'Coffee Shop: Complex Order',
    audioSrc: '/hearing-rehab-audio/sarah_audio/scenarios_coffee_complex_order.mp3',
    noiseSrc: NOISE_STREET, // Harder noise
    transcript: "Alright, so that's a large iced coffee with oat milk and an extra shot.",
    questions: [
      {
        id: 'q1',
        text: 'What was the complete order?',
        choices: [
          { id: 'c1', text: 'Large iced coffee with oat milk and extra shot', isCorrect: true },
          { id: 'c2', text: 'Medium iced coffee with almond milk and extra shot', isCorrect: false }
        ],
        feedback: "You tracked multiple details in a complex order - advanced listening!"
      }
    ]
  }
];