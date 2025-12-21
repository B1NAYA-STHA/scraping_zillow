import { Camoufox } from "camoufox-js";

function isValidProperty(p: any) {
  return (
    p &&
    typeof p.zpid === "number" &&
    (typeof p.price === "number" || typeof p.price === "string")
  );
}

(async () => {
  const urls = [
    "https://www.zillow.com/homedetails/4109B-Media-St-Nashville-TN-37209/457160157_zpid/",
    "https://www.zillow.com/homedetails/42-Shepard-St-Nashville-TN-37210/108787275_zpid/",
    "https://www.zillow.com/homedetails/1418B-15th-Ave-S-Nashville-TN-37212/2090452892_zpid/"
  ];

  const browser = await Camoufox({
    headless: false,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
  });

  const page = await browser.newPage();
  const seen = new Set<number>();

  page.on("response", async (res: any) => {
    if (!res.url().includes("/graphql")) return;

    try {
      const property = (await res.json())?.data?.property;
      if (!isValidProperty(property) || seen.has(property.zpid)) return;

      seen.add(property.zpid);

      console.log("\nProperty found:");
      console.log("ZPID:", property.zpid);
      console.log("Price:", property.price);

      if (property.address) {
        const a = property.address;
        console.log(
          "Address:",
          `${a.streetAddress}, ${a.city}, ${a.state} ${a.zipcode}`
        );
      }

      if (seen.size === urls.length) {
        await browser.close();
        process.exit(0);
      }
    } catch {}
  });

  for (const url of urls) {
    console.log("Opening:", url);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
  }
})();
