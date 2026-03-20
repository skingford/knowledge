<template>
  <svg viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" aria-label="OS 线程模型与 Goroutine 模型对比图" role="img">
    <rect x="5" y="5" width="300" height="270" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="155" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">OS Thread 模型 · 1:1</text>
    <rect x="30" y="50" width="90" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="75" y="73" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">Task 1</text>
    <text x="135" y="73" font-size="14" fill="var(--d-text-sub)">→</text>
    <rect x="155" y="50" width="130" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="220" y="73" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">OS Thread 1</text>
    <rect x="30" y="100" width="90" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="75" y="123" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">Task 2</text>
    <text x="135" y="123" font-size="14" fill="var(--d-text-sub)">→</text>
    <rect x="155" y="100" width="130" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="220" y="123" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">OS Thread 2</text>
    <rect x="30" y="150" width="90" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="75" y="173" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">Task 3</text>
    <text x="135" y="173" font-size="14" fill="var(--d-text-sub)">→</text>
    <rect x="155" y="150" width="130" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="220" y="173" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">OS Thread 3</text>
    <text x="155" y="220" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">每个任务绑定一个线程</text>

    <rect x="375" y="5" width="300" height="270" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="525" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Goroutine 模型 · M:N</text>
    <rect x="395" y="50" width="50" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="420" y="69" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">G1</text>
    <rect x="455" y="50" width="50" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="480" y="69" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">G2</text>
    <rect x="515" y="50" width="50" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="540" y="69" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">G3</text>
    <rect x="575" y="50" width="50" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="600" y="69" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">G4</text>
    <rect x="425" y="86" width="50" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="450" y="105" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">G5</text>
    <rect x="485" y="86" width="50" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="510" y="105" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">G6</text>
    <text x="525" y="132" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="450" y="140" width="150" height="40" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="525" y="165" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">Runtime Scheduler</text>
    <text x="480" y="198" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <text x="570" y="198" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="415" y="206" width="130" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="480" y="229" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">OS Thread M1</text>
    <rect x="555" y="206" width="110" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="610" y="229" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">OS Thread M2</text>
    <text x="525" y="260" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">多个 G 复用少量线程</text>
  </svg>
</template>
