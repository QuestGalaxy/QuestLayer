export interface PaywallPackage {
  id: string;
  title: string;
  price: string;
  interval: string;
  description: string;
  badge?: string;
}

export interface PaywallOffering {
  id: string;
  name: string;
  packages: PaywallPackage[];
  features: string[];
}

export interface PurchaseResult {
  status: 'missing_key' | 'redirect' | 'unavailable';
  message: string;
  redirectUrl?: string;
}

const revenueCatPublicKey = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY ?? '';
const revenueCatOfferingId = import.meta.env.VITE_REVENUECAT_OFFERING_ID ?? 'default';

const fallbackOffering: PaywallOffering = {
  id: revenueCatOfferingId,
  name: 'QuestLayer Pro',
  packages: [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$10',
      interval: '/month',
      description: 'Best for getting started with the builder suite.'
    },
    {
      id: 'yearly',
      title: 'Yearly',
      price: '$96',
      interval: '/year',
      description: '20% off the monthly plan billed annually.',
      badge: 'Save 20%'
    }
  ],
  features: [
    'Unlimited QuestLayers and widgets',
    'Team collaboration & sharing',
    'Priority support + roadmap previews',
    'Advanced analytics and engagement insights'
  ]
};

export const getOfferings = async (): Promise<PaywallOffering> => {
  if (!revenueCatPublicKey) {
    return fallbackOffering;
  }

  return fallbackOffering;
};

export const purchasePackage = async (packageId: string): Promise<PurchaseResult> => {
  if (!revenueCatPublicKey) {
    return {
      status: 'missing_key',
      message: 'Missing RevenueCat public API key. Add VITE_REVENUECAT_PUBLIC_API_KEY to enable checkout.'
    };
  }

  return {
    status: 'unavailable',
    message: `RevenueCat Web Billing checkout not configured yet for ${packageId}.`
  };
};
