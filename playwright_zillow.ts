import { chromium } from "playwright";
import fs from "fs";

type RawCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expirationDate?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
};

type SameSite = "Lax" | "Strict" | "None";


function normalizeSameSite(value?: string): SameSite | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === "lax") return "Lax";
  if (v === "strict") return "Strict";
  if (v === "no_restriction") return "None";
  return undefined;
}

function isValidProperty(p: any): boolean {
  return (
    p && typeof p.zpid === "number" && (typeof p.price === "number" || typeof p.price === "string")
  );
}

// main function

(async () => {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // Load cookies from file

  const rawCookies: RawCookie[] = JSON.parse(
    fs.readFileSync("cookies.json", "utf-8")
  );

  const playwrightCookies = rawCookies.map((c) => {
    const cookie: any = {
      name: c.name,
      value: c.value,
      domain: c.domain.startsWith(".") ? c.domain : `.${c.domain}`,
      path: c.path || "/",
      httpOnly: c.httpOnly,
      secure: c.secure,
    };

    if (typeof c.expirationDate === "number") {
      cookie.expires = c.expirationDate;
    }

    const sameSite = normalizeSameSite(c.sameSite);
    if (sameSite) {
      cookie.sameSite = sameSite;
    }

    return cookie;
  });

  await context.addCookies(playwrightCookies);

  const page = await context.newPage();

  // Response handler
  let captured = false;

  const onResponse = async (res: any) => {
    if (captured) return;
    if (!res.url().includes("/graphql")) return;

    try {
      const json = await res.json();
      const property = json?.data?.property;

      if (!isValidProperty(property)) return;

      captured = true;

      console.log("\nProperty found: ");
      console.log("ZPID:", property.zpid);
      console.log("Price:", property.price);

      if (property.address) {
        const a = property.address;
        console.log( "Address:", `${a.streetAddress}, ${a.city}, ${a.state} ${a.zipcode}`);
      }

      page.off("response", onResponse);

      setTimeout(async () => {
        await browser.close();
        process.exit(0);
      }, 1000);
    } catch {
      // Ignore JSON parse errors
    }
  };

  page.on("response", onResponse);

  // Navigate to the property page

  await page.goto(
    "https://www.zillow.com/homedetails/4109B-Media-St-Nashville-TN-37209/457160157_zpid/",
    { waitUntil: "domcontentloaded", timeout: 60000 }
  );

  setTimeout(async () => {
    if (!captured) {
      console.log(" Property not captured");
      await browser.close();
      process.exit(1);
    }
  }, 20000);
  
})();
