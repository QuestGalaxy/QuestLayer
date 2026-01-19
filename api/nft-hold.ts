import { createClient } from '@supabase/supabase-js';
import { createPublicClient, getAddress, http, isAddress, verifyMessage } from 'viem';
import type { Hex } from 'viem';
import { arbitrum, avalanche, bsc, mainnet, polygon } from 'viem/chains';

const erc721BalanceOfAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }]
  }
] as const;

const parseBody = async (req: any) => {
  if (req.body) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
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
  1: 'https://rpc.ankr.com/eth',
  56: 'https://bsc-dataseed.binance.org',
  137: 'https://rpc.ankr.com/polygon',
  42161: 'https://arb1.arbitrum.io/rpc',
  43114: 'https://api.avax.network/ext/bc/C/rpc'
};

const CHAIN_MAP: Record<number, typeof mainnet> = {
  1: mainnet,
  56: bsc,
  137: polygon,
  42161: arbitrum,
  43114: avalanche
};

const getRpcUrl = (chainId: number) => {
  const chainSpecific = process.env[`RPC_URL_${chainId}`];
  const fallback = process.env.RPC_URL;
  const defaultUrl = DEFAULT_RPC_URLS[chainId];
  return chainSpecific || fallback || defaultUrl || '';
};

const getRpcMeta = (chainId: number, rpcUrl: string) => {
  const chainSpecificKey = `RPC_URL_${chainId}`;
  const source = process.env[chainSpecificKey]
    ? chainSpecificKey
    : (process.env.RPC_URL ? 'RPC_URL' : 'DEFAULT');
  let host = 'unknown';
  try {
    host = new URL(rpcUrl).host;
  } catch {
    host = 'invalid-url';
  }
  return { source, host };
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

export default async function handler(req: any, res: any) {
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

  const { address, signature, message, projectId, taskId } = body || {};

  if (!address || !signature || !message || !projectId || !taskId) {
    res.status(400).json({ error: 'Missing required fields.' });
    return;
  }

  if (!isAddress(address)) {
    res.status(400).json({ error: 'Invalid wallet address.' });
    return;
  }

  const normalizedAddress = getAddress(address);
  const addressLower = normalizedAddress.toLowerCase();
  const messageLower = String(message).toLowerCase();

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

  if (!messageLower.includes(`wallet: ${addressLower}`) || !message.includes(`Project: ${projectId}`) || !message.includes(`Task: ${taskId}`)) {
    res.status(400).json({ error: 'Signature message mismatch.' });
    return;
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Server misconfigured.' });
    return;
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, project_id, task_kind, xp_reward, nft_contract, nft_chain_id')
    .eq('id', taskId)
    .eq('project_id', projectId)
    .single();

  if (taskError || !task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  if (task.task_kind !== 'nft_hold') {
    res.status(400).json({ error: 'Task is not an NFT hold task.' });
    return;
  }

  const contract = (task.nft_contract || '').trim();
  if (!contract || !isAddress(contract)) {
    res.status(400).json({ error: 'Invalid NFT contract.' });
    return;
  }

  const chainId = typeof task.nft_chain_id === 'number' ? task.nft_chain_id : 1;
  if (!message.includes(`Chain: ${chainId}`)) {
    res.status(400).json({ error: 'Signature message mismatch.' });
    return;
  }
  const rpcUrl = getRpcUrl(chainId);
  if (!rpcUrl) {
    res.status(500).json({ error: 'RPC URL not configured.' });
    return;
  }
  const rpcMeta = getRpcMeta(chainId, rpcUrl);

  const { data: user, error: userError } = await supabase
    .from('end_users')
    .upsert(
      {
        project_id: projectId,
        wallet_address: addressLower
      },
      { onConflict: 'project_id,wallet_address' }
    )
    .select('id')
    .single();

  if (userError || !user) {
    res.status(500).json({ error: 'Failed to create user.' });
    return;
  }

  const userId = user.id;

  const { data: existingCompletion } = await supabase
    .from('task_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('task_id', task.id)
    .maybeSingle();

  if (existingCompletion?.id) {
    res.status(200).json({ success: true, alreadyCompleted: true });
    return;
  }

  const client = createPublicClient({ chain: CHAIN_MAP[chainId], transport: http(rpcUrl) });

  let balance: bigint;
  try {
    balance = await client.readContract({
      address: contract as Hex,
      abi: erc721BalanceOfAbi,
      functionName: 'balanceOf',
      args: [normalizedAddress]
    });
  } catch (error: any) {
    res.status(502).json({
      error: 'On-chain check failed.',
      details: error?.shortMessage || error?.message || 'RPC error',
      chainId,
      rpcSource: rpcMeta.source,
      rpcHost: rpcMeta.host
    });
    return;
  }

  if (balance <= 0n) {
    res.status(200).json({ success: false, error: 'No NFT found for this wallet.' });
    return;
  }

  const { data: progress } = await supabase
    .from('user_progress')
    .select('xp')
    .eq('user_id', userId)
    .maybeSingle();

  const currentXp = progress?.xp ?? 0;

  const { error: completionError } = await supabase
    .from('task_completions')
    .insert({
      user_id: userId,
      task_id: task.id
    });

  if (completionError) {
    res.status(500).json({ error: 'Failed to record completion.' });
    return;
  }

  const xpAwarded = task.xp_reward ?? 0;
  const { error: progressError } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        xp: currentXp + xpAwarded,
        streak: 1
      },
      { onConflict: 'user_id' }
    );

  if (progressError) {
    res.status(500).json({ error: 'Failed to update XP.' });
    return;
  }

  res.status(200).json({ success: true, xpAwarded });
}
