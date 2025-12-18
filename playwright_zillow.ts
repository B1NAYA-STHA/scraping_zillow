import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/graphql")) {
      try {
        const json = await response.json();

        const property = json?.data?.property;
        if (property) {
          const zpid = property.zpid;
          const price = property.price;
          let address = "";

          const addr = property.address;
          address = `${addr.streetAddress || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.zipcode || ""}`;

          
          console.log("Property Found:");
          console.log("ZPID:", zpid);
          console.log("Price:", price); 
          console.log("Address:", address);
        }
      } catch (err) {
        
      }
    }
  });

  await page.goto(
    "https://www.zillow.com/homedetails/6601-Harcourt-Cir-Nashville-TN-37205/41154317_zpid/",
    { timeout: 60000 }
  );

  await page.waitForTimeout(15000);

  console.log("Closing browser");
  await browser.close();
})();
