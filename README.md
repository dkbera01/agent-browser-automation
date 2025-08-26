# Website Automation Agent with Puppeteer and OpenAI Agents

This project demonstrates a **web automation agent** built using:

* [Puppeteer](https://pptr.dev/) for browser automation
* [@openai/agents](https://openai.com/) for orchestrating actions
* [Zod](https://zod.dev/) for input validation
* [dotenv](https://www.npmjs.com/package/dotenv) for environment configuration

The agent automatically:

1. Opens a browser
2. Navigates to a website
3. Clicks the **Sign Up** link
4. Fills a registration form with predefined data
5. Takes screenshots at every step
6. Closes the browser when done

---

## Features

* **Reusable tools**: Each action (open browser, click link, fill form, screenshot, close browser) is modular.
* **Automatic screenshots**: Captures progress after every tool execution.
* **Form filling automation**: Automatically finds input fields and submit button.
* **Agent-driven workflow**: The OpenAI Agent manages the sequence of steps according to provided instructions.

---

## Installation

```bash
# Clone this repository
git clone https://github.com/your-username/website-automation-agent.git
cd website-automation-agent

# Install dependencies
npm install
```

Ensure you have **Node.js v18+** installed.

---

## Usage

1. **Set environment variables**

   ```bash
   cp .env.example .env
   ```

   Update any required configuration inside `.env`.

2. **Run the agent**

   ```bash
   npm start
   ```

3. **Screenshots**
   Screenshots will be saved inside the `screenshots/` directory as `step1.png`, `step2.png`, etc.

---

## How It Works

* The agent is defined with **instructions** to:

  * Open a target page ([https://ui.chaicode.com/](https://ui.chaicode.com/))
  * Click the **Sign Up** link
  * Fill in:

    * First Name: `Bera`
    * Last Name: `Dhaval`
    * Email: `test@gmail.com`
    * Password: `123456789`
    * Confirm Password: `123456789`
  * Take a screenshot after each action
  * Close the browser at the end

* Tools are implemented for modular automation:

  * `open_browser`
  * `open_url`
  * `take_screenshot`
  * `fill_form`
  * `close_browser`

---

## Project Structure

```
.
├── index.js           # Main automation script
├── package.json       # Dependencies and scripts
├── screenshots/       # Saved screenshots from each step
└── .env.example       # Sample environment configuration
```

---

## Example Output

Run the script:

```bash
node index.js
```

Console output will show progress logs like:

```
Clicked link with text: Sign Up
Filled form with data: Bera, Dhaval, test@gmail.com, 123456789, 123456789
Clicked submit button
Browser closed
```

---

## License

This project is licensed under the **MIT License**. Feel free to modify and use for your own automation tasks!

---
