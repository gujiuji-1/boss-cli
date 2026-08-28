import { SIDEBAR_NAV_AFTER_CLICK_MS, sleepRandom } from '../browser/index.js';
const SIDEBAR_NAV_WAIT_MS = 15_000;
const buildPathReachedPredicate = (targetPath) => `(() => {
      try {
        const p = window.location.pathname.replace(/\\/+$/, "") || "/";
        return p === ${JSON.stringify(targetPath)};
      } catch {
        return false;
      }
    })()`;
/**
 * 通过真实指针事件点击 Boss 左侧 `.menu-list` 中的菜单项，
 * 并等待导航到给定 pathname（如 `/web/chat/index`）。
 */
export async function clickBossSidebarMenuToPath(page, menuLabel, targetPath) {
    const params = JSON.stringify({ label: menuLabel, path: targetPath });
    const targetIndex = (await page.evaluate(`(({ label, path }) => {
      const norm = (v) => (v ?? "").replace(/\\s+/g, "");
      const links = Array.from(document.querySelectorAll(".menu-list a"));
      return links.findIndex((a) => {
        const href = a.getAttribute("href") ?? "";
        if (href.includes(path)) {
          return true;
        }
        const text = norm(a.querySelector(".menu-item-content span")?.textContent ?? a.textContent);
        return text.includes(label);
      });
    })(${params})`));
    if (targetIndex < 0) {
        throw new Error(`未找到侧边栏菜单“${menuLabel}”，无法跳转到 ${targetPath}。`);
    }
    const links = await page.$$('.menu-list a');
    const target = links[targetIndex];
    if (!target) {
        throw new Error(`侧边栏菜单“${menuLabel}”在点击前发生变化，无法跳转到 ${targetPath}。`);
    }
    await target.click();
    await sleepRandom(SIDEBAR_NAV_AFTER_CLICK_MS.min, SIDEBAR_NAV_AFTER_CLICK_MS.max);
    const pathReached = buildPathReachedPredicate(targetPath);
    try {
        await page.waitForFunction(pathReached, { timeout: SIDEBAR_NAV_WAIT_MS });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`点击侧边栏菜单“${menuLabel}”后未进入 ${targetPath}；当前 URL=${page.url()}；${message}`);
    }
}
//# sourceMappingURL=boss_sidebar_nav.js.map