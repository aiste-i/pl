import { Locator } from '@playwright/test';
import { getImmediateElementHandle } from '../../utils/locator-handles';

export class OracleSafety {
    /**
     * Checks if a target node (represented by a locator) is part of the oracle-grounded context.
     * A node is oracle-protected if it is an oracle node itself OR an ancestor of an oracle node
     * whose mutation would invalidate oracle grounding.
     */
    static async isProtected(locator: Locator): Promise<boolean> {
        const handle = await getImmediateElementHandle(locator);
        if (!handle) {
            return false;
        }

        try {
            return await handle.evaluate((node: HTMLElement) => {
            const ORACLE_ATTR = 'data-testid';
            
            // 1. Direct oracle node protection
            if (node.hasAttribute(ORACLE_ATTR)) return true;
            
            // 2. Ancestor protection: If any descendant is an oracle node, this node is part of the oracle context.
            // Structural changes or visibility changes here would corrupt oracle access.
            if (node.querySelector(`[${ORACLE_ATTR}]`)) return true;

            return false;
            });
        } catch {
            return false;
        } finally {
            await handle.dispose().catch(() => undefined);
        }
    }

    /**
     * Checks if a structural mutation on a target node would threaten oracle integrity.
     */
    static async isStructuralMutationUnsafe(locator: Locator): Promise<boolean> {
        // For structural mutations (delete, move, swap), we must be extremely strict.
        return await this.isProtected(locator);
    }

    /**
     * Checks if a visibility mutation on a target node would threaten oracle integrity.
     */
    static async isVisibilityMutationUnsafe(locator: Locator): Promise<boolean> {
        // If we hide a node that contains an oracle, the oracle becomes non-actionable/invisible.
        return await this.isProtected(locator);
    }
}
