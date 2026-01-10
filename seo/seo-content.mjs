export const site = {
  name: 'QuestLayer',
  baseUrl: 'https://questlayer.app',
  ogImage: '/qlayer.jpeg',
  dashboardUrl: '/dashboard'
};

export const corePages = [
  {
    slug: 'quest-widget',
    keyword: 'quest widget',
    title: 'Quest widget for guided missions | QuestLayer',
    description: 'Launch a quest widget that turns any site into a guided mission hub with XP, streaks, and rewards.',
    definition:
      'QuestLayer delivers a quest widget you can embed to guide users through missions, collect proof, and reward progress without rebuilding your site.',
    steps: [
      'Connect your project, theme the widget, and select placement.',
      'Add quests, tasks, and XP rewards with clear completion rules.',
      'Embed once and track progress, streaks, and completions.'
    ],
    benefits: [
      'Launch quest flows without engineering a custom UI.',
      'Turn onboarding into a visible, rewarding journey.',
      'Measure which tasks drive retention and wallet connects.'
    ],
    useCases: ['web3', 'saas', 'community'],
    templates: ['daily-login', 'twitter-share'],
    features: ['quests', 'tasks', 'xp'],
    docs: ['getting-started', 'embed-widget'],
    faqs: [
      {
        question: 'What is a quest widget?',
        answer:
          'A quest widget is an embeddable UI that lists missions, rewards completion, and tracks progress inside any site.'
      },
      {
        question: 'Can I brand the quest widget?',
        answer:
          'Yes. You can theme colors, placement, and task visuals to match your product experience.'
      },
      {
        question: 'How is progress tracked?',
        answer:
          'QuestLayer records task completion and XP so users can continue across sessions.'
      }
    ]
  },
  {
    slug: 'task-widget',
    keyword: 'task widget',
    title: 'Task widget to activate users | QuestLayer',
    description: 'Deploy a task widget that highlights the exact actions you want users to finish, with XP and streak tracking.',
    definition:
      'QuestLayer makes a task widget that sits on your site and guides users through specific actions that increase adoption and retention.',
    steps: [
      'Pick the tasks that move activation forward.',
      'Assign XP values and completion links for each task.',
      'Embed the widget and let users check off progress.'
    ],
    benefits: [
      'Turn scattered onboarding into a clear checklist.',
      'Increase completion rates with visible progress.',
      'Tie each task to measurable outcomes.'
    ],
    useCases: ['saas', 'education', 'ecommerce'],
    templates: ['twitter-share', 'referral-campaign'],
    features: ['tasks', 'rewards', 'referrals'],
    docs: ['embed-widget', 'customize-theme'],
    faqs: [
      {
        question: 'How is a task widget different from a quest widget?',
        answer: 'Task widgets focus on specific actions, while quest widgets group tasks into a broader mission flow.'
      },
      {
        question: 'Can tasks link out to external destinations?',
        answer: 'Yes. Each task can open a link, trigger an integration, or collect proof.'
      },
      {
        question: 'Do users need an account to complete tasks?',
        answer: 'No. You can start with anonymous tasks and add wallet login when needed.'
      }
    ]
  },
  {
    slug: 'embed-quests',
    keyword: 'embed quests',
    title: 'Embed quests on any website | QuestLayer',
    description: 'Embed quests on any website with a single script and offer XP, streaks, and rewards instantly.',
    definition:
      'QuestLayer lets you embed quests as a lightweight widget so users can discover, start, and finish missions without leaving your site.',
    steps: [
      'Choose a quest template or build your own flow.',
      'Customize tasks, rewards, and visuals.',
      'Paste the embed script and go live.'
    ],
    benefits: [
      'Turn static pages into interactive mission hubs.',
      'Increase time on site with clear goals.',
      'Launch quests without engineering new pages.'
    ],
    useCases: ['web3', 'community', 'games'],
    templates: ['discord-join', 'daily-login'],
    features: ['quests', 'wallet-login', 'rewards'],
    docs: ['embed-widget', 'daily-tasks'],
    faqs: [
      {
        question: 'How do I embed quests on my site?',
        answer: 'Add the QuestLayer script, then configure the widget in the dashboard.'
      },
      {
        question: 'Will the widget work with any site builder?',
        answer: 'Yes. It is a lightweight embed that works with most web platforms.'
      },
      {
        question: 'Can I update quests without touching code?',
        answer: 'Updates are managed in the dashboard and reflected instantly.'
      }
    ]
  },
  {
    slug: 'embed-tasks',
    keyword: 'embed tasks',
    title: 'Embed tasks with XP rewards | QuestLayer',
    description: 'Embed tasks directly in your product to drive daily actions, completions, and referrals.',
    definition:
      'QuestLayer gives you an embeddable task flow so users can complete actions, earn XP, and build momentum inside your product.',
    steps: [
      'Create tasks tied to activation or retention.',
      'Set XP rewards and completion triggers.',
      'Embed the task list anywhere users need it.'
    ],
    benefits: [
      'Drive completion of your most important actions.',
      'Make progress visible without building custom UI.',
      'Keep users coming back with streaks and rewards.'
    ],
    useCases: ['saas', 'games', 'community'],
    templates: ['daily-login', 'discord-join'],
    features: ['tasks', 'streaks', 'xp'],
    docs: ['embed-widget', 'streaks'],
    faqs: [
      {
        question: 'Do embedded tasks require custom engineering?',
        answer: 'No. QuestLayer provides the widget and embed script so you can launch fast.'
      },
      {
        question: 'Can I change tasks after launch?',
        answer: 'Yes. Edits in the dashboard update the widget immediately.'
      },
      {
        question: 'Will tasks track progress across devices?',
        answer: 'Progress can sync per user when wallet login is enabled.'
      }
    ]
  },
  {
    slug: 'daily-task-widget',
    keyword: 'daily task widget',
    title: 'Daily task widget for habit loops | QuestLayer',
    description: 'Launch a daily task widget that keeps users returning with streaks, XP, and evolving rewards.',
    definition:
      'QuestLayer powers a daily task widget that highlights the next action users should take every day, turning engagement into a habit.',
    steps: [
      'Pick the daily action you want repeated.',
      'Set streak rewards and XP pacing.',
      'Embed the widget and watch daily activity rise.'
    ],
    benefits: [
      'Create predictable daily traffic and usage.',
      'Reward consistency with visible streaks.',
      'Highlight the single most important action each day.'
    ],
    useCases: ['education', 'saas', 'community'],
    templates: ['daily-login', 'twitter-share'],
    features: ['streaks', 'tasks', 'rewards'],
    docs: ['daily-tasks', 'streaks'],
    faqs: [
      {
        question: 'What makes a daily task widget effective?',
        answer: 'Daily tasks focus attention on one action and reinforce it with streak rewards.'
      },
      {
        question: 'Can I rotate the daily task?',
        answer: 'Yes. You can update the daily task at any time in the dashboard.'
      },
      {
        question: 'Do users see past streak history?',
        answer: 'The widget shows current streak progress and XP earned.'
      }
    ]
  },
  {
    slug: 'streak-widget',
    keyword: 'streak widget',
    title: 'Streak widget that boosts retention | QuestLayer',
    description: 'Use a streak widget to keep users coming back with visible progress, daily rewards, and tiered XP.',
    definition:
      'QuestLayer offers a streak widget that displays consecutive activity and rewards users for consistency across sessions.',
    steps: [
      'Choose the streak behavior and reward cadence.',
      'Tie streaks to tasks or daily claims.',
      'Embed the widget and highlight streak progress.'
    ],
    benefits: [
      'Drive return visits with clear streak milestones.',
      'Reward users before they churn.',
      'Create shareable progress moments.'
    ],
    useCases: ['games', 'web3', 'education'],
    templates: ['daily-login', 'referral-campaign'],
    features: ['streaks', 'xp', 'rewards'],
    docs: ['streaks', 'rewards'],
    faqs: [
      {
        question: 'How are streaks calculated?',
        answer: 'Streaks increment when users complete the daily action or claim on schedule.'
      },
      {
        question: 'Can I cap the streak length?',
        answer: 'Yes. You can control how streak levels loop or reset.'
      },
      {
        question: 'Do streaks work without wallet login?',
        answer: 'Yes, but wallet login enables cross-device tracking.'
      }
    ]
  },
  {
    slug: 'rewards-widget',
    keyword: 'rewards widget',
    title: 'Rewards widget for engaged users | QuestLayer',
    description: 'Offer a rewards widget that turns completed tasks into XP, perks, and on-chain incentives.',
    definition:
      'QuestLayer provides a rewards widget that highlights what users earn for completing quests, streaks, and referrals.',
    steps: [
      'Define reward tiers and XP thresholds.',
      'Match rewards to tasks and streaks.',
      'Embed the widget to show earned perks.'
    ],
    benefits: [
      'Make incentives visible at the moment of action.',
      'Connect rewards directly to your product goals.',
      'Scale rewards without building custom UI.'
    ],
    useCases: ['web3', 'ecommerce', 'community'],
    templates: ['referral-campaign', 'nft-holder-only'],
    features: ['rewards', 'xp', 'referrals'],
    docs: ['rewards', 'security'],
    faqs: [
      {
        question: 'What types of rewards can I offer?',
        answer: 'You can offer XP, digital perks, discounts, or token rewards.'
      },
      {
        question: 'Can I gate rewards to wallet holders?',
        answer: 'Yes. NFT gating and wallet login are supported.'
      },
      {
        question: 'How do users claim rewards?',
        answer: 'Rewards can be claimed inside the widget or routed to your preferred flow.'
      }
    ]
  },
  {
    slug: 'gamification-widget',
    keyword: 'gamification widget',
    title: 'Gamification widget for retention | QuestLayer',
    description: 'Add a gamification widget that combines quests, XP, levels, and rewards in one embed.',
    definition:
      'QuestLayer unifies quests, XP, and rewards into a gamification widget that turns product actions into an engaging game loop.',
    steps: [
      'Design quests that map to your product journey.',
      'Assign XP and tiered rewards.',
      'Embed the widget and activate users.'
    ],
    benefits: [
      'Increase activation with visible progression.',
      'Make product engagement feel like a game.',
      'Launch gamified experiences without heavy builds.'
    ],
    useCases: ['saas', 'games', 'education'],
    templates: ['daily-login', 'discord-join'],
    features: ['xp', 'quests', 'rewards'],
    docs: ['getting-started', 'daily-tasks'],
    faqs: [
      {
        question: 'Does the gamification widget replace my UI?',
        answer: 'No. It complements your UI by layering progression on top of existing actions.'
      },
      {
        question: 'Can I control XP pacing?',
        answer: 'Yes. You can set XP values and thresholds per task.'
      },
      {
        question: 'Is the widget mobile friendly?',
        answer: 'Yes. The embed adapts to mobile and desktop layouts.'
      }
    ]
  },
  {
    slug: 'web3-quest-widget',
    keyword: 'web3 quest widget',
    title: 'Web3 quest widget for on-chain growth | QuestLayer',
    description: 'Deploy a Web3 quest widget that connects wallets, rewards on-chain actions, and grows community participation.',
    definition:
      'QuestLayer is a Web3 quest widget built for wallet login, NFT gating, and on-chain reward experiences embedded on any site.',
    steps: [
      'Enable wallet login and optional NFT gating.',
      'Build quests tied to on-chain actions.',
      'Embed the widget and track XP across wallets.'
    ],
    benefits: [
      'Increase wallet connections with targeted quests.',
      'Reward on-chain activity without custom dapps.',
      'Unify quest progress across protocols.'
    ],
    useCases: ['web3', 'community', 'games'],
    templates: ['nft-holder-only', 'discord-join'],
    features: ['wallet-login', 'nft-gating', 'quests'],
    docs: ['walletconnect', 'security'],
    faqs: [
      {
        question: 'Does the Web3 quest widget support wallet login?',
        answer: 'Yes. Wallet login is built in and optional per widget.'
      },
      {
        question: 'Can I restrict quests to NFT holders?',
        answer: 'Yes. NFT gating lets you limit quests to specific collections.'
      },
      {
        question: 'How is on-chain activity validated?',
        answer: 'QuestLayer can link tasks to wallet actions or off-chain proofs.'
      }
    ]
  }
];

