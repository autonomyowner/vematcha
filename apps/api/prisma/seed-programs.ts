import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const procrastinationProgram = {
  slug: 'procrastination-deep-dive',
  name: 'Procrastination Deep Dive',
  description: 'A 14-day program to understand and overcome your procrastination patterns using CBT techniques. Learn why you avoid tasks and build lasting habits for action.',
  durationDays: 14,
  modules: [
    {
      day: 1,
      title: 'Understanding Your Procrastination',
      content: 'Procrastination isn\'t laziness - it\'s emotional regulation. When we avoid tasks, we\'re actually avoiding uncomfortable emotions associated with them. Today we identify YOUR specific triggers and the emotions behind them.',
      exercise: {
        title: 'Trigger Mapping',
        steps: [
          'List 3 tasks you\'ve been avoiding this week',
          'For each task, write the emotion you feel when you think about starting (anxiety, boredom, fear of failure, overwhelm)',
          'Rate the discomfort 1-10',
          'Notice patterns - is it always fear? Overwhelm? Perfectionism?',
        ],
      },
    },
    {
      day: 2,
      title: 'The Comfort Zone Trap',
      content: 'Your brain prefers certainty over growth. Avoidance creates a false sense of safety - you feel relief in the moment but anxiety builds long-term. Today we challenge this cycle with exposure.',
      exercise: {
        title: '5-Minute Exposure',
        steps: [
          'Choose your smallest avoided task from yesterday',
          'Set a timer for exactly 5 minutes',
          'Work on it without stopping - no checking phone, no breaks',
          'When timer ends, ask: was it as bad as you imagined?',
          'Write one sentence about what you noticed',
        ],
      },
    },
    {
      day: 3,
      title: 'The Perfectionism Connection',
      content: 'Perfectionism is procrastination in disguise. "I\'ll start when conditions are perfect" means never starting. Today we practice "good enough" thinking.',
      exercise: {
        title: 'Good Enough Challenge',
        steps: [
          'Choose a task you\'ve been perfecting (or avoiding because it won\'t be perfect)',
          'Set a "good enough" standard: what\'s the minimum viable version?',
          'Complete it to 70% - deliberately leave it imperfect',
          'Notice the discomfort - sit with it for 2 minutes',
          'Reflect: did the world end? Probably not.',
        ],
      },
    },
    {
      day: 4,
      title: 'Time Perception & Future Self',
      content: 'Procrastinators struggle with "temporal discounting" - future rewards feel less valuable than present comfort. Your future self seems like a stranger. Today we build connection.',
      exercise: {
        title: 'Future Self Letter',
        steps: [
          'Write a letter FROM your future self (1 year from now)',
          'Describe how grateful you are that past-you took action',
          'Be specific about what\'s different in your life',
          'Read it aloud to yourself',
          'Keep it somewhere visible for the next week',
        ],
      },
    },
    {
      day: 5,
      title: 'The Role of Energy',
      content: 'We often procrastinate when our energy doesn\'t match the task. Creative work when exhausted = avoidance. Today we learn to match tasks to energy levels.',
      exercise: {
        title: 'Energy Mapping',
        steps: [
          'Track your energy level every 2 hours today (1-10)',
          'Note what you\'re doing at peak energy moments',
          'Identify your top 3 high-energy windows',
          'Tomorrow, schedule your most avoided task in a peak window',
        ],
      },
    },
    {
      day: 6,
      title: 'Breaking Tasks Down',
      content: 'Overwhelm is the #1 procrastination trigger. Big tasks feel impossible. Today we master the art of micro-steps - so small they\'re embarrassing.',
      exercise: {
        title: 'Micro-Step Breakdown',
        steps: [
          'Pick your most overwhelming task',
          'Break it into steps that take 2 minutes or less each',
          'If any step feels hard, break it smaller',
          'Do just the FIRST micro-step right now',
          'Celebrate - you\'ve started!',
        ],
      },
    },
    {
      day: 7,
      title: 'Week 1 Reflection',
      content: 'Halfway point! Let\'s consolidate what you\'ve learned about your procrastination patterns and what\'s working.',
      exercise: {
        title: 'Progress Check',
        steps: [
          'Review your notes from days 1-6',
          'What\'s your #1 procrastination trigger?',
          'Which exercise helped most?',
          'What surprised you about your patterns?',
          'Set one intention for week 2',
        ],
      },
    },
    {
      day: 8,
      title: 'Implementation Intentions',
      content: 'Vague plans fail. "I\'ll work on it tomorrow" never happens. Today we learn IF-THEN planning - the most research-backed anti-procrastination technique.',
      exercise: {
        title: 'IF-THEN Planning',
        steps: [
          'Choose a task you typically avoid',
          'Create an IF-THEN statement: "IF [specific time/situation], THEN I will [specific action]"',
          'Example: "IF it\'s 9am and I\'ve finished breakfast, THEN I will open my laptop and write for 15 minutes"',
          'Write 3 IF-THEN statements for tomorrow',
          'Set phone reminders for each trigger moment',
        ],
      },
    },
    {
      day: 9,
      title: 'Temptation Bundling',
      content: 'Pair something you WANT to do with something you NEED to do. This hack uses your brain\'s reward system to make boring tasks appealing.',
      exercise: {
        title: 'Bundle Creation',
        steps: [
          'List 3 things you love doing (podcast, music, coffee shop, etc.)',
          'List 3 tasks you typically avoid',
          'Create bundles: "I only listen to [favorite podcast] while [doing avoided task]"',
          'Try one bundle today',
          'Rate how it felt compared to doing the task alone',
        ],
      },
    },
    {
      day: 10,
      title: 'Accountability Systems',
      content: 'We\'re social creatures. External accountability dramatically increases follow-through. Today we set up systems that make procrastination harder.',
      exercise: {
        title: 'Accountability Setup',
        steps: [
          'Identify someone who could be an accountability partner',
          'Send them a message right now: "I\'m working on X. Can I tell you my weekly goal?"',
          'If no one available, use a public commitment (post on social media, or write in a journal you share)',
          'Schedule a weekly 5-minute check-in',
        ],
      },
    },
    {
      day: 11,
      title: 'Dealing with Setbacks',
      content: 'You WILL procrastinate again. Self-compassion, not self-criticism, helps you recover faster. Today we practice the art of the restart.',
      exercise: {
        title: 'Compassionate Restart',
        steps: [
          'Think of a recent procrastination episode',
          'Write what you\'d say to a friend who did the same thing',
          'Now say that to yourself - out loud',
          'Ask: what was the real need I was meeting by avoiding?',
          'What could meet that need without avoidance next time?',
        ],
      },
    },
    {
      day: 12,
      title: 'Environment Design',
      content: 'Willpower is overrated. Environment design is underrated. Make the right choice the easy choice by changing your surroundings.',
      exercise: {
        title: 'Environment Audit',
        steps: [
          'Go to where you typically work (or avoid working)',
          'List 5 things that distract you or trigger avoidance',
          'For each: what\'s one change that removes or reduces it?',
          'Implement at least 2 changes right now',
          'Example: phone in another room, website blocker installed, headphones ready',
        ],
      },
    },
    {
      day: 13,
      title: 'Identity Shift',
      content: 'You\'re not "a procrastinator." You\'re someone who sometimes procrastinates. Today we work on identity-level change.',
      exercise: {
        title: 'Identity Reframe',
        steps: [
          'Write "I am a procrastinator" on paper',
          'Cross it out and write "I am someone learning to take action"',
          'List 3 times recently when you DID take action (even small)',
          'For each, write: "I am the kind of person who..."',
          'Example: "I am the kind of person who starts even when I don\'t feel ready"',
        ],
      },
    },
    {
      day: 14,
      title: 'Your Anti-Procrastination System',
      content: 'Congratulations! You\'ve learned the core concepts. Now let\'s consolidate everything into YOUR personalized system for lasting change.',
      exercise: {
        title: 'System Design',
        steps: [
          'Write your top 3 procrastination triggers',
          'For each trigger, write your go-to intervention (from what worked in this program)',
          'Create 3 IF-THEN plans for your most common situations',
          'Schedule a weekly 10-minute review in your calendar',
          'Set a reminder to revisit this program in 30 days',
        ],
      },
    },
  ],
};

async function main() {
  console.log('Seeding programs...');

  await prisma.program.upsert({
    where: { slug: 'procrastination-deep-dive' },
    update: procrastinationProgram,
    create: procrastinationProgram,
  });

  console.log('Programs seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
