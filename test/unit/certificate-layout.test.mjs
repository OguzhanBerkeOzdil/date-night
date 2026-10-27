import { test } from "node:test";
import assert from "node:assert/strict";

test("certificate header bodyStart clears subtitle at high scale", async () => {
  const { certificateHeaderLayout } = await import("../../js/certificate.js");
  for (const scale of [1, 1.2, 1.38]) {
    const hdr = certificateHeaderLayout(scale);
    assert.ok(hdr.bodyStart > hdr.subtitleBottom + 6, `scale ${scale}`);
    assert.ok(hdr.titleTop >= 96, `title below top roll at scale ${scale}`);
  }
});

test("validateCertificateLayout rejects overlapping boxes", async () => {
  const { validateCertificateLayout, CERT_MIN_HEIGHT, CERT_BOTTOM_RESERVE } = await import(
    "../../js/certificate.js"
  );
  const bottomLimit = CERT_MIN_HEIGHT - CERT_BOTTOM_RESERVE;
  const good = validateCertificateLayout({
    boxes: [
      { kind: "title", top: 100, bottom: 140 },
      { kind: "subtitle", top: 150, bottom: 180 },
      { kind: "body", top: 200, bottom: 220 },
      { kind: "body", top: 240, bottom: 260 },
    ],
    bodyEnd: 260,
    bottomLimit,
  });
  assert.equal(good.ok, true);

  const bad = validateCertificateLayout({
    boxes: [
      { kind: "title", top: 100, bottom: 140 },
      { kind: "subtitle", top: 150, bottom: 180 },
      { kind: "body", top: 175, bottom: 220 },
    ],
    bodyEnd: 220,
    bottomLimit,
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.some((i) => i.includes("subtitle")));
});