export const featurePages = [
  {
    slug: 'quests',
    title: 'Quest campaigns',
    description: 'Design multi-step quest flows that guide users from first visit to activation.',
    highlights: [
      'Group tasks into themed quests for onboarding or launches.',
      'Show quest progress inside the widget for quick wins.',
      'Ship new quests without code deployments.'
    ],
    relatedCore: ['quest-widget', 'embed-quests', 'gamification-widget']
  },
  {
    slug: 'tasks',
    title: 'Task composer',
    description: 'Create clear, measurable tasks that users can finish inside your product.',
    highlights: [
      'Add links, proof requirements, and XP rewards.',
      'Prioritize tasks that drive activation.',
      'Reorder tasks instantly from the dashboard.'
    ],
    relatedCore: ['task-widget', 'embed-tasks', 'daily-task-widget']
  },
  {
    slug: 'xp',
    title: 'XP and levels',
    description: 'Reward every completion with XP and show progress toward the next level.',
    highlights: [
      'Tune XP pacing for quick wins or longer journeys.',
      'Make progress visible across quests and tasks.',
      'Celebrate levels with clear milestones.'
    ],
    relatedCore: ['quest-widget', 'gamification-widget', 'rewards-widget']
  },
  {
    slug: 'streaks',
    title: 'Streak mechanics',
    description: 'Keep users returning with daily streaks and escalating rewards.',
    highlights: [
      'Reward consistency with dynamic streak tiers.',
      'Reset or loop streaks based on your strategy.',
      'Pair streaks with daily tasks for habit loops.'
    ],
    relatedCore: ['streak-widget', 'daily-task-widget', 'embed-tasks']
  },
  {
    slug: 'rewards',
    title: 'Rewards engine',
    description: 'Surface rewards at the right moment to motivate completion.',
    highlights: [
      'Connect rewards to XP thresholds or task milestones.',
      'Use digital perks, discounts, or on-chain rewards.',
      'Track reward progress in the widget.'
    ],
    relatedCore: ['rewards-widget', 'quest-widget', 'gamification-widget']
  },
  {
    slug: 'referrals',
    title: 'Referral missions',
    description: 'Turn referrals into quest steps that grow your community.',
    highlights: [
      'Reward users for inviting teammates or friends.',
      'Track referrals as tasks inside the widget.',
      'Layer referral XP with streak bonuses.'
    ],
    relatedCore: ['task-widget', 'rewards-widget', 'embed-tasks']
  },
  {
    slug: 'nft-gating',
    title: 'NFT gating',
    description: 'Gate quests and rewards to specific NFT holders.',
    highlights: [
      'Unlock private quests for collectors.',
      'Offer exclusive rewards inside the widget.',
      'Combine gating with wallet login.'
    ],
    relatedCore: ['web3-quest-widget', 'rewards-widget', 'quest-widget']
  },
  {
    slug: 'wallet-login',
    title: 'Wallet login',
    description: 'Connect wallets to track progress and sync XP globally.',
    highlights: [
      'Let users continue progress across devices.',
      'Tie on-chain actions to quest completion.',
      'Enable gated rewards and personalization.'
    ],
    relatedCore: ['web3-quest-widget', 'embed-quests', 'quest-widget']
  }
];

