import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const loadEnvFile = (filepath) => {
  if (!fs.existsSync(filepath)) return {};
  const raw = fs.readFileSync(filepath, 'utf8');
  const entries = raw.split('\n');
  const env = {};
  for (const line of entries) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
};

const cwd = process.cwd();
const envFromFile = loadEnvFile(path.join(cwd, '.env.local'));

const supabaseUrl = process.env.VITE_SUPABASE_URL || envFromFile.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || envFromFile.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment or .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

const ensureProject = async ({ name, domain, theme, position, accentColor }) => {
  const { data: existing, error: existingError } = await supabase
    .from('projects')
    .select('id')
    .eq('name', name)
    .eq('domain', domain)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from('projects')
    .insert({
      name,
      domain,
      theme,
      position,
      accent_color: accentColor
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return inserted.id;
};

const seedTasks = async (projectId, tasks, projectLabel) => {
  const { count, error: countError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (countError) throw countError;
  if (count && count > 0) {
    console.log(`Tasks already exist for ${projectLabel} (${projectId}). Skipping.`);
    return;
  }

  const payload = tasks.map(task => ({ ...task, project_id: projectId }));
  const { error: tasksError } = await supabase.from('tasks').insert(payload);
  if (tasksError) throw tasksError;
  console.log(`Inserted ${tasks.length} tasks for ${projectLabel} (${projectId}).`);
};

const main = async () => {
  const galxeProjectId = await ensureProject({
    name: 'Galxe',
    domain: 'galxe.com',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#6366f1'
  });
  await seedTasks(
    galxeProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://x.com/Galxe',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Join Discord',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://discord.com/invite/galxe',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Join Telegram',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://t.me/Galxe',
        xp_reward: 50,
        order_index: 2
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Galxe?',
        answer: 'Web3 Infrastructure'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'How to earn rewards?',
        answer: 'By completing tasks'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'Is it decentralized?',
        answer: 'Yes'
      }
    ],
    'Galxe'
  );

  const magicEdenProjectId = await ensureProject({
    name: 'Magic Eden',
    domain: 'magiceden.io',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#ed1c24'
  });
  await seedTasks(
    magicEdenProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://twitter.com/MagicEden',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Join Discord',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://discord.gg/magiceden',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Visit Website',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://magiceden.io/',
        xp_reward: 50,
        order_index: 2
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Magic Eden?',
        answer: 'NFT Marketplace'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'Which chain supported?',
        answer: 'Solana, ETH, BTC'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'What can you trade?',
        answer: 'NFTs and Tokens'
      }
    ],
    'Magic Eden'
  );

  const aaveProjectId = await ensureProject({
    name: 'Aave',
    domain: 'aave.com',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#b6509e'
  });
  await seedTasks(
    aaveProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://x.com/aave',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Join Discord',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://discord.com/invite/aave',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Read Docs',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://aave.com/docs',
        xp_reward: 50,
        order_index: 2
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Aave?',
        answer: 'Lending Protocol'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'What is GHO?',
        answer: 'Native Stablecoin'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'How to earn interest?',
        answer: 'By supplying assets'
      }
    ],
    'Aave'
  );

  const curveProjectId = await ensureProject({
    name: 'Curve Finance',
    domain: 'curve.fi',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#ffffff'
  });
  await seedTasks(
    curveProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://twitter.com/curvefinance',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Join Discord',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://discord.gg/rgrfS7W',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Join Telegram',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://t.me/curvefiann',
        xp_reward: 50,
        order_index: 2
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Curve Finance?',
        answer: 'Stablecoin DEX'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'Which assets are supported?',
        answer: 'Stablecoins, WBTC, ETH'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'How to provide liquidity?',
        answer: 'By depositing to pools'
      }
    ],
    'Curve Finance'
  );

  const balancerProjectId = await ensureProject({
    name: 'Balancer',
    domain: 'balancer.fi',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#6366f1'
  });
  await seedTasks(
    balancerProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://x.com/Balancer',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Read Docs',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://docs.balancer.fi/',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'GitHub',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://github.com/balancer',
        xp_reward: 50,
        order_index: 2
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Balancer?',
        answer: 'DeFi Protocol'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'What is a Balancer Pool?',
        answer: 'A multi-token AMM pool'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'How to swap tokens?',
        answer: 'Using the Swap interface'
      }
    ],
    'Balancer'
  );

  const compoundProjectId = await ensureProject({
    name: 'Compound',
    domain: 'compound.finance',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#00d395'
  });
  await seedTasks(
    compoundProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://twitter.com/compoundfinance',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Read Docs',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://docs.compound.finance/',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Open App',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://app.compound.finance/',
        xp_reward: 50,
        order_index: 2
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Compound?',
        answer: 'Lending Protocol'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'How to earn COMP?',
        answer: 'By supplying or borrowing'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'Is it decentralized?',
        answer: 'Yes, DAO governed'
      }
    ],
    'Compound'
  );

  const sushiProjectId = await ensureProject({
    name: 'Sushi',
    domain: 'sushi.com',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#fa52a0'
  });
  await seedTasks(
    sushiProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://twitter.com/SushiSwap',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Visit Website',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://www.sushi.com/',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Sushi?',
        answer: 'DEX & DeFi Hub'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'Which chains supported?',
        answer: 'Multi-chain (30+)'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'What is BentoBox?',
        answer: 'A token vault system'
      }
    ],
    'Sushi'
  );

  const mirrorProjectId = await ensureProject({
    name: 'Mirror',
    domain: 'mirror.xyz',
    theme: 'sleek',
    position: 'bottom-right',
    accentColor: '#007aff'
  });
  await seedTasks(
    mirrorProjectId,
    [
      {
        title: 'Follow on X',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://twitter.com/mirror_xyz',
        xp_reward: 50,
        order_index: 0
      },
      {
        title: 'Visit Website',
        task_kind: 'link',
        task_section: 'missions',
        link: 'https://mirror.xyz/',
        xp_reward: 50,
        order_index: 1
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 0,
        question: 'What is Mirror?',
        answer: 'Web3 Publishing Platform'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 1,
        question: 'How to publish?',
        answer: 'Connect wallet and write'
      },
      {
        title: 'Onboarding Quiz',
        task_kind: 'quiz',
        task_section: 'onboarding',
        xp_reward: 100,
        order_index: 2,
        question: 'Is it on-chain?',
        answer: 'Yes, content on Arweave'
      }
    ],
    'Mirror'
  );
};

main().catch((error) => {
  console.error('Seed failed:', error?.message || error);
  process.exit(1);
});
