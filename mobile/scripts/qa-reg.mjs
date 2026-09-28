export default async function run(page, ui) {
  const out = {};
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(11000);

  const netlog = [];
  page.on("response", async (r) => {
    if (r.url().includes("/api/")) {
      let body = "";
      try {
        body = (await r.text()).slice(0, 260);
      } catch {}
      netlog.push({ url: r.url().split("/api/")[1], status: r.status(), body });
    }
  });

  // Register a fresh customer through the real API.
  const reg = await page.evaluate(async () => {
    const phone =
      "0100" + String(Math.floor(1000000 + Math.random() * 8999999));
    const res = await fetch("https://technorexa.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "عميل اختبار",
        phone,
        email: phone + "@test.com",
        password: "Test@12345",
        role: "customer",
      }),
    });
    return {
      phone,
      status: res.status,
      body: (await res.text()).slice(0, 300),
    };
  });
  out.register = reg;
  out.netlog = netlog;
  return out;
}
