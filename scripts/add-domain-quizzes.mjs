import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const QUIZ_DATA = [
  {
    domain: "aave.com",
    quizzes: [
      {
        question: "What type of protocol is Aave?",
        choices: ["NFT marketplace", "Lending & borrowing protocol", "Gaming platform"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What can users do on Aave?",
        choices: ["Register domains", "Lend and borrow crypto assets", "Mint NFTs"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What is AAVE mainly used for?",
        choices: ["Game rewards", "Governance voting", "Paying gas fees"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "How do users earn yield on Aave?",
        choices: ["Staking NFTs", "Supplying assets to pools", "Mining Bitcoin"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "Aave operates using what technology?",
        choices: ["Central servers", "Smart contracts on blockchain"],
        correctChoice: 1,
        xp: 100
      }
    ]
  },
  {
    domain: "uniswap.com",
    quizzes: [
      {
        question: "What is Uniswap mainly used for?",
        choices: ["Crypto swapping (DEX)", "Cloud storage", "NFT gaming"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "How do users trade on Uniswap?",
        choices: ["With email accounts", "With a crypto wallet", "With bank login"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What system does Uniswap use?",
        choices: ["Order book", "AMM liquidity pools", "Auction system"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What is Uniswap’s token?",
        choices: ["CAKE", "UNI", "AAVE"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What can users provide to earn fees?",
        choices: ["Domains", "Liquidity to pools", "NFTs"],
        correctChoice: 1,
        xp: 100
      }
    ]
  },
  {
    domain: "coincollect.app",
    quizzes: [
      {
        question: "What is CoinCollect mainly focused on?",
        choices: ["NFT and token reward platform", "Email hosting", "Stock trading"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "What can users do on CoinCollect?",
        choices: ["Stake NFTs for rewards", "Book hotels", "Mine Bitcoin"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "What kind of rewards can be earned?",
        choices: ["Airline miles", "Tokens and NFTs", "Gift cards only"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What are “Community Collections”?",
        choices: ["Blog posts", "NFT staking pools for rewards", "Domain lists"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "CoinCollect connects most with which space?",
        choices: ["Web2 SaaS", "Web3 & NFTs"],
        correctChoice: 1,
        xp: 100
      }
    ]
  },
  {
    domain: "pancakeswap.finance",
    quizzes: [
      {
        question: "What is PancakeSwap?",
        choices: ["Decentralized exchange on BNB Chain", "Central bank app", "NFT museum"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "What can users do there?",
        choices: ["Swap tokens", "Register ENS names", "Trade stocks"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "What token is native to PancakeSwap?",
        choices: ["UNI", "CAKE", "ETH"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "Why is PancakeSwap popular?",
        choices: ["High gas fees", "Lower transaction costs", "Free NFTs"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "PancakeSwap mainly runs on which chain?",
        choices: ["Ethereum", "BNB Smart Chain", "Bitcoin"],
        correctChoice: 1,
        xp: 100
      }
    ]
  },
  {
    domain: "ens.domains",
    quizzes: [
      {
        question: "What does ENS stand for?",
        choices: ["Ethereum Name Service", "Encrypted Network System", "Easy Node Setup"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "What does ENS provide?",
        choices: ["Crypto loans", "Human-readable wallet names", "NFT staking"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "ENS replaces what with names?",
        choices: ["Email addresses", "Long wallet addresses", "Phone numbers"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "ENS works on which blockchain?",
        choices: ["Solana", "Ethereum", "BNB Chain"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "An ENS name often ends with?",
        choices: [".com", ".eth", ".crypto"],
        correctChoice: 1,
        xp: 100
      }
    ]
  },
  {
    domain: "galxe.com",
    quizzes: [
      {
        question: "What is Galxe mainly used for?",
        choices: ["Web3 growth campaigns", "Food delivery", "VPN service"],
        correctChoice: 0,
        xp: 100
      },
      {
        question: "What are Galxe Quests?",
        choices: ["Browser games", "Reward-based Web3 tasks", "Crypto loans"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What is Galxe Passport?",
        choices: ["Travel app", "Web3 identity system", "Exchange wallet"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "What does Galxe Score represent?",
        choices: ["Token price", "User reputation score", "NFT rarity"],
        correctChoice: 1,
        xp: 100
      },
      {
        question: "Who uses Galxe?",
        choices: ["Web3 projects for community growth", "Only gamers", "Only banks"],
        correctChoice: 0,
        xp: 100
      }
    ]
  }
];

// ------------------------------------------------------------------

const loadEnvFile = async (filepath) => {
  try {
    const raw = await fs.readFile(filepath, 'utf8');
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
  } catch {
    return {};
  }
};

const normalizeDomain = (domain) => {
  if (!domain) return '';
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '').toLowerCase();
};

const main = async () => {
  const envLocal = await loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  const env = await loadEnvFile(path.resolve(process.cwd(), '.env'));
  const mergedEnv = { ...process.env, ...env, ...envLocal };
  
  const supabaseUrl = mergedEnv.VITE_SUPABASE_URL || mergedEnv.SUPABASE_URL;
  const supabaseKey = mergedEnv.SUPABASE_SERVICE_ROLE_KEY || mergedEnv.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase bağlantı bilgileri eksik.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Toplam ${QUIZ_DATA.length} domain için quizler işlenecek...\n`);

  for (const item of QUIZ_DATA) {
    const targetDomain = normalizeDomain(item.domain);
    console.log(`> İşleniyor: ${item.domain} (${targetDomain})`);

    // 1. Projeyi bul
    // Domain tam eşleşme veya www. ile/olmadan eşleşme kontrolü
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name, domain')
      .ilike('domain', `%${targetDomain}%`);

    if (projectError) {
      console.error(`  HATA: Proje aranırken hata oluştu: ${projectError.message}`);
      continue;
    }

    // En iyi eşleşmeyi bul (tam eşleşme öncelikli)
    const project = projects.find(p => normalizeDomain(p.domain) === targetDomain) || projects[0];

    if (!project) {
      console.error(`  UYARI: Bu domain için proje bulunamadı.`);
      continue;
    }

    console.log(`  Proje Bulundu: ${project.name} (ID: ${project.id})`);

    // 2. Mevcut onboarding görevlerini sil
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', project.id)
      .eq('task_section', 'onboarding');

    if (deleteError) {
      console.error(`  HATA: Eski görevler silinemedi: ${deleteError.message}`);
      continue;
    }
    console.log(`  Eski 'onboarding' görevleri temizlendi.`);

    // 3. Yeni Quizleri ekle
    let addedCount = 0;
    for (const quiz of item.quizzes) {
      const { question, choices, correctChoice, xp = 100 } = quiz;
      
      const taskPayload = {
        project_id: project.id,
        title: `Quiz: ${question.length > 30 ? question.substring(0, 27) + '...' : question}`,
        description: question,
        task_kind: 'quiz',
        quiz_type: 'multiple_choice',
        question: question,
        choices: choices,
        correct_choice: correctChoice,
        xp_reward: xp,
        task_section: 'onboarding',
        is_sponsored: false,
        reward_cadence: 'once'
      };

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(taskPayload);

      if (insertError) {
        console.error(`  HATA: Quiz eklenemedi "${question}": ${insertError.message}`);
      } else {
        addedCount++;
      }
    }
    console.log(`  => ${addedCount} quiz başarıyla eklendi.\n`);
  }
};

main();
