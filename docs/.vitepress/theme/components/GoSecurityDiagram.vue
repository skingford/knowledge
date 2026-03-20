<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'password-storage'
  | 'jwt-lifecycle'
  | 'tls-mtls'
  | 'sql-injection'
  | 'xss-csp'
  | 'csrf-protection'
  | 'input-validation'
  | 'security-headers'
  | 'secret-lifecycle'
  | 'gosec-pipeline'
  | 'brute-force-protection'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'password-storage': '760px',
  'jwt-lifecycle': '760px',
  'tls-mtls': '760px',
  'sql-injection': '760px',
  'xss-csp': '760px',
  'csrf-protection': '760px',
  'input-validation': '760px',
  'security-headers': '760px',
  'secret-lifecycle': '760px',
  'gosec-pipeline': '760px',
  'brute-force-protection': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'password-storage'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="密码存储图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">密码存储的核心是把明文输入交给自适应哈希算法，数据库永远只保存哈希结果而不是可逆信息</text>
      <rect x="30" y="86" width="118" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">用户密码</text>
      <line x1="148" y1="108" x2="258" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="64" width="180" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="348" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">bcrypt / argon2</text>
      <text x="348" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">自带盐或显式盐</text>
      <text x="348" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可调 cost / memory / time</text>
      <text x="348" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CompareHashAndPassword 验证</text>
      <line x1="438" y1="108" x2="544" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="544" y="64" width="186" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="637" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">数据库</text>
      <text x="637" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只存 hash</text>
      <text x="637" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不存明文 / MD5 / SHA256</text>
      <text x="637" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">泄露后仍提高破解成本</text>
      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">密码哈希追求的是“慢且贵”，和普通数据哈希的目标正好相反</text>
    </svg>

    <svg
      v-else-if="kind === 'jwt-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JWT 生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">JWT 的安全关键不在于“能签发”，而在于签名算法校验、过期控制和密钥管理都要正确落地</text>
      <rect x="28" y="92" width="112" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="117" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">登录成功</text>
      <line x1="140" y1="114" x2="246" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="246" y="64" width="180" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="336" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">签发 token</text>
      <text x="336" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">claims: sub / exp / iat</text>
      <text x="336" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">HS256 或 RS256</text>
      <text x="336" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">secret / private key 来自安全配置</text>
      <line x1="426" y1="114" x2="536" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="426" y1="114" x2="536" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="536" y="68" width="96" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="584" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">客户端保存</text>
      <text x="584" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">短期 access token</text>
      <rect x="536" y="120" width="96" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="584" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">服务端校验</text>
      <text x="584" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">alg + exp + sig</text>
      <rect x="656" y="68" width="76" height="96" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="694" y="90" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">反模式</text>
      <text x="694" y="108" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">硬编码密钥</text>
      <text x="694" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不校验 alg</text>
      <text x="694" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">永不过期</text>
      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">JWT payload 只是可读编码，不是加密容器，别把敏感信息塞进去</text>
    </svg>

    <svg
      v-else-if="kind === 'tls-mtls'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TLS 与 mTLS 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">TLS 解决“客户端是否信任服务端”，mTLS 再额外解决“服务端是否也信任客户端”</text>
      <rect x="36" y="88" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="95" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Client</text>
      <line x1="154" y1="112" x2="286" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="286" y="64" width="190" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="381" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">TLS 握手</text>
      <text x="381" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">服务端证书链验证</text>
      <text x="381" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">TLS 1.2+/安全套件</text>
      <text x="381" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免 InsecureSkipVerify</text>
      <line x1="476" y1="112" x2="606" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="606" y="88" width="118" height="48" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="665" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">HTTPS Server</text>
      <rect x="274" y="176" width="212" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="198" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">mTLS 时：服务端还会验证客户端证书，适合内部服务强身份认证</text>
    </svg>

    <svg
      v-else-if="kind === 'sql-injection'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SQL 注入防护图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">防 SQL 注入的根本原则只有一条：把用户输入当参数绑定进去，而不是拼到 SQL 字符串里</text>
      <rect x="34" y="80" width="154" height="100" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="111" y="102" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">危险路径</text>
      <text x="111" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">fmt.Sprintf(...username...)</text>
      <text x="111" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Raw SQL 拼接</text>
      <text x="111" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">LIKE 拼接通配符</text>
      <line x1="188" y1="130" x2="304" y2="130" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="304" y="64" width="160" height="132" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="384" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">安全路径</text>
      <text x="384" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">db.Query(\"... WHERE id = ?\", id)</text>
      <text x="384" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Prepare + Exec(args)</text>
      <text x="384" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GORM Where(\"name = ?\", name)</text>
      <text x="384" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">通配符也要作为参数</text>
      <line x1="464" y1="130" x2="580" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="580" y="80" width="146" height="100" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="653" y="102" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">数据库驱动</text>
      <text x="653" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">参数单独传输</text>
      <text x="653" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">按类型绑定</text>
      <text x="653" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">输入不再改变 SQL 结构</text>
    </svg>

    <svg
      v-else-if="kind === 'xss-csp'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="XSS 与 CSP 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">XSS 防护分两层：先用正确模板做输出转义，再用 CSP 收紧浏览器执行面</text>
      <rect x="34" y="80" width="156" height="100" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="112" y="102" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">风险输出</text>
      <text x="112" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">text/template</text>
      <text x="112" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">template.HTML(userInput)</text>
      <text x="112" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">脚本直接进入页面</text>
      <line x1="190" y1="130" x2="306" y2="130" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="306" y="64" width="164" height="132" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="388" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">第一层</text>
      <text x="388" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">html/template</text>
      <text x="388" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按上下文自动转义</text>
      <text x="388" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">脚本标签变成纯文本</text>
      <text x="388" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">默认先挡住反射型 XSS</text>
      <line x1="470" y1="130" x2="586" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="586" y="80" width="140" height="100" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="656" y="102" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">第二层</text>
      <text x="656" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">CSP header</text>
      <text x="656" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">限制 script-src</text>
      <text x="656" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">减少被执行的机会</text>
    </svg>

    <svg
      v-else-if="kind === 'csrf-protection'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CSRF 防护图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CSRF 防护的本质是让“浏览器自动带上的 Cookie”还必须配合一个攻击者拿不到的额外证明</text>
      <rect x="28" y="88" width="116" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">浏览器请求</text>
      <text x="86" y="129" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">自动带 Cookie</text>
      <line x1="144" y1="112" x2="258" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="64" width="168" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="342" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">服务端校验第二因子</text>
      <text x="342" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">gorilla/csrf token</text>
      <text x="342" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或 X-CSRF-Token header</text>
      <text x="342" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">配合 SameSite Cookie</text>
      <line x1="426" y1="112" x2="536" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="426" y1="112" x2="536" y2="136" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="536" y="68" width="88" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="580" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">合法页面</text>
      <text x="580" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">能拿到 token</text>
      <rect x="536" y="120" width="88" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="580" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">攻击页面</text>
      <text x="580" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">通常拿不到 token</text>
      <rect x="652" y="68" width="80" height="92" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="692" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">例外</text>
      <text x="692" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">纯 Bearer</text>
      <text x="692" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">不依赖 Cookie</text>
      <text x="692" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">通常免疫</text>
    </svg>

    <svg
      v-else-if="kind === 'input-validation'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="输入验证图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">输入验证的目标不是“格式更漂亮”，而是尽早把恶意、异常和超限数据挡在业务逻辑之前</text>
      <rect x="34" y="86" width="118" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="93" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">HTTP JSON body</text>
      <line x1="152" y1="108" x2="264" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="264" y="64" width="188" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="358" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">Bind + Validate</text>
      <text x="358" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">required / email / min / max</text>
      <text x="358" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">白名单规则优先</text>
      <text x="358" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">长度和范围要有限制</text>
      <line x1="452" y1="108" x2="558" y2="84" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="452" y1="108" x2="558" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="558" y="64" width="166" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="641" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">通过 -> 进入业务逻辑</text>
      <rect x="558" y="116" width="166" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="641" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败 -> 返回通用错误，不泄露内部细节</text>
      <text x="380" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">前端验证只是体验层，服务端验证才是安全边界</text>
    </svg>

    <svg
      v-else-if="kind === 'security-headers'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="安全 Header 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">安全 Header 最稳的做法是放进统一中间件，让每个响应默认都带上基线策略，而不是靠每个 handler 自觉设置</text>
      <rect x="28" y="86" width="118" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">HTTP 响应</text>
      <line x1="146" y1="108" x2="258" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="64" width="220" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="368" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">SecurityHeadersMiddleware</text>
      <text x="368" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">HSTS</text>
      <text x="368" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">X-Content-Type-Options</text>
      <text x="368" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">X-Frame-Options / CSP</text>
      <line x1="478" y1="108" x2="588" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="588" y="64" width="138" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="657" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">浏览器</text>
      <text x="657" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">禁 MIME sniffing</text>
      <text x="657" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">限制 iframe / script</text>
      <text x="657" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">强制 HTTPS</text>
      <text x="380" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">CSP 最容易因为 `unsafe-inline` 失效，Header 统一配置也最容易遗漏，必须中间件化</text>
    </svg>

    <svg
      v-else-if="kind === 'secret-lifecycle'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Secret 生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Secret 管理的核心是把凭据和代码彻底分离，保证它们在开发、构建、部署、日志里都不泄露</text>
      <rect x="32" y="86" width="120" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="92" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">本地开发</text>
      <text x="92" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">.env / .env.example</text>
      <line x1="152" y1="108" x2="268" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="268" y="64" width="184" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="360" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">运行时注入</text>
      <text x="360" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">环境变量 / Secret Volume</text>
      <text x="360" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Vault / Secrets Manager</text>
      <text x="360" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">应用启动时读取</text>
      <line x1="452" y1="108" x2="566" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="64" width="162" height="88" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="647" y="86" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">必须避免</text>
      <text x="647" y="104" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">硬编码进源码</text>
      <text x="647" y="120" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">提交 .env 到 Git</text>
      <text x="647" y="136" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">日志打印 secret</text>
      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真实 secret 不进仓库，只提交模板和加载逻辑。泄露后要能轮换，而不是靠祈祷没人看到</text>
    </svg>

    <svg
      v-else-if="kind === 'gosec-pipeline'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="gosec 流水线图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">gosec 的真正价值不在本地偶尔跑一次，而在于把安全扫描放进 CI，让危险改动在合并前就被拦下</text>
      <rect x="30" y="86" width="114" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">git push / PR</text>
      <line x1="144" y1="108" x2="254" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="254" y="64" width="182" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="345" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">CI security job</text>
      <text x="345" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">gosec ./...</text>
      <text x="345" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">JSON / SARIF 输出</text>
      <text x="345" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GitHub Code Scanning 可视化</text>
      <line x1="436" y1="108" x2="548" y2="84" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="436" y1="108" x2="548" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="548" y="64" width="178" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="637" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">发现 G101 / G201 / G301 等风险</text>
      <rect x="548" y="116" width="178" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="637" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">误报时用 #nosec 并写明原因，不要整片忽略</text>
      <text x="380" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">安全扫描的重点是“持续执行”，不是“规则背得多熟”</text>
    </svg>

    <svg
      v-else-if="kind === 'brute-force-protection'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="防暴力破解图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">防暴力破解不是单纯挡住高 QPS，而是要按用户名和来源维度累计失败并逐步提高攻击成本</text>
      <rect x="28" y="88" width="122" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="113" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">登录请求</text>
      <text x="89" y="129" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">user + IP</text>
      <line x1="150" y1="112" x2="266" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="266" y="64" width="188" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="360" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">限速与失败计数</text>
      <text x="360" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">per-IP / per-user limiter</text>
      <text x="360" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">失败次数累计</text>
      <text x="360" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">delay / temporary lock</text>
      <line x1="454" y1="112" x2="566" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="454" y1="112" x2="566" y2="136" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="68" width="162" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="647" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">合法用户：偶发输错后仍能恢复</text>
      <rect x="566" y="120" width="162" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="647" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">攻击者：尝试越多，等待越久，最终被封锁</text>
      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">只按全局 QPS 限流很容易误伤正常用户，也挡不住分布式代理池攻击</text>
    </svg>
  </DiagramFrame>
</template>
