.export default async function run(page, ui) {
  const out = {};

  // Create one real account per role through the public register endpoint.
  const accounts = await page.evaluate(async () => {
    const mk = async (role) => {
      const phone =
        "010" + String(Math.floor(10000000 + Math.random() * 89999999));
      const res = await fetch("https://technorexa.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "مراجعة " + role,
          phone,
          email: phone + "@t.com",
          password: "Test@12345",
          role,
        }),
      }).then((r) => r.json());
      return { role, phone, token: res.token, user: res.user };
    };
    const list = [];
    for (const r of ["customer", "technician", "merchant"])
      list.push(await mk(r));
    return list;
  });
  out.accounts = accounts.map((a) => ({
    role: a.role,
    phone: a.phone,
    hasToken: Boolean(a.token),
    userRole: a.user?.role,
    userStatus: a.user?.status,
  }));

  // Load the app as each role and measure layout health.
  for (const acc of accounts) {
    if (!acc.token) continue;
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("http://localhost:8081/", { waitUntil: "load" });
    await page.waitForTimeout(11000);
    await page.evaluate((a) => {
      localStorage.setItem("tr_token", a.token);
      localStorage.setItem("tr_user", JSON.stringify(a.user));
    }, acc);
    await page.goto("http://localhost:8081/", { waitUntil: "load" });
    await page.waitForTimeout(14000);

    // Close any onboarding/welcome modal.
    const x = page.getByText("✕").first();
    if (await x.count()) await x.click().catch(() => {});
    await page.waitForTimeout(1000);

    out[acc.role] = await page.evaluate(() => {
      const de = document.documentElement;
      const vw = de.clientWidth;
      const bad = [];
      document.querySelectorAll("*").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > vw + 2)
          bad.push({ tag: el.tagName, w: Math.round(r.width) });
      });
      return {
        overflowPx: de.scrollWidth - de.clientWidth,
        tooWide: bad.slice(0, 4),
        text: document.body.innerText.slice(0, 400),
      };
    });
    await page.screenshot({ path: `./shot-role-${acc.role}.png` });
  }
  return out;
}
