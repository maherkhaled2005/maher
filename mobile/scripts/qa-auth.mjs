export default async function run(page, ui) {
  const out = {};
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(11000);

  const netlog = [];
  page.on("response", async (r) => {
    if (r.url().includes("/api/auth/")) {
      let body = "";
      try {
        body = (await r.text()).slice(0, 200);
      } catch {}
      netlog.push({ url: r.url().split("/api/")[1], status: r.status(), body });
    }
  });

  const inputs = page.locator("input");
  await inputs.nth(0).fill("01064739664");
  await inputs.nth(1).fill("123456");
  await page.waitForTimeout(300);
  await page.getByText("تسجيل الدخول", { exact: false }).first().click();
  await page.waitForTimeout(12000);
  out.netlog = netlog;
  return out;
}
