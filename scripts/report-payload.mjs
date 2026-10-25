import { readdir, stat } from "fs/promises";
import { join } from "path";

const dir = join(process.cwd(), "assets/images");
const files = await readdir(dir);
const groups = { portrait: 0, landscape: 0, cutout: 0, other: 0 };

for (const f of files) {
  if (!/\.(webp|jpg|jpeg)$/i.test(f)) continue;
  const s = (await stat(join(dir, f))).size;
  if (f.includes("-landscape")) groups.landscape += s;
  else if (f.startsWith("bg-")) groups.portrait += s;
  else if (/horse|dragon|tarot|quest-map/.test(f)) groups.cutout += s;
  else groups.other += s;
}

const fmt = (n) => `${(n / 1024 / 1024).toFixed(2)} MiB`;
console.log(
  JSON.stringify(
    {
      portraitBgTotal: fmt(groups.portrait),
      landscapeBgTotal: fmt(groups.landscape),
      cutoutsTotal: fmt(groups.cutout),
      otherImages: fmt(groups.other),
      note: "Mobile clients load portrait + cutouts; landscape adds -landscape* when min-aspect-ratio 1/1",
    },
    null,
    2
  )
);
