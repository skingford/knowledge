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

const appleDesignSkill = {
  name: "Apple Design Skill",
  domain: "github.com",
  url: "https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md",
};

const orcaSite = {
  name: "Orca",
  domain: "www.onorca.dev",
  url: "https://www.onorca.dev/",
};

const paseoSite = {
  name: "Paseo",
  desc: "自托管编码 Agent 控制台，可从手机、桌面或 Web 远程运行 Claude Code、Codex 等工具",
  domain: "paseo.sh",
  fallback: "P",
  url: "https://paseo.sh/",
};

const terminalSetupSite = {
  name: "terminal-setup",
  desc: "以 macOS 为主的一键终端配置，实验性支持 Debian/Ubuntu 与 WSL",
  domain: "github.com",
  fallback: ">_",
  url: "https://github.com/lewislulu/terminal-setup",
};

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

test("QuickNav classifies the Apple Design skill under AI visual design", () => {
  const categoryMatch = quickNavSource.match(
    /title: "AI 视觉与设计"([\s\S]*?)title: "前端动效与组件"/,
  );
  assert.ok(categoryMatch, "AI visual design category should exist");

  const siteMatch = categoryMatch[1].match(
    new RegExp(`name: "${escapeRegExp(appleDesignSkill.name)}"([\\s\\S]*?)\\n\\s*},`),
  );
  assert.ok(siteMatch, `${appleDesignSkill.name} should exist in the category`);
  assert.match(
    siteMatch[1],
    new RegExp(`domain: "${escapeRegExp(appleDesignSkill.domain)}"`),
  );
  assert.match(
    siteMatch[1],
    new RegExp(`url: "${escapeRegExp(appleDesignSkill.url)}"`),
  );
  assert.equal(
    quickNavSource.split(`url: "${appleDesignSkill.url}"`).length - 1,
    1,
    `${appleDesignSkill.url} should appear exactly once`,
  );
});

test("QuickNav classifies Orca under AI development workflows", () => {
  const categoryMatch = quickNavSource.match(
    /title: "AI 开发与工作流"([\s\S]*?)title: "AI 实践与指南"/,
  );
  assert.ok(categoryMatch, "AI development workflow category should exist");

  const siteMatch = categoryMatch[1].match(
    new RegExp(`name: "${escapeRegExp(orcaSite.name)}"([\\s\\S]*?)\\n\\s*},`),
  );
  assert.ok(siteMatch, `${orcaSite.name} should exist in the category`);
  assert.match(siteMatch[1], new RegExp(`domain: "${escapeRegExp(orcaSite.domain)}"`));
  assert.match(siteMatch[1], new RegExp(`url: "${escapeRegExp(orcaSite.url)}"`));
  assert.equal(
    quickNavSource.split(`url: "${orcaSite.url}"`).length - 1,
    1,
    `${orcaSite.url} should appear exactly once`,
  );
});

test("QuickNav places Orca immediately after cc-pocket", () => {
  const categoryMatch = quickNavSource.match(
    /title: "AI 开发与工作流"([\s\S]*?)title: "AI 实践与指南"/,
  );
  assert.ok(categoryMatch, "AI development workflow category should exist");

  const siteNames = Array.from(
    categoryMatch[1].matchAll(/name: "([^"]+)"/g),
    (match) => match[1],
  );
  const ccPocketIndex = siteNames.indexOf("cc-pocket");
  assert.notEqual(ccPocketIndex, -1, "cc-pocket should exist in the category");
  assert.equal(siteNames[ccPocketIndex + 1], "Orca");
});

test("QuickNav classifies Paseo under AI development workflows", () => {
  const categoryMatch = quickNavSource.match(
    /title: "AI 开发与工作流"([\s\S]*?)title: "AI 实践与指南"/,
  );
  assert.ok(categoryMatch, "AI development workflow category should exist");

  const siteMatch = categoryMatch[1].match(
    new RegExp(`name: "${escapeRegExp(paseoSite.name)}"([\\s\\S]*?)\\n\\s*},`),
  );
  assert.ok(siteMatch, `${paseoSite.name} should exist in the category`);
  assert.match(siteMatch[1], new RegExp(`desc: "${escapeRegExp(paseoSite.desc)}"`));
  assert.match(siteMatch[1], new RegExp(`domain: "${escapeRegExp(paseoSite.domain)}"`));
  assert.match(
    siteMatch[1],
    new RegExp(`fallback: "${escapeRegExp(paseoSite.fallback)}"`),
  );
  assert.match(siteMatch[1], new RegExp(`url: "${escapeRegExp(paseoSite.url)}"`));
  assert.equal(
    quickNavSource.split(`url: "${paseoSite.url}"`).length - 1,
    1,
    `${paseoSite.url} should appear exactly once`,
  );
});

test("QuickNav classifies terminal-setup under environment management", () => {
  const categoryMatch = quickNavSource.match(
    /title: "环境与版本管理"([\s\S]*?)title: "系统与效率工具"/,
  );
  assert.ok(categoryMatch, "environment management category should exist");

  const siteMatch = categoryMatch[1].match(
    new RegExp(
      `name: "${escapeRegExp(terminalSetupSite.name)}"([\\s\\S]*?)\\n\\s*},`,
    ),
  );
  assert.ok(siteMatch, `${terminalSetupSite.name} should exist in the category`);
  assert.match(
    siteMatch[1],
    new RegExp(`desc: "${escapeRegExp(terminalSetupSite.desc)}"`),
  );
  assert.match(
    siteMatch[1],
    new RegExp(`domain: "${escapeRegExp(terminalSetupSite.domain)}"`),
  );
  assert.match(
    siteMatch[1],
    new RegExp(`fallback: "${escapeRegExp(terminalSetupSite.fallback)}"`),
  );
  assert.match(
    siteMatch[1],
    new RegExp(`url: "${escapeRegExp(terminalSetupSite.url)}"`),
  );
  assert.equal(
    quickNavSource.split(`url: "${terminalSetupSite.url}"`).length - 1,
    1,
    `${terminalSetupSite.url} should appear exactly once`,
  );
});
