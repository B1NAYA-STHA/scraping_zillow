import { Camoufox } from "camoufox-js";
import fs from "fs";

(async () => {
  const browser = await Camoufox({
    headless: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
  });

  const page = await browser.newPage();

  let captured = false;

  page.on("response", async (res: any) => {
    if (captured) return;

    const url = res.url();
    if (!url.includes("/async-create-search-page-state")) return;

    try {
      const data = await res.json();

      const listings = data?.cat1?.searchResults?.mapResults;
      if (!Array.isArray(listings)) return;

      captured = true;

      const results = listings.map((l: any) => ({
        URL: "https://www.zillow.com" + l.detailUrl,
        Address: l.address,
        Price: l.price,
        Beds: l.beds,
        Baths: l.baths,
        Area: l.area,
        Image: l.imgSrc,
        ZPID: l.zpid
      }));

      fs.writeFileSync( "zillow_listings.json", JSON.stringify(results, null, 2)
      );

      console.log("Listings captured:", results.length);

      await browser.close();
      process.exit(0);
    } catch {}
  });

  console.log("Opening Zillow search...");
  await page.goto("https://www.zillow.com/los-angeles-ca/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });
})();
