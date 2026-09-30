import type { MobileBootstrap, MobileBootstrapResponse, TabKey } from './contracts/bootstrap';

const CONTRACT_NAME = 'black_label_connect.bootstrap';
const CONTRACT_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'BL';
}

export function adaptMobileBootstrap(value: unknown): MobileBootstrap {
  if (!isRecord(value) || !isRecord(value.contract) || !isRecord(value.identity)) {
    throw new Error('The mobile bootstrap response is malformed.');
  }

  if (value.contract.name !== CONTRACT_NAME || value.contract.version !== CONTRACT_VERSION) {
    throw new Error('The mobile bootstrap contract version is not supported.');
  }

  const response = value as unknown as MobileBootstrapResponse;
  const personas = Array.isArray(response.authorization?.personas)
    ? response.authorization.personas.filter((persona): persona is string => typeof persona === 'string')
    : [];
  const capabilities = isRecord(response.authorization?.capabilities)
    ? Object.entries(response.authorization.capabilities)
        .filter(([, enabled]) => enabled === true)
        .map(([capability]) => capability)
    : [];
  const modules = new Map(
    Array.isArray(response.navigation)
      ? response.navigation.map((module) => [module.key, module.enabled === true])
      : [],
  );
  const accounts = Array.isArray(response.accounts) ? response.accounts : [];
  const activeAccount =
    accounts.find((account) => account.id === response.active_account_id) ?? accounts[0];
  const displayName = response.identity.full_name?.trim() || response.identity.email?.trim() || 'Black Label User';
  const contractor = personas.includes('contractor') || personas.includes('talent');
  const navigation: Record<TabKey, boolean> = {
    home: modules.get('home') === true,
    inbox: modules.get('communications') === true,
    calendar: modules.get('calendar') === true,
    work: modules.get('tasks') === true || modules.get('talent') === true,
    more: true,
  };

  return {
    contractVersion: 1,
    user: {
      id: response.identity.id,
      displayName,
      initials: initialsFor(displayName),
      status: 'active',
    },
    activePersona: contractor ? 'contractor' : 'employee',
    personas,
    activeAccount: {
      id: activeAccount ? String(activeAccount.id) : '',
      name: activeAccount?.name || 'Black Label Branding',
    },
    memberships: accounts.map((account) => ({
      accountId: String(account.id),
      accountName: account.name,
      role: account.access_role,
    })),
    capabilities,
    navigation,
    notifications: {
      unreadCount: Number.isFinite(response.notifications?.unread_count)
        ? response.notifications.unread_count
        : 0,
      deviceRegistered: false,
    },
  };
}
