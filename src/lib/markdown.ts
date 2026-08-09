/**
 * While a reply streams in, a fenced code block arrives with its opening ```
 * long before its closing one. Left as-is the parser treats the rest of the
 * message as code. Close the dangling fence so the partial block renders.
 */
export function balanceFences(text: string) {
  const fences = (text.match(/^```/gm) ?? []).length;
  return fences % 2 === 1 ? `${text}\n\`\`\`` : text;
}
