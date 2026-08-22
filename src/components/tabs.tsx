import {
	Tabs as BaseTabs,
	Tab,
	type TabsProps as BaseTabsProps,
	type TabProps,
} from '@fumadocs/base-ui/components/tabs';

export interface TabsProps extends BaseTabsProps {
	/**
	 * Identifier for syncing the selected tab across every `<Tabs>` block sharing this id.
	 */
	groupId?: string;
	/**
	 * Persist the synced selection to `localStorage` so it survives a reload.
	 *
	 * @defaultValue false
	 */
	persist?: boolean;
	/**
	 * If true, updates the URL hash based on the active tab's `id`, and restores
	 * selection from the hash on load.
	 *
	 * @defaultValue false
	 */
	updateAnchor?: boolean;
}

/**
 * Thin wrapper on `@fumadocs/base-ui`'s native `Tabs`, which already implements
 * `groupId`/`persist`/`updateAnchor` in its underlying `components/ui/tabs`
 * primitive and forwards unrecognized props through to it. See
 * `docs/reference/fumadocs/tabs-migration.md` for the parity verification.
 */
export function Tabs(props: TabsProps) {
	return <BaseTabs {...props} />;
}

export { Tab };
export type { TabProps };
