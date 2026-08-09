import { expect, test, type Page } from "@playwright/test";

/**
 * Fails the test if the page logs an error. Every regression this suite exists
 * to catch was invisible to `tsc` and to a plain HTTP check — the page returned
 * 200 while being broken — so runtime errors are treated as failures.
 */
function watchForErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

// Not getByRole("textbox") — the sidebar's search field also matches, and on
// desktop the sidebar is open by default so it wins .first().
const composerInput = (page: Page) => page.locator("textarea");

// The same text can appear in the sidebar entry and the header title as well as
// in the bubble, so assertions about message content scope to the transcript.
const transcript = (page: Page) => page.getByRole("log", { name: "Conversation" });

const send = async (page: Page, text: string) => {
  const composer = composerInput(page);
  await composer.click();
  await composer.fill(text);
  await page.keyboard.press("Enter");
};

test.describe("chat", () => {
  test("streams a reply and renders a code block", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto("/");

    await send(page, "show me a code sample");

    // The user's own message appearing proves the page hydrated. A static
    // shell also renders and returns 200, so reaching the app at all is not
    // evidence that any of it works.
    await expect(transcript(page).getByText("show me a code sample")).toBeVisible();

    // Assistant replies land as a code block once the mocked turn completes.
    await expect(page.locator("pre").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /copy code/i }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("does not overflow horizontally when a code block is present", async ({ page }) => {
    await page.goto("/");
    await send(page, "show me a code sample");
    await expect(page.locator("pre").first()).toBeVisible({ timeout: 30_000 });

    // A wide <pre> must scroll inside its own container rather than pushing
    // the page sideways — flex children default to min-width:auto, which
    // silently reintroduces this.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("stop halts a streaming reply", async ({ page }) => {
    await page.goto("/");
    await send(page, "tell me about spring animations");

    const stop = page.getByRole("button", { name: /stop generating/i });
    await expect(stop).toBeVisible();
    await stop.click();

    // Once stopped, the composer offers to send again rather than to stop.
    await expect(stop).toBeHidden();

    const settled = await page.locator("body").innerText();
    await page.waitForTimeout(2500);
    expect(await page.locator("body").innerText()).toBe(settled);
  });
});

test.describe("voice", () => {
  test("opens voice mode and releases the page when dismissed", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto("/");

    await page.getByRole("button", { name: /start voice mode/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: /exit voice mode/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // Regression guard: a modal that unmounts its popup but leaves its inert
    // backdrop behind makes the whole page unclickable while looking fine.
    // Typing is the cheapest proof the page still accepts input.
    await send(page, "still interactive");
    await expect(transcript(page).getByText("still interactive")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("dictation writes into the composer instead of opening voice mode", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /^dictate$/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(composerInput(page)).not.toBeEmpty({ timeout: 15_000 });
  });
});

test.describe("conversations", () => {
  test("switching conversations swaps the thread", async ({ page, isMobile }) => {
    const errors = watchForErrors(page);
    await page.goto("/");

    if (isMobile) await page.getByRole("button", { name: /show sidebar/i }).click();

    const items = page.locator("aside nav button").filter({ hasNotText: /^$/ });
    const first = items.nth(0);
    const firstTitle = (await first.innerText()).split("\n")[0];
    await first.click();
    await expect(page.getByText(firstTitle, { exact: false }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });
});
