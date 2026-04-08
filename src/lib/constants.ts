export const APP_NAME = 'Questect';
export const APP_DOMAIN = 'questect.com';
export const APP_URL = typeof window !== 'undefined' && window.location.origin.includes('run.app') 
  ? window.location.origin 
  : `https://${APP_DOMAIN}`;

export const LEGAL_URLS = {
  PRIVACY: `${APP_URL}/legal/privacy`,
  TERMS: `${APP_URL}/legal/terms`,
  BILLING: `${APP_URL}/legal/billing`,
};

export const CONTACT_EMAIL = `admin@${APP_DOMAIN}`;
export const LEGAL_EMAIL = `legal@${APP_DOMAIN}`;

export const STRIPE_LINKS = {
  STARTER: "https://buy.stripe.com/eVq00jaA0afIb7fdMm5gc04",
  PRO: "https://buy.stripe.com/8x27sLeQgdrUejr8s25gc05",
  ADVANCED: "https://buy.stripe.com/aFa6oH9vWevYa3b23E5gc00",
  GROWTH: "https://buy.stripe.com/14AdR99vWcnQ6QZeQq5gc03",
};

// Set to true when Stripe account is fully verified and active
export const STRIPE_ACTIVATED = true;

export type UserPlan = 'free' | 'starter' | 'pro' | 'advanced' | 'growth' | 'enterprise';

export const PLAN_NAMES: Record<UserPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  advanced: 'Advanced',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

export const PLAN_HIERARCHY: Record<UserPlan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  advanced: 3,
  growth: 4,
  enterprise: 5,
};

export const PLAN_FEATURES: Record<UserPlan, string[]> = {
  free: [
    'Quick Grading (Single/Multi)',
    'Limited Exam Grader Access',
    'Basic History (Last 3)',
    'Smart Scan (OCR)',
  ],
  starter: [
    'Full Exam Grader Workflow',
    'Unlimited Batch Processing',
    'Multi-student Exam Grading',
    'Usage Panel & Statistics',
    'Everything in Free',
  ],
  pro: [
    'Saved Grading Records',
    'Full Grading History',
    'Searchable Archive',
    'Cloud Sync & Backup',
    'Everything in Starter',
  ],
  advanced: [
    'Full Data Analytics',
    'Custom Reporting',
    'Trend Analysis',
    'Advanced Insights',
    'Everything in Pro',
  ],
  growth: [
    'Institution Dashboard',
    'Team Management (Up to 10)',
    'Class/Group Modules',
    'Full Oversight Controls',
    'Shared Workflow Visibility',
  ],
  enterprise: [
    'Custom Workflow Setup',
    'SSO & Security Controls',
    'Dedicated Support & SLA',
    'Large-scale Deployment',
    'Custom Integration',
    'Everything in Growth',
  ],
};

export function hasPlanAccess(currentPlan: UserPlan, requiredPlan: UserPlan): boolean {
  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function hasPilotFeatureAccess(userProfile: any, feature: string): boolean {
  if (!userProfile?.teacherPilotAccess) return false;
  
  const endDate = new Date(userProfile.teacherPilotEndDate);
  const now = new Date();
  
  if (now > endDate) return false;
  
  return userProfile.teacherPilotUnlockedFeatures?.includes(feature) || false;
}
