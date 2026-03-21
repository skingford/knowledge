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
  | 'aead-seal-open'
  | 'cipher-interface-stack'
  | 'secure-random-source'
  | 'hash-hmac-flow'
  | 'hybrid-encryption'
  | 'public-key-sign-verify'
  | 'certificate-chain-verify'
  | 'oauth2-code-flow'

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
  'aead-seal-open': '760px',
  'cipher-interface-stack': '760px',
  'secure-random-source': '760px',
  'hash-hmac-flow': '760px',
  'hybrid-encryption': '760px',
  'public-key-sign-verify': '760px',
  'certificate-chain-verify': '760px',
  'oauth2-code-flow': '760px',
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

    <svg
      v-else-if="kind === 'aead-seal-open'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AEAD Seal 与 Open 流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AEAD 的关键不是“能加密”，而是 `Seal` 同时产出密文和认证标签，`Open` 先验签再解密</text>

      <rect x="20" y="52" width="220" height="170" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="130" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">输入材料</text>
      <rect x="42" y="92" width="176" height="26" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="130" y="109" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">key</text>
      <rect x="42" y="126" width="176" height="26" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="130" y="143" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">nonce</text>
      <rect x="42" y="160" width="176" height="26" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="130" y="177" text-anchor="middle" font-size="10" fill="var(--d-text)">plaintext + aad</text>
      <text x="130" y="207" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">同一个 `(key, nonce)` 绝不能复用</text>

      <line x1="240" y1="137" x2="342" y2="137" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="342" y="82" width="164" height="110" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="424" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">AEAD.Seal</text>
      <text x="424" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">CTR/stream 路径负责加密</text>
      <text x="424" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GHASH / Poly1305 负责认证</text>
      <text x="424" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">输出 `ciphertext || tag`</text>
      <text x="424" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">常见格式：`nonce || ciphertext || tag`</text>

      <line x1="506" y1="137" x2="608" y2="102" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="506" y1="137" x2="608" y2="172" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="608" y="72" width="124" height="54" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="670" y="94" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">AEAD.Open</text>
      <text x="670" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">先验证 tag</text>

      <rect x="608" y="144" width="124" height="54" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="670" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">tag 不匹配</text>
      <text x="670" y="182" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">直接报错，不返回明文</text>

      <text x="380" y="242" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">新代码默认优先 AEAD；CBC/CTR 这类“只有加密没有认证”的模式，要额外补完整性保护</text>
    </svg>

    <svg
      v-else-if="kind === 'cipher-interface-stack'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="crypto cipher 接口分层图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`crypto/cipher` 的设计是把“分组原语”和“工作模式”拆开，调用方只在顶层选择自己真正需要的安全语义</text>

      <rect x="24" y="78" width="140" height="90" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="94" y="100" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Block</text>
      <text x="94" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">AES / 3DES</text>
      <text x="94" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只会处理单个 block</text>
      <text x="94" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不直接面向业务使用</text>

      <line x1="164" y1="123" x2="286" y2="90" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="164" y1="123" x2="286" y2="154" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <rect x="286" y="62" width="188" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">AEAD</text>
      <text x="380" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">GCM / ChaCha20-Poly1305</text>

      <rect x="286" y="132" width="188" height="56" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="154" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Stream / BlockMode</text>
      <text x="380" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">CTR / CBC / OFB / CFB</text>

      <line x1="474" y1="90" x2="596" y2="90" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="474" y1="160" x2="596" y2="160" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <rect x="596" y="62" width="136" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="664" y="84" text-anchor="middle" font-size="11" fill="var(--d-text)">推荐</text>
      <text x="664" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">直接拿来做应用层加密</text>

      <rect x="596" y="132" width="136" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="664" y="154" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">谨慎</text>
      <text x="664" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">需要你自己补认证和填充</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此“能加密”不代表“方案安全”；你选的是接口层级，其实也在选风险边界</text>
    </svg>

    <svg
      v-else-if="kind === 'secure-random-source'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="crypto rand 随机源图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`crypto/rand` 的价值不在 API 多简单，而在它把所有随机需求都统一接到了操作系统的 CSPRNG 上</text>

      <rect x="28" y="72" width="176" height="94" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="116" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">操作系统熵源</text>
      <text x="116" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">Linux: getrandom / urandom</text>
      <text x="116" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">macOS: arc4random_buf</text>
      <text x="116" y="146" text-anchor="middle" font-size="9" fill="var(--d-text)">Windows: BCryptGenRandom</text>

      <line x1="204" y1="120" x2="314" y2="120" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="314" y="72" width="132" height="94" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">rand.Reader</text>
      <text x="380" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">全局 io.Reader</text>
      <text x="380" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Read / Int / Prime</text>
      <text x="380" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">拒绝采样保证均匀分布</text>

      <line x1="446" y1="120" x2="552" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="446" y1="120" x2="552" y2="154" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="552" y="58" width="180" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="642" y="80" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">安全用途</text>
      <text x="642" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">token / salt / key / UUID / prime</text>

      <rect x="552" y="126" width="180" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="642" y="148" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">不要混用</text>
      <text x="642" y="164" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">测试采样/游戏概率走 math/rand/v2</text>

      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">一旦结果会进认证、加密、身份标识，就别再考虑性能更快的伪随机源</text>
    </svg>

    <svg
      v-else-if="kind === 'hash-hmac-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="hash 与 HMAC 流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`hash.Hash` 负责流式摘要，HMAC 再在它外面包两层 keyed hash，把“可篡改的摘要”变成“只有共享密钥双方才能伪造”的 MAC</text>

      <rect x="22" y="72" width="184" height="120" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="114" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">hash.Hash</text>
      <text x="114" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">Write(chunk1)</text>
      <text x="114" y="130" text-anchor="middle" font-size="9" fill="var(--d-text)">Write(chunk2)</text>
      <text x="114" y="146" text-anchor="middle" font-size="9" fill="var(--d-text)">...</text>
      <text x="114" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">Sum(nil)</text>
      <text x="114" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">适合文件、流、Merkle 节点</text>

      <line x1="206" y1="132" x2="318" y2="96" stroke="var(--d-border)" stroke-width="1.4" />
      <line x1="206" y1="132" x2="318" y2="168" stroke="var(--d-border)" stroke-width="1.4" />

      <rect x="318" y="66" width="124" height="60" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">inner hash</text>
      <text x="380" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">K ⊕ ipad || message</text>

      <rect x="318" y="138" width="124" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="160" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">outer hash</text>
      <text x="380" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">K ⊕ opad || innerDigest</text>

      <line x1="442" y1="168" x2="552" y2="168" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="552" y="138" width="180" height="60" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="642" y="160" text-anchor="middle" font-size="11" fill="var(--d-text)">HMAC output</text>
      <text x="642" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">hmac.Equal 常量时间比较</text>

      <rect x="552" y="66" width="180" height="48" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="642" y="88" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">普通 SHA256 只做完整性，不做身份认证</text>
      <text x="642" y="102" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">攻击者能重算摘要时，它就不是签名</text>

      <text x="380" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">密码存储别用 SHA/HMAC；那是认证和完整性工具，不是慢哈希</text>
    </svg>

    <svg
      v-else-if="kind === 'hybrid-encryption'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="混合加密图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">RSA 真正常见的现代用法不是“直接加密大消息”，而是只保护一个随机对称密钥，再交给 AEAD 处理真正的数据</text>

      <rect x="24" y="78" width="172" height="110" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="110" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">发送前</text>
      <text x="110" y="120" text-anchor="middle" font-size="9" fill="var(--d-text)">1. 生成随机 AES key</text>
      <text x="110" y="136" text-anchor="middle" font-size="9" fill="var(--d-text)">2. 准备 plaintext</text>
      <text x="110" y="152" text-anchor="middle" font-size="9" fill="var(--d-text)">3. 选择接收方公钥</text>
      <text x="110" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">对称快，非对称慢</text>

      <line x1="196" y1="133" x2="306" y2="98" stroke="var(--d-border)" stroke-width="1.4" />
      <line x1="196" y1="133" x2="306" y2="168" stroke="var(--d-border)" stroke-width="1.4" />

      <rect x="306" y="68" width="148" height="58" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="90" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">RSA-OAEP</text>
      <text x="380" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只加密 AES key</text>

      <rect x="306" y="138" width="148" height="58" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="160" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">AES-GCM / ChaCha20-Poly1305</text>
      <text x="380" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">加密真正的业务数据</text>

      <line x1="454" y1="97" x2="564" y2="97" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="454" y1="167" x2="564" y2="167" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="564" y="60" width="172" height="70" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="650" y="82" text-anchor="middle" font-size="11" fill="var(--d-text)">输出 1</text>
      <text x="650" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">encryptedKey</text>
      <text x="650" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">长度受 RSA 密钥位数限制</text>

      <rect x="564" y="144" width="172" height="70" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="650" y="166" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">输出 2</text>
      <text x="650" y="184" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">nonce || ciphertext || tag</text>
      <text x="650" y="200" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">可安全承载大消息</text>

      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">接收方流程正好反过来：私钥解出 AES key，再用 AEAD `Open` 拿回明文</text>
    </svg>

    <svg
      v-else-if="kind === 'public-key-sign-verify'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="公私钥签名验证图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">公钥签名体系的外部形状都一样：私钥只负责签名，公钥只负责验证；差异在于内部数学和随机性要求</text>

      <rect x="26" y="84" width="146" height="56" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="99" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">message</text>
      <text x="99" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">通常先做 SHA-256 / SHA-512</text>

      <line x1="172" y1="112" x2="280" y2="112" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="280" y="62" width="164" height="100" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="362" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">私钥签名</text>
      <text x="362" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">RSA-PSS / PKCS1v15</text>
      <text x="362" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ECDSA（依赖随机 k）</text>
      <text x="362" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Ed25519（确定性签名）</text>

      <line x1="444" y1="112" x2="552" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="552" y="84" width="182" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="643" y="106" text-anchor="middle" font-size="11" fill="var(--d-text)">signature</text>
      <text x="643" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">和 message 一起传给对端</text>

      <line x1="643" y1="140" x2="643" y2="176" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="520" y="176" width="214" height="44" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="627" y="194" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">公钥验证</text>
      <text x="627" y="210" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">通过才说明“这份内容确实来自持有私钥的一方”</text>

      <text x="248" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">别把“签名验证通过”和“证书链可信”混为一谈；前者只是数学正确，后者还需要 PKI 信任链</text>
    </svg>

    <svg
      v-else-if="kind === 'certificate-chain-verify'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="证书链验证图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">x509.Verify 做的不只是“看一下证书是不是过期”，而是沿着整条链逐层确认签发关系、用途和主机名都成立</text>

      <rect x="32" y="88" width="146" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="105" y="110" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Leaf cert</text>
      <text x="105" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">api.example.com</text>
      <text x="105" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ServerAuth / ClientAuth</text>

      <line x1="178" y1="123" x2="286" y2="123" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="286" y="88" width="146" height="70" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="359" y="110" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Intermediate CA</text>
      <text x="359" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">负责给叶证书签名</text>
      <text x="359" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自身也必须被上级签过</text>

      <line x1="432" y1="123" x2="540" y2="123" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="540" y="88" width="146" height="70" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="613" y="110" text-anchor="middle" font-size="11" fill="var(--d-text)">Root CA</text>
      <text x="613" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">必须已在 CertPool 中信任</text>
      <text x="613" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">SystemCertPool 或自定义 Roots</text>

      <rect x="84" y="184" width="592" height="40" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="201" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">每一层都要过：签名匹配、有效期、KeyUsage/ExtKeyUsage、SAN/DNSName；任何一步失败，整条链都不可信</text>
      <text x="380" y="216" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">所以 `InsecureSkipVerify` 真正绕过的不只是主机名，而是整套身份验证链路</text>
    </svg>

    <svg
      v-else-if="kind === 'oauth2-code-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OAuth2 授权码与刷新流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">OAuth2 客户端真正关键的不是“拿到 token”，而是把 state、授权码交换和 refresh token 刷新这三段链路都做对</text>

      <rect x="26" y="86" width="128" height="74" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">browser / app</text>
      <text x="90" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">带 state 跳转授权页</text>
      <text x="90" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">回调携带 code</text>

      <line x1="154" y1="123" x2="266" y2="123" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="266" y="60" width="188" height="126" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="360" y="84" text-anchor="middle" font-size="11" fill="var(--d-text)">oauth2.Config</text>
      <text x="360" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">AuthCodeURL(state, PKCE...)</text>
      <text x="360" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">回调先校验 state 防 CSRF</text>
      <text x="360" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Exchange(code[, verifier])</text>
      <text x="360" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">拿到 access + refresh token</text>
      <text x="360" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ReuseTokenSource 负责到期刷新</text>

      <line x1="454" y1="123" x2="566" y2="123" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="72" width="168" height="100" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="650" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">OAuth provider</text>
      <text x="650" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">授权页 + token endpoint</text>
      <text x="650" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">code 只能换一次</text>
      <text x="650" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">refresh token 换新 access token</text>

      <rect x="224" y="206" width="312" height="28" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="224" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">公开客户端再加 PKCE：code_challenge / code_verifier 绑定同一次授权，防止授权码被中途截走后重放</text>
    </svg>
  </DiagramFrame>
</template>
