export default async function run(page, ui) {
  const out = {};
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(11000);

  // Create + verify a customer directly, then seed the session in the app.
  const auth = await page.evaluate(async () => {
    const phone =
      "0100" + String(Math.floor(1000000 + Math.random() * 8999999));
    const reg = await fetch("https://technorexa.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "عميل مراجعة",
        phone,
        email: phone + "@test.com",
        password: "Test@12345",
        role: "customer",
      }),
    }).then((r) => r.json());
    return { phone, token: reg.token, user: reg.user };
  });

  await page.evaluate((a) => {
    localStorage.setItem("tr_token", a.token);
    localStorage.setItem("tr_user", JSON.stringify(a.user));
  }, auth);

  await page.goto("http://localhost:8081/", { waitUntil: "load" });
  await page.waitForTimeout(13000);

  out.customer = await page.evaluate(() => {
    const de = document.documentElement;
    return {
      overflowPx: de.scrollWidth - de.clientWidth,
      text: document.body.innerText.slice(0, 1200),
    };
  });
  await page.screenshot({ path: "./shot-customer.png" });
  await page.screenshot({ path: "./shot-customer-full.png", fullPage: true });
  return out;
}
