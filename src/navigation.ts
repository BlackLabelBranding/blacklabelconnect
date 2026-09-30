import type { MobileBootstrap, TabKey } from './contracts/bootstrap';

export const tabOrder: TabKey[] = ['home', 'inbox', 'calendar', 'work', 'more'];

export function getEnabledTabs(bootstrap: MobileBootstrap): TabKey[] {
  return tabOrder.filter((tab) => bootstrap.navigation[tab]);
}

export function canOpenTab(bootstrap: MobileBootstrap, tab: TabKey): boolean {
  return getEnabledTabs(bootstrap).includes(tab);
}