export const useCasePages = [
  {
    slug: 'web3',
    title: 'Web3 teams',
    description: 'Activate wallets and drive on-chain actions with quests embedded on your site.',
    outcomes: [
      'Increase wallet connects and NFT claims.',
      'Guide users through protocol onboarding.',
      'Track XP across chains and campaigns.'
    ]
  },
  {
    slug: 'saas',
    title: 'SaaS products',
    description: 'Guide new users through key actions that improve retention and expansion.',
    outcomes: [
      'Reduce time to first value.',
      'Promote feature adoption with visible tasks.',
      'Reward power users and champions.'
    ]
  },
  {
    slug: 'community',
    title: 'Communities',
    description: 'Turn community actions into quests that keep members engaged.',
    outcomes: [
      'Drive participation in Discord, forums, or events.',
      'Reward members for consistent contributions.',
      'Spot top contributors with XP.'
    ]
  },
  {
    slug: 'games',
    title: 'Games and live ops',
    description: 'Run seasonal quest campaigns that keep players active.',
    outcomes: [
      'Increase daily active players with streaks.',
      'Launch new quest drops without updates.',
      'Reward players for inviting friends.'
    ]
  },
  {
    slug: 'ecommerce',
    title: 'Ecommerce',
    description: 'Turn shopping actions into quests that boost conversion and loyalty.',
    outcomes: [
      'Reward reviews, shares, and referrals.',
      'Drive repeat purchases with streaks.',
      'Create VIP quests for loyal buyers.'
    ]
  },
  {
    slug: 'education',
    title: 'Education',
    description: 'Motivate learners with daily tasks, streaks, and visible progress.',
    outcomes: [
      'Increase lesson completion rates.',
      'Make learning progress feel rewarding.',
      'Celebrate consistency with streak rewards.'
    ]
  }
];

