import { describe, expect, it } from "vitest";
import { balanceFences } from "@/lib/markdown";

describe("balanceFences", () => {
  it("leaves a closed block alone", () => {
    const text = "Here:\n```ts\nconst a = 1;\n```\nDone.";
    expect(balanceFences(text)).toBe(text);
  });

  it("closes a block that is still streaming", () => {
    expect(balanceFences("Here:\n```ts\nconst a = 1;")).toBe(
      "Here:\n```ts\nconst a = 1;\n```",
    );
  });

  it("closes the fence opened by the last of several blocks", () => {
    const text = "```ts\na\n```\ntext\n```js\nb";
    expect(balanceFences(text)).toBe(`${text}\n\`\`\``);
  });

  it("ignores a fence that is not at the start of a line", () => {
    // Inline triple-backticks inside prose must not be counted as an opener,
    // or every message containing one would grow a stray empty code block.
    const text = "Use ``` to open a block.";
    expect(balanceFences(text)).toBe(text);
  });

  it("handles text with no fences at all", () => {
    expect(balanceFences("just prose")).toBe("just prose");
  });

  it("handles the moment the opening fence arrives alone", () => {
    expect(balanceFences("```")).toBe("```\n```");
  });

  it("counts a fence indented inside a list item", () => {
    // Up to three spaces of indent still opens a block, so a code sample
    // nested under a bullet must be closed like any other.
    expect(balanceFences("- Example:\n  ```ts\n  const a = 1;")).toBe(
      "- Example:\n  ```ts\n  const a = 1;\n```",
    );
  });

  it("closes a long fence with a run of matching length", () => {
    // A four-backtick block exists precisely so it can contain three-backtick
    // ones; closing it with three would not close it.
    expect(balanceFences("````md\n```ts\na\n```")).toBe("````md\n```ts\na\n```\n````");
  });

  it("treats a longer run as closing a shorter one", () => {
    expect(balanceFences("```ts\na\n````")).toBe("```ts\na\n````");
  });

  it("does not treat a fence carrying an info string as a closer", () => {
    expect(balanceFences("```ts\na\n```js")).toBe("```ts\na\n```js\n```");
  });
});
