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

// Named rather than page.locator("textarea"): the sidebar has a search field,
// and editing a message opens a second textarea.
const composerInput = (page: Page) => page.getByRole("textbox", { name: "Message" });

// The same text can appear in the sidebar entry and the header title as well as
// in the bubble, so assertions about message content scope to the transcript.
const transcript = (page: Page) => page.getByRole("log", { name: "Conversation" });

const send = async (page: Page, text: string) => {
  const composer = composerInput(page);
  await composer.click();
  await composer.fill(text);
  await page.keyboard.press("Enter");
};

// Phrases from the mocked reply in src/app/page.tsx, used to wait on real
// progress rather than on elapsed time.
const REPLY_OPENING = "animation should explain a change";
const REPLY_ENDING = "first-class state";
const WIDEST_CODE_LINE = "Slight overshoot";

const openSidebar = async (page: Page, isMobile: boolean) => {
  if (isMobile) await page.getByRole("button", { name: /show sidebar/i }).click();
};

test.beforeAll(async ({ request }, testInfo) => {
  // Without this a wall in front of the app (an auth redirect, a dead URL)
  // surfaces as a dozen identical locator timeouts several minutes apart,
  // instead of one line naming the cause.
  const url = testInfo.project.use.baseURL!;
  const res = await request.get(url, { maxRedirects: 0 });
  expect(
    res.status(),
    `${url} did not serve the app directly (status ${res.status()}). If this is a redirect, the deployment is probably behind Vercel Deployment Protection.`,
  ).toBe(200);
});

test.describe("chat", () => {
  test("streams a reply and renders a code block", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto("/");

    await send(page, "show me a code sample");

    // The user's own message appearing proves the page hydrated. A static
    // shell also renders and returns 200, so reaching the app at all is not
    // evidence that any of it works.
    await expect(transcript(page).getByText("show me a code sample")).toBeVisible();

    await expect(transcript(page)).toContainText(REPLY_OPENING, { timeout: 30_000 });
    await expect(page.locator("pre").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /copy code/i }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("does not overflow horizontally when a code block is present", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await send(page, "show me a code sample");

    // The <pre> appears as soon as the opening fence streams in, while it is
    // still empty, and measuring then would pass even with the overflow bug
    // fully reintroduced. Waiting for the widest line to *start* arriving is
    // not enough either — it is still half-written and therefore still narrow.
    // The reply's closing words are the only signal that the block is final.
    await expect(transcript(page)).toContainText(REPLY_ENDING, { timeout: 40_000 });
    await expect(page.locator("pre").first()).toContainText(WIDEST_CODE_LINE);

    // A wide <pre> must scroll inside its own container rather than pushing
    // the page sideways — flex children default to min-width:auto, which
    // silently reintroduces this.
    const measurements = await page.evaluate(() => {
      const pre = document.querySelector("pre")!;
      return {
        pageOverflows:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        preScrolls: pre.scrollWidth > pre.clientWidth,
      };
    });

    expect(measurements.pageOverflows).toBe(false);

    // Only meaningful where the code is genuinely wider than the space for it.
    // On a desktop viewport the widest line fits inside the bubble, so the
    // block correctly does not scroll and asserting that it does is a
    // coin-flip on the exact character width.
    if (isMobile) expect(measurements.preScrolls).toBe(true);
  });

  test("stop halts a streaming reply", async ({ page }) => {
    await page.goto("/");
    await send(page, "tell me about spring animations");

    // Reasoning and the tool call run first. Stopping before any content
    // streams would only prove a spinner can be cancelled.
    await expect(transcript(page)).toContainText(REPLY_OPENING, { timeout: 30_000 });

    await page.getByRole("button", { name: /stop generating/i }).click();
    await expect(page.getByRole("button", { name: /stop generating/i })).toBeHidden();

    // The reply was cut off partway, so the text it would have ended with
    // must never arrive.
    const settled = await transcript(page).innerText();
    await expect
      .poll(async () => transcript(page).innerText(), { timeout: 5_000, intervals: [1_000] })
      .toBe(settled);
    expect(settled).not.toContain(REPLY_ENDING);
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

    // Assert the dialog is absent only after dictation has visibly done
    // something. Checking first would pass before voice mode could have
    // opened, which is the failure it is meant to catch.
    await expect(composerInput(page)).not.toBeEmpty({ timeout: 15_000 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("conversations", () => {
  test("switching conversations swaps the thread", async ({ page, isMobile }) => {
    const errors = watchForErrors(page);
    await page.goto("/");

    // Fixture content from src/lib/mock.ts. Asserting on the message body
    // rather than the sidebar label matters: the label is what was clicked,
    // so it stays on screen whether or not the thread actually changed.
    const kyoto = "Packing for Kyoto in November";
    const swift = "Why does Swift force me to unwrap optionals?";

    await openSidebar(page, isMobile);
    await page.getByRole("button", { name: /Trip to Kyoto/ }).click();
    await expect(transcript(page)).toContainText(kyoto);

    await openSidebar(page, isMobile);
    await page.getByRole("button", { name: /Explaining Swift optionals/ }).click();
    await expect(transcript(page)).toContainText(swift);
    await expect(transcript(page)).not.toContainText(kyoto);

    // Going back must restore the thread, not a blank one.
    await openSidebar(page, isMobile);
    await page.getByRole("button", { name: /Trip to Kyoto/ }).click();
    await expect(transcript(page)).toContainText(kyoto);

    expect(errors).toEqual([]);
  });
});
