import { createClient } from '@supabase/supabase-js';
import { createPublicClient, getAddress, http, isAddress, parseAbi, verifyMessage } from 'viem';
import type { Address, Chain, Hex } from 'viem';
import { polygon } from 'viem/chains';

const LOOTBOX_CONTRACT = '0xcE9Ca2edfeC724B17582959cE4B8cf2B9F0d3cF8';
const LOOTBOX_CHAIN_ID = 137;

const erc721BalanceOfAbi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)'
]);

const parseBody = async (req: any) => {
  if (req.body) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return req.body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
};

const DEFAULT_RPC_URLS: Record<number, string> = {
  137: 'https://polygon-rpc.com'
};

const CHAIN_MAP: Record<number, Chain> = {
  137: polygon
};

const getRpcUrl = (chainId: number) => {
  const chainSpecific = process.env[`RPC_URL_${chainId}`];
  const fallback = process.env.RPC_URL;
  const defaultUrl = DEFAULT_RPC_URLS[chainId];
  return chainSpecific || fallback || defaultUrl || '';
};

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials.');
  }

  return createClient(supabaseUrl, supabaseKey);
};

const messageHas = (message: string, fragment: string) =>
  message.toLowerCase().includes(fragment.toLowerCase());

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: any = {};
  try {
    body = await parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body.' });
    return;
  }

  const { address, signature, message } = body || {};

  if (!address || !signature || !message) {
    res.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  if (!isAddress(address)) {
    res.status(400).json({ error: 'Invalid wallet address.' });
    return;
  }

  const normalizedAddress = getAddress(address);
  const contract = getAddress(LOOTBOX_CONTRACT);

  try {
    const isValid = await verifyMessage({
      address: normalizedAddress,
      message,
      signature: signature as Hex
    });
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature.' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Invalid signature.' });
    return;
  }

  if (!messageHas(message, `wallet: ${normalizedAddress.toLowerCase()}`)
    || !messageHas(message, `chain: ${LOOTBOX_CHAIN_ID}`)
    || !messageHas(message, `contract: ${contract}`)) {
    res.status(400).json({ error: 'Signature message mismatch.' });
    return;
  }

  const rpcUrl = getRpcUrl(LOOTBOX_CHAIN_ID);
  if (!rpcUrl) {
    res.status(500).json({ error: 'RPC URL not configured.' });
    return;
  }

  let balance: bigint;
  try {
    const client = createPublicClient({
      chain: CHAIN_MAP[LOOTBOX_CHAIN_ID],
      transport: http(rpcUrl)
    });
    balance = await client.readContract({
      address: contract as Address,
      abi: erc721BalanceOfAbi,
      functionName: 'balanceOf',
      args: [normalizedAddress as Address]
    } as any) as bigint;
  } catch (error: any) {
    res.status(502).json({
      error: 'On-chain check failed.',
      details: error?.shortMessage || error?.message || 'RPC error',
      chainId: LOOTBOX_CHAIN_ID
    });
    return;
  }

  if (balance <= 0n) {
    res.status(200).json({
      success: false,
      error: 'LootBox NFT required to use master claim.'
    });
    return;
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Server misconfigured.' });
    return;
  }

  const { data: userRows, error: userError } = await supabase
    .from('end_users')
    .select('id, project_id')
    .eq('wallet_address', normalizedAddress);

  if (userError) {
    res.status(500).json({ error: 'Failed to load user data.' });
    return;
  }

  const results: Array<{ projectId: string; period: 'daily' | 'weekly'; success: boolean; reward?: number; message?: string }> = [];
  let totalXp = 0;
  let totalClaimed = 0;

  for (const user of userRows || []) {
    const projectId = user.project_id;
    const userId = user.id;
    for (const period of ['daily', 'weekly'] as const) {
      try {
        const { data: claimResult, error: claimError } = await supabase.rpc('claim_leaderboard_reward', {
          p_user_id: userId,
          p_project_id: projectId,
          p_period_type: period
        });

        if (claimError) {
          results.push({ projectId, period, success: false, message: claimError.message });
          continue;
        }

        if (claimResult?.success) {
          const reward = claimResult.reward ?? 0;
          totalClaimed += 1;
          totalXp += reward;
          results.push({ projectId, period, success: true, reward });
        } else {
          results.push({ projectId, period, success: false, message: claimResult?.message || 'Not eligible.' });
        }
      } catch (error: any) {
        results.push({ projectId, period, success: false, message: error?.message || 'Claim failed.' });
      }
    }
  }

  res.status(200).json({
    success: true,
    totalClaimed,
    totalXp,
    results
  });
}