export const templatePages = [
  {
    slug: 'daily-login',
    title: 'Daily login',
    description: 'Reward users for coming back every day with a simple daily claim loop.',
    preview: ['Task: Open the product', 'Reward: +150 XP', 'Streak: 5 day loop'],
    coreLink: 'daily-task-widget',
    featureLink: 'streaks'
  },
  {
    slug: 'twitter-share',
    title: 'Twitter share',
    description: 'Grow awareness by rewarding users for sharing updates on X.',
    preview: ['Task: Share your latest launch', 'Reward: +250 XP', 'Proof: Link to post'],
    coreLink: 'task-widget',
    featureLink: 'tasks'
  },
  {
    slug: 'discord-join',
    title: 'Discord join',
    description: 'Drive community growth by tracking Discord joins as a quest step.',
    preview: ['Task: Join the Discord', 'Reward: +200 XP', 'Proof: Invite link'],
    coreLink: 'embed-quests',
    featureLink: 'quests'
  },
  {
    slug: 'referral-campaign',
    title: 'Referral campaign',
    description: 'Turn referrals into a repeatable quest with escalating rewards.',
    preview: ['Task: Invite 3 teammates', 'Reward: +500 XP', 'Bonus: Referral badge'],
    coreLink: 'rewards-widget',
    featureLink: 'referrals'
  },
  {
    slug: 'nft-holder-only',
    title: 'NFT holder only',
    description: 'Gate quests so only verified NFT holders can participate.',
    preview: ['Gate: NFT collection', 'Reward: Exclusive XP tier', 'Unlock: Private quests'],
    coreLink: 'web3-quest-widget',
    featureLink: 'nft-gating'
  }
];

