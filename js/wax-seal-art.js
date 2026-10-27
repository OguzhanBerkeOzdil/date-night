/** Draw premium decree wax seal (horseshoe emblem) on canvas. */

export function drawDecreeWaxSeal(ctx, cx, cy, radius = 34) {
  const r = radius;
  ctx.save();
  ctx.translate(cx, cy);

  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.15, 0, 0, r);
  grad.addColorStop(0, "#c94848");
  grad.addColorStop(0.45, "#9a2f2f");
  grad.addColorStop(1, "#5a1818");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 220, 200, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.strokeStyle = "rgba(40, 12, 12, 0.75)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 4, r * 0.42, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.38, 2);
  ctx.lineTo(-r * 0.38, -r * 0.12);
  ctx.arc(-r * 0.28, -r * 0.12, r * 0.1, Math.PI, 0);
  ctx.lineTo(r * 0.38, -r * 0.12);
  ctx.lineTo(r * 0.38, 2);
  ctx.stroke();

  ctx.restore();
}
