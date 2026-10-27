/**
 * Wrap a realm-note bullet with a hanging indent (one bullet, indented continuations).
 * @param {(text: string) => number} measureText
 * @param {string} noteLine - may include leading "• "
 * @param {number} maxWidth - full line width from margin x
 * @param {string} [bulletPrefix]
 * @returns {{ rows: { text: string, indent: number }[], bulletIndent: number }}
 */
export function layoutBulletNoteRows(measureText, noteLine, maxWidth, bulletPrefix = "• ") {
  const raw = noteLine.startsWith("• ") ? noteLine.slice(2).trim() : noteLine.trim();
  const bulletWidth = measureText(bulletPrefix);
  const bulletIndent = bulletWidth + 6;
  const rows = [];
  const words = raw.split(/\s+/).filter(Boolean);
  let chunk = "";
  let first = true;

  for (const word of words) {
    const candidate = chunk ? `${chunk} ${word}` : word;
    const lineText = first ? `${bulletPrefix}${candidate}` : candidate;
    const limit = first ? maxWidth : maxWidth - bulletIndent;
    const width = first ? measureText(lineText) : measureText(candidate);
    if (width > limit && chunk) {
      rows.push({
        text: first ? `${bulletPrefix}${chunk}` : chunk,
        indent: first ? 0 : bulletIndent,
      });
      first = false;
      chunk = word;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) {
    rows.push({
      text: first ? `${bulletPrefix}${chunk}` : chunk,
      indent: first ? 0 : bulletIndent,
    });
  }
  return { rows, bulletIndent };
}
