import { ActivityData } from '@/types/activity';

export const stories: ActivityData[] = [
  {
    id: 'story-timid-teacup',
    title: 'The Timid Teacup',
    audioSrc: '/hearing-rehab-audio/female_audio/story_timid_teacup.mp3',
    transcript: "Barnaby was a teacup who was afraid of tea. He saw the big, steaming pot and shivered, his porcelain chattering. One day, a little girl with warm hands chose him. 'You're my favorite,' she whispered. She filled him not with tea, but with cool milk and a single strawberry. Barnaby decided he wasn't afraid anymore.",
    questions: [
      {
        id: 'q1',
        text: 'What did the little girl fill Barnaby with instead of tea?',
        choices: [
          { id: 'c1', text: 'Cool milk and a strawberry', isCorrect: true },
          { id: 'c2', text: 'Hot chocolate', isCorrect: false },
          { id: 'c3', text: 'Orange juice', isCorrect: false },
          { id: 'c4', text: 'Water and sugar', isCorrect: false }
        ]
      }
    ]
  },
  {
    id: 'story-compass-north',
    title: 'The Compass Who Lost His North',
    audioSrc: '/hearing-rehab-audio/female_audio/story_compass_north.mp3',
    transcript: "Miles was a brass compass whose needle always pointed to his favorite armchair. Not North. This was a problem, as he belonged to a famous explorer named Penelope. 'Useless!' she'd mutter, stuffing him in a pocket filled with lint. One day, Penelope got terribly lost in a foggy forest. She pulled Miles out in desperation. He couldn't find North, but he could find the way back to his armchair. He spun confidently, pointing through the fog. Penelope followed, and soon they were home, safe and warm. Miles never found North, but he had found his purpose.",
    questions: [
      {
        id: 'q1',
        text: 'How did Miles help Penelope when she was lost?',
        choices: [
          { id: 'c1', text: 'He pointed the way back to his armchair', isCorrect: true },
          { id: 'c2', text: 'He found true North', isCorrect: false },
          { id: 'c3', text: 'He called for help', isCorrect: false },
          { id: 'c4', text: 'He created a map', isCorrect: false }
        ],
        feedback: "Miles couldn't find North, but he could always find his favorite armchair, guiding Penelope home."
      }
    ]
  },
  {
    id: 'story-left-sock',
    title: 'The Left Sock',
    audioSrc: '/hearing-rehab-audio/female_audio/story_left_sock.mp3',
    transcript: "In the world under the dryer, there lived a civilization of lost socks. Their leader was a wise, argyle sock named Argus. He had seen many things, mostly the inside of a washing machine. One day, a young, bright pink sock with stripes fell from the sky. 'Where am I?' she cried. 'You are in the Land of the Lost,' Argus said calmly. 'But I'm not lost! I'm a left sock! My right sock is waiting for me!' The other socks chuckled. No one ever found their match. But the pink sock was determined. She spent weeks learning the terrain—the mountains of forgotten sweaters, the canyons of lint. She befriended a lonely button and a wise old dust bunny. Together, they navigated the treacherous landscape back to the laundry room door. Just as she was about to give up hope, the dryer door opened, and a matching pink sock tumbled out. It was a joyful reunion, and a legend was born in the Land of the Lost.",
    questions: [
      {
        id: 'q1',
        text: 'What made the pink sock different from the other lost socks?',
        choices: [
          { id: 'c1', text: 'She believed she could find her match', isCorrect: true },
          { id: 'c2', text: 'She was the newest arrival', isCorrect: false },
          { id: 'c3', text: 'She was the brightest color', isCorrect: false },
          { id: 'c4', text: 'She was the smallest sock', isCorrect: false }
        ]
      }
    ]
  }
];