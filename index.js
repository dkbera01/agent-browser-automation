import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: false,
  args: ["--start-maximized"],
  defaultViewport: null,
});
const page = await browser.newPage();

// helper function to highlight elements
async function highlightElement(element) {
  await page.evaluate((el) => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "all 0.5s ease";
    el.style.outline = "3px solid yellow";
    el.style.boxShadow = "0 0 15px 5px orange";
    setTimeout(() => {
      el.style.outline = "";
      el.style.boxShadow = "";
    }, 2000);
  }, element);
}

const openBrowser = tool({
  name: "open_browser",
  parameters: z.object({
    url: z.string(),
  }),
  async execute({ url }) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return `Opened ${url}`;
  },
});

// Take a partial screenshot in base64 (top of the page)
const takePartialScreenshot = tool({
  name: "take_partial_screenshot",
  description:
    "Take a cropped screenshot in base64. If selector is provided, screenshot only that element; otherwise screenshot top part of page.",
  parameters: z.object({
    height: z.number(),
    selector: z.string().nullable(),
  }),
  async execute({ height, selector }) {
    let clipArea;

    if (selector != "") {
      const element = await page.$(selector);
      if (!element) {
        return `Could not find element: ${selector}`;
      }
      const parent = await element.evaluateHandle((el) => el.parentElement);

      const box = await parent.boundingBox();
      if (!box) {
        return `Could not determine bounding box for: ${selector}`;
      }
      clipArea = {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    } else {

      clipArea = {
        x: 0,
        y: 0,
        width: 200,
        height: height || 400,
      };
    }

    const screenshot = await page.screenshot({
      encoding: "base64",
      clip: clipArea,
      quality: 30,
      type: "webp",
    });
    return screenshot;
  },
});

const openURL = tool({
  name: "open_url",
  description:
    "finds Sign Up link with lable from the base64 screenshot.",
  parameters: z.object({
    lable: z.string(),
  }),
  async execute({ lable }) {
    await page.waitForSelector("a");
    const links = await page.$$("a");
    for (const link of links) {
      const text = await page.evaluate((el) => el.innerText.trim(), link);
      if (text.includes(lable)) {
        await highlightElement(link);
        await link.click();

        return `Clicked link with text: ${lable}`;
      }
    }
    return `Could not find link with text: ${lable}`;
  },
});

const fillForm = tool({
  name: "fill_form",
  description: "get Main button: lable from the base64 screenshot.",
  parameters: z.object({
    fields: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      password: z.string(),
      confirmPassword: z.string(),
    }),
    btnLabel: z.string().nullable(),
  }),

  async execute({ fields, btnLabel }) {
    console.log('btnLabel', btnLabel);
    
    for (const [field, value] of Object.entries(fields)) {
      const selectors = [
        `input[name="${field}"]`,
        `input[id="${field}"]`,
        `input[placeholder*="${field}"]`,
        `input[aria-label*="${field}"]`,
        `input[title*="${field}"]`,
        `input[type="${
          field.toLowerCase().includes("password") ? "password" : "text"
        }"]`,
      ];

      for (const selector of selectors) {
        const element = await page.$(selector);
        if (element) {
          await highlightElement(element);
          await element.type(value, { delay: 150 });
          break;
        }
      }
    }

    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await page.evaluate((el) => {
        return el.innerText.trim();
      }, button);
      if (text.includes(btnLabel)) {
        await highlightElement(button);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await button.click();
        return `Filled form and clicked button "${btnLabel}"`;
      }
    }

    return `Filled form with data`;
  },
});


const closeBrowser = tool({
  name: "close_browser",
  parameters: z.object({}),
  async execute() {
    setTimeout(async () => {
      await browser.close();
      return "Browser closed";
    });
  },
});

const websiteAutomationAgent = new Agent({
  name: "WebSite Automation Agent",
  instructions: `
You are a web automation agent. Use the tools strictly in this sequence:

1. Open the website.
2. Take a screenshot of the top of the page around 400px.
3. Use open_url to click the Sign Up link.
4. Take a screenshot of the signup form using selector "form".
5. Use fill_form to fill the form and and LOOK at it and find input field lables from the screenshot, get button lable from base64 screenshot not guess it and it's not sign up.
6. Fill the form with dummy data
7. Close the browser.`,
  tools: [openBrowser, takePartialScreenshot, openURL, fillForm, closeBrowser],
});

const result = await run(
  websiteAutomationAgent,
  `Open https://ui.chaicode.com/, click "Sign Up", inspect the signup form screenshot, determine the submit button label, fill dummy data, submit, and close the browser.`
  // `Open https://ui.chaicode.com/, find the Sign Up text, then fill the form with dummy data, find a form submit button lable, and close browser.`
  // `Open https://ui.chaicode.com/, find the Sign Up text, and take a screenshot of the Sign Up link section, then take screenshot of the signup form using selector "form". Fill the form with dummy data. Submit the form. Close the browser.`,
);
console.log(result.finalOutput);
