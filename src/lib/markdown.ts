// A fence opens with three or more backticks, indented up to three spaces, and
// may carry an info string. A closing fence is at least as long as the one that
// opened it and carries nothing else.
const FENCE = /^ {0,3}(`{3,})(.*)$/;

/**
 * While a reply streams in, a fenced code block arrives with its opening ```
 * long before its closing one. Left as-is the parser treats the rest of the
 * message as code. Close the dangling fence so the partial block renders.
 */
export function balanceFences(text: string) {
  let openLength: number | null = null;

  for (const line of text.split("\n")) {
    const match = FENCE.exec(line);
    if (!match) continue;

    const length = match[1].length;
    if (openLength === null) {
      openLength = length;
    } else if (length >= openLength && match[2].trim() === "") {
      openLength = null;
    }
  }

  // Close with a run as long as the opener; a shorter one would not close it.
  return openLength === null ? text : `${text}\n${"`".repeat(openLength)}`;
}
