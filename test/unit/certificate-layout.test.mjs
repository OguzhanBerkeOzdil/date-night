import { test } from "node:test";
import assert from "node:assert/strict";

test("certificate header bodyStart clears subtitle at high scale", async () => {
  const { certificateHeaderLayout, CERT_TOP_RESERVE } = await import("../../js/certificate.js?v=20261211");
  for (const scale of [1, 1.2, 1.38]) {
    const hdr = certificateHeaderLayout(scale);
    assert.ok(hdr.bodyStart > hdr.subtitleBottom + 6, `scale ${scale}`);
    assert.ok(hdr.titleTop >= CERT_TOP_RESERVE, `title below top roll at scale ${scale}`);
  }
});

test("validateCertificateLayout rejects overlapping boxes", async () => {
  const { validateCertificateLayout, CERT_MIN_HEIGHT, CERT_BOTTOM_RESERVE } = await import(
    "../../js/certificate.js?v=20261211"
  );
  const bottomLimit = CERT_MIN_HEIGHT - CERT_BOTTOM_RESERVE;
  const good = validateCertificateLayout({
    boxes: [
      { kind: "title", top: 130, bottom: 170 },
      { kind: "subtitle", top: 180, bottom: 210 },
      { kind: "body", top: 230, bottom: 250 },
      { kind: "body", top: 270, bottom: 290 },
    ],
    bodyEnd: 290,
    bottomLimit,
  });
  assert.equal(good.ok, true);

  const bad = validateCertificateLayout({
    boxes: [
      { kind: "title", top: 130, bottom: 170 },
      { kind: "subtitle", top: 180, bottom: 210 },
      { kind: "body", top: 205, bottom: 250 },
    ],
    bodyEnd: 220,
    bottomLimit,
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.some((i) => i.includes("subtitle")));
});
