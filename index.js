import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.setViewport({ width: 1860, height: 1024 });

const openBrowser = tool({
  name: "open_browser",
  parameters: z.object({
    url: z.string(),
  }),
  async execute({ url }) {
    await page.goto(url);
  },
});

const openURL = tool({
  name: "open_url",
  description: "finds Sign Up link and Click it",
  parameters: z.object({
    linkText: z.string(),
  }),
  async execute({ linkText }) {
    await page.waitForSelector("a");
    const links = await page.$$("a");
    for (const link of links) {
      const text = await page.evaluate((el) => el.innerText.trim(), link);
      if (text.includes(linkText)) {
        await link.click();
        return `Clicked link with text: ${linkText}`;
      }
    }
    return `Could not find link with text: ${linkText}`;
  },
});

const takeScreenShot = tool({
  name: "take_screenshot",
  description:
    "Takes a screenshot of the current page add saved it to a file named like step1.png, step2.png etc",
  parameters: z.object({ filename: z.string() }),
  async execute({ filename }) {
    await page.screenshot({ path: "screenshots/" + filename });
    return `Screenshot saved as ${filename}`;
  },
});

const fillForm = tool({
  name: "fill_form",
  description:
    "find First Name, Last Name, Email, Password and Confirm Password and fill them",
  parameters: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  }),
  async execute({ firstName, lastName, email, password, confirmPassword }) {
    const fields = [
      { id: "firstName", value: firstName },
      { id: "lastName", value: lastName },
      { id: "email", value: email },
      { id: "password", value: password },
      { id: "confirmPassword", value: confirmPassword },
    ];
    for (const field of fields) {
      const element = await page.$(`#${field.id}`);
      if (element) {
        console.log(`Found element with id: ${field.value}`);

        await element.type(field.value);
      } else {
        console.log(`Could not find element with id: ${field.id}`);
      }
    }
    const submitBtn = await page.$("button[type='submit']");
    if (submitBtn) {
      // setTimeout(async () => {
        await submitBtn.click();
        console.log("Clicked submit button");
      // }, 4000);
    } else {
      console.log("Could not find submit button");
    }
    return `Filled form with data: ${firstName}, ${lastName}, ${email}, ${password}, ${confirmPassword}`;
  },
});

const closeBrowser = tool({
  name: "close_browser",
  parameters: z.object({}),
  async execute() {
    await browser.close();
    return "Browser closed";
  },
});

const websiteAutomationAgent = new Agent({
  name: "WebSite Automation Agent",
  instructions: `You are a web automation agent. Use tools to open pages and click links.
  
  Rules:
    After every tool calling take a screenshot.
    Find the Create Account form and fill it with the given data.
    First Name: Bera
    Last Name: Dhaval
    Email: test@gmail.com 
    Password: 123456789
    Confirm Password: 123456789

    After filling the form, close the browser.
  `,
  tools: [openBrowser, openURL, takeScreenShot, fillForm, closeBrowser],
});

const result = await run(
  websiteAutomationAgent,
  `
Open https://ui.chaicode.com/, then click the "Sign Up" link.`
);
console.log(result.finalOutput);
