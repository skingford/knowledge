<template>
  <svg viewBox="0 0 560 130" xmlns="http://www.w3.org/2000/svg" aria-label="GMP 调度角色说明图" role="img">
    <rect x="5" y="5" width="550" height="120" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="280" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go Scheduler</text>
    <text x="40" y="55" font-size="12" fill="var(--d-rv-a-text)" font-weight="bold">G</text>
    <text x="60" y="55" font-size="12" fill="var(--d-text)">(Goroutine) 待执行的任务单元</text>
    <text x="40" y="75" font-size="12" fill="var(--d-rv-b-text)" font-weight="bold">M</text>
    <text x="60" y="75" font-size="12" fill="var(--d-text)">(Machine) 操作系统线程，真正执行代码</text>
    <text x="40" y="95" font-size="12" fill="var(--d-rv-c-text)" font-weight="bold">P</text>
    <text x="60" y="95" font-size="12" fill="var(--d-text)">(Processor) 逻辑处理器，持有本地队列和执行上下文</text>
    <text x="40" y="115" font-size="11" fill="var(--d-text-muted)">默认 P 的数量 = runtime.GOMAXPROCS = CPU 核数</text>
  </svg>
</template>
