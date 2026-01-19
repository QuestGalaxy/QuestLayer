import { createClient } from '@supabase/supabase-js';
import { createPublicClient, getAddress, http, isAddress, verifyMessage, parseAbi, formatUnits } from 'viem';
import type { Address, Chain, Hex } from 'viem';
import { arbitrum, avalanche, bsc, mainnet, polygon } from 'viem/chains';

const erc20Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
]);

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
  1: 'https://cloudflare-eth.com',
  56: 'https://bsc-dataseed.binance.org',
  137: 'https://polygon-rpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  43114: 'https://api.avax.network/ext/bc/C/rpc'
};

const CHAIN_MAP: Record<number, Chain> = {
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
    .select('id, project_id, task_kind, xp_reward, token_contract, token_chain_id, min_token_amount')
    .eq('id', taskId)
    .eq('project_id', projectId)
    .single();

  if (taskError || !task) {
    res.status(404).json({ error: 'Task not found.' });
    return;
  }

  if (task.task_kind !== 'token_hold') {
    res.status(400).json({ error: 'Task is not a Token hold task.' });
    return;
  }

  const contract = (task.token_contract || '').trim();
  if (!contract || !isAddress(contract)) {
    res.status(400).json({ error: 'Invalid Token contract.' });
    return;
  }

  const chainId = typeof task.token_chain_id === 'number' ? task.token_chain_id : 1;
  const minAmount = parseFloat(task.min_token_amount || '0');

  if (!message.includes(`Chain: ${chainId}`)) {
    res.status(400).json({ error: 'Signature message mismatch (Chain ID).' });
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

  try {
    const decimals = await client.readContract({
      address: contract as Address,
      abi: erc20Abi,
      functionName: 'decimals'
    } as any) as number;

    const balance = await client.readContract({
      address: contract as Address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [normalizedAddress]
    } as any) as bigint;

    const formattedBalance = parseFloat(formatUnits(balance, decimals));

    if (formattedBalance < minAmount) {
      res.status(400).json({
        error: `Insufficient balance. Required: ${minAmount}, Found: ${formattedBalance.toFixed(4)}`,
        details: `Required: ${minAmount}, Found: ${formattedBalance.toFixed(4)}`
      });
      return;
    }

    const { error: completeError } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_id: task.id
      });

    if (completeError) {
      if (completeError.code === '23505') { // Unique violation
        res.status(200).json({ success: true, alreadyCompleted: true });
        return;
      }
      throw completeError;
    }

    const { error: xpError } = await supabase.rpc('increment_user_xp', {
      row_id: userId,
      xp_amount: task.xp_reward || 0
    });

    if (xpError) console.error('XP increment failed:', xpError);

    res.status(200).json({
      success: true,
      balance: formattedBalance,
      rpc: rpcMeta
    });

  } catch (err: any) {
    console.error('Token check failed:', err);
    const errorMessage = err?.message || 'Unknown error';
    if (errorMessage.includes('execution reverted')) {
      res.status(400).json({ error: 'Token check reverted on-chain.', details: errorMessage, rpc: rpcMeta });
    } else if (errorMessage.includes('network')) {
      res.status(502).json({ error: 'RPC Network Error', details: errorMessage, rpc: rpcMeta });
    } else {
      res.status(500).json({ error: 'Failed to verify token balance.', details: errorMessage, rpc: rpcMeta });
    }
  }
}
