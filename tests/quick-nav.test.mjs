import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const quickNavSource = await readFile(
  new URL("../docs/.vitepress/theme/components/layout/QuickNav.vue", import.meta.url),
  "utf8",
);

const expectedSites = [
  { name: "Motion", domain: "motion.dev", url: "https://motion.dev/" },
  { name: "GSAP", domain: "gsap.com", url: "https://gsap.com/" },
  { name: "React Bits", domain: "reactbits.dev", url: "https://reactbits.dev/" },
  {
    name: "Oscar Hernandez",
    domain: "oscarhernandez.vercel.app",
    url: "https://oscarhernandez.vercel.app/",
  },
  { name: "Anime.js", domain: "animejs.com", url: "https://animejs.com/" },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("QuickNav includes the frontend animation favorites", () => {
  const categoryMatch = quickNavSource.match(
    /title: "前端动效与组件"([\s\S]*?)title: "AI 音频与视频"/,
  );
  assert.ok(categoryMatch, "frontend animation category should exist");
  const categorySource = categoryMatch[1];

  for (const site of expectedSites) {
    const siteMatch = categorySource.match(
      new RegExp(`name: "${escapeRegExp(site.name)}"([\\s\\S]*?)\\n\\s*},`),
    );
    assert.ok(siteMatch, `${site.name} should exist in the category`);
    assert.match(siteMatch[1], new RegExp(`domain: "${escapeRegExp(site.domain)}"`));
    assert.match(siteMatch[1], new RegExp(`url: "${escapeRegExp(site.url)}"`));
    assert.equal(
      quickNavSource.split(`url: "${site.url}"`).length - 1,
      1,
      `${site.url} should appear exactly once`,
    );
  }
});
