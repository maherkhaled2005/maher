export default async function run(page, ui) {
  const out = {};
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(11000);

  const inputs = page.locator("input");
  out.inputCount = await inputs.count();
  await inputs.nth(0).fill("01064739664");
  await inputs.nth(1).fill("123456");
  await page.waitForTimeout(400);
  await page.locator("input").nth(1).press("Enter");
  await page.waitForTimeout(12000);

  out.after = await page.evaluate(() => {
    const de = document.documentElement;
    return {
      overflowPx: de.scrollWidth - de.clientWidth,
      text: document.body.innerText.slice(0, 900),
    };
  });
  await page.screenshot({ path: "./shot-lead.png" });
  return out;
}
