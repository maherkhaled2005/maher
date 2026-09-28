export default async function run(page, ui) {
  const out = {};
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(11000);

  const auth = await page.evaluate(async () => {
    const phone =
      "0100" + String(Math.floor(1000000 + Math.random() * 8999999));
    const reg = await fetch("https://technorexa.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "عميل مراجعة",
        phone,
        email: phone + "@t.com",
        password: "Test@12345",
        role: "customer",
      }),
    }).then((r) => r.json());
    return { token: reg.token, user: reg.user };
  });
  await page.evaluate((a) => {
    localStorage.setItem("tr_token", a.token);
    localStorage.setItem("tr_user", JSON.stringify(a.user));
  }, auth);

  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(13000);

  // Dismiss the welcome modal if present.
  const close = page.locator('div[class*="absolute"]').first();
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(500);
  // click the X inside the modal
  const x = page.getByText("✕").first();
  if (await x.count()) {
    await x.click().catch(() => {});
  }
  await page.waitForTimeout(1200);

  out.after = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const bad = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 2)
        bad.push({
          tag: el.tagName,
          w: Math.round(r.width),
          cls: (el.className || "").toString().slice(0, 30),
        });
    });
    return {
      overflowPx: de.scrollWidth - de.clientWidth,
      tooWide: bad.slice(0, 6),
      text: document.body.innerText.slice(0, 300),
    };
  });
  await page.screenshot({ path: "./shot-c1.png" });
  return out;
}