export const docsPages = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    description: 'Launch your first QuestLayer widget from setup to embed.',
    steps: [
      'Create a new project and name your widget.',
      'Add tasks, XP values, and rewards.',
      'Copy the embed script into your site.'
    ],
    tips: [
      'Start with 3 to 5 tasks for fast wins.',
      'Use streaks to encourage daily returns.'
    ],
    relatedCore: ['quest-widget', 'embed-quests']
  },
  {
    slug: 'embed-widget',
    title: 'Embed widget',
    description: 'Embed the QuestLayer widget in any site builder or app.',
    steps: [
      'Grab the embed script from the dashboard.',
      'Paste the script into your site header or body.',
      'Confirm the widget loads and tasks render.'
    ],
    tips: [
      'Use the preview to verify placement.',
      'Keep one widget per page for clarity.'
    ],
    relatedCore: ['quest-widget', 'embed-tasks']
  },
  {
    slug: 'customize-theme',
    title: 'Customize theme',
    description: 'Match the widget to your brand with colors, layout, and typography.',
    steps: [
      'Select a theme preset in the builder.',
      'Adjust accent colors and contrast.',
      'Preview in desktop and mobile modes.'
    ],
    tips: [
      'Keep contrast high for accessibility.',
      'Use the same accent color as your primary CTA.'
    ],
    relatedCore: ['task-widget', 'gamification-widget']
  },
  {
    slug: 'daily-tasks',
    title: 'Daily tasks',
    description: 'Create daily actions that keep users returning.',
    steps: [
      'Pick the one action that matters most each day.',
      'Assign a daily XP reward.',
      'Pair the task with a streak bonus.'
    ],
    tips: [
      'Rotate daily tasks weekly to avoid fatigue.',
      'Use clear labels so users know the reward.'
    ],
    relatedCore: ['daily-task-widget', 'streak-widget']
  },
  {
    slug: 'streaks',
    title: 'Streaks',
    description: 'Use streaks to reward consistent engagement.',
    steps: [
      'Enable streaks in the widget settings.',
      'Set streak length and reward tiers.',
      'Track streak progress in the dashboard.'
    ],
    tips: [
      'Keep streak ranges short for early wins.',
      'Use reminders in your product UX.'
    ],
    relatedCore: ['streak-widget', 'daily-task-widget']
  },
  {
    slug: 'rewards',
    title: 'Rewards',
    description: 'Configure rewards that motivate completion.',
    steps: [
      'Define reward tiers tied to XP.',
      'Attach rewards to specific quests or tasks.',
      'Announce rewards in your community.'
    ],
    tips: [
      'Mix tangible and digital rewards.',
      'Update rewards seasonally.'
    ],
    relatedCore: ['rewards-widget', 'quest-widget']
  },
  {
    slug: 'walletconnect',
    title: 'Wallet connect',
    description: 'Enable wallet login to sync progress across devices.',
    steps: [
      'Add your wallet provider settings.',
      'Enable wallet login in the widget config.',
      'Test wallet connections in preview mode.'
    ],
    tips: [
      'Explain why wallet login unlocks rewards.',
      'Pair wallet login with NFT gating.'
    ],
    relatedCore: ['web3-quest-widget', 'quest-widget']
  },
  {
    slug: 'security',
    title: 'Security',
    description: 'Understand how QuestLayer keeps quest data secure.',
    steps: [
      'Limit access with role-based settings.',
      'Use wallet login for verified progress.',
      'Review audit logs for changes.'
    ],
    tips: [
      'Rotate API keys regularly.',
      'Limit admin access to trusted teammates.'
    ],
    relatedCore: ['rewards-widget', 'web3-quest-widget']
  }
];
