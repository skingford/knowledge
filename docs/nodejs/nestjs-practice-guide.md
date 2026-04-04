---
title: NestJS 实战指南
description: 系统整理 NestJS 项目结构、模块边界、DTO 校验、数据库事务、鉴权、可观测性、测试与部署实践。
---

# NestJS 实战指南

如果你决定用 Node.js 做服务端开发，NestJS 往往是很容易进入团队工程化的一条路。

它的价值，不只是“有装饰器、看起来像 Spring Boot”，而是把 Node.js 服务里最容易散掉的几条线收起来了：

- 模块怎么拆
- 请求链路怎么组织
- 依赖怎么注入
- 参数怎么校验
- 权限、错误、日志和事务应该落在哪一层

这篇文档的目标，不是罗列 API，而是把 NestJS 真正能落到项目里的工程主线讲清。

## 适合谁看

- 已经会写 TypeScript，准备把 Node.js 从脚本或轻量接口推进到可长期维护的后端服务
- 已经搭过 NestJS 项目，但 Controller、Service、DTO、Entity 和 Repository 还经常混在一起
- 想用一套更稳定的方式处理校验、鉴权、事务、可观测性、测试和部署
- 面试或项目复盘里需要说清楚 NestJS 为什么适合团队协作、它的边界又在哪里

## 学习目标

- 建立 NestJS 的模块化心智模型，而不是只会堆装饰器
- 理解依赖注入的四种 provider 注册方式、自定义 token 和作用域选择
- 掌握动态模块、全局模块、懒加载模块的设计意图和适用场景
- 明确请求链路里 Pipe、Guard、Interceptor、Filter 的职责边界
- 会写自定义装饰器，用 SetMetadata + Reflector 做声明式权限控制
- 理清 DTO、Entity、领域对象、数据库模型和响应模型的分层方式，掌握序列化机制
- 理解生命周期钩子的执行顺序，能正确处理资源初始化和优雅关闭
- 让数据库事务、异步任务、配置治理、日志和测试有一条可落地的工程主线

## 快速导航

- [为什么很多团队会选 NestJS](#为什么很多团队会选-nestjs)
- [先把 NestJS 放回 Node.js 服务端主线](#先把-nestjs-放回-nodejs-服务端主线)
- [项目结构先稳住](#项目结构先稳住)
- [依赖注入机制深入](#依赖注入机制深入)
- [模块系统进阶](#模块系统进阶)
- [Controller、Service、Repository 怎么分层](#controllerservicerepository-怎么分层)
- [DTO、Entity 和 View Model 不要混用](#dtoentity-和-view-model-不要混用)
- [序列化与响应转换](#序列化与响应转换)
- [Pipe、Guard、Interceptor、Filter 的分工](#pipeguardinterceptorfilter-的分工)
- [自定义装饰器与元数据](#自定义装饰器与元数据)
- [生命周期钩子](#生命周期钩子)
- [配置、数据库与事务边界](#配置数据库与事务边界)
- [认证、授权与请求上下文](#认证授权与请求上下文)
- [异步任务、队列和定时任务](#异步任务队列和定时任务)
- [Swagger / OpenAPI 文档生成](#swagger-openapi-文档生成)
- [测试与部署清单](#测试与部署清单)
- [常见坏味道](#常见坏味道)

## 为什么很多团队会选 NestJS

NestJS 常见优势包括：

- 用 `Module` 把服务拆成明确的业务边界
- 用依赖注入组织 provider，减少手写装配代码
- 对 Controller、Pipe、Guard、Interceptor、Filter 这些横切能力有明确落点
- TypeScript 支持较完整，适合中大型团队协作
- 可以自然接 Prisma、TypeORM、MikroORM、BullMQ、Passport、OpenTelemetry 等生态

但也要先有两个判断：

- NestJS 只是框架，不会自动替你解决事务、一致性、权限和领域建模问题
- 项目一旦大起来，真正决定可维护性的通常是模块边界和工程约束，而不是装饰器本身

## 先把 NestJS 放回 Node.js 服务端主线

Node.js 服务端最容易先散掉的，通常不是路由写法，而是这几条线没有统一：

- HTTP 请求怎么进入系统
- 参数在哪校验
- 权限在哪判断
- 业务规则在哪表达
- 数据库事务在哪收口
- 错误怎么变成稳定响应
- 日志和 tracing 怎么贯穿请求

如果你还没把 Node.js 运行时、阻塞定位、内存和 CPU 排障这条底层主线理顺，建议先补：

- [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)
- [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](./module-system-esm-commonjs-and-monorepo-boundaries.md)
- [Node.js 高并发解决方案实践](./high-concurrency-solution-practice.md)
- [Node.js 限流、超时与过载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)
- [Node.js HTTP Client、重试、熔断与退避实践](./http-client-retry-circuit-breaker-and-backoff-practice.md)
- [Node.js 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

NestJS 的典型请求链路可以先理解成：

```text
Client
  -> Middleware
  -> Guard
  -> Interceptor(before)
  -> Pipe
  -> Controller
  -> Service
  -> Repository / External SDK
  -> Interceptor(after)
  -> Exception Filter
  -> Response
```

这个图最重要的不是背顺序，而是明确每一层都应该只做它自己的事。

## 项目结构先稳住

一个适合长期维护的 NestJS 项目，至少建议分清这些目录：

```text
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── decorators/
├── config/
│   ├── configuration.ts
│   └── validation.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   └── strategies/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   ├── entities/
│   │   └── repositories/
│   └── orders/
│       ├── orders.controller.ts
│       ├── orders.module.ts
│       ├── orders.service.ts
│       ├── dto/
│       └── repositories/
└── infra/
    ├── prisma/
    ├── redis/
    └── queue/
```

这个结构想解决的不是“看起来整齐”，而是下面几件事：

- `common/` 放横切能力，不让每个业务模块都重复造轮子
- `modules/` 按业务边界拆，而不是按技术类型拆成超大的 `controllers/`、`services/`
- `infra/` 放数据库、缓存、消息队列、第三方 SDK 等基础设施接入层
- DTO、entity、repository 这些更贴近业务模块的对象，尽量和模块放在一起

### 一个很常见的反模式

项目刚起步就把所有文件都塞到：

- `controllers/`
- `services/`
- `entities/`

短期目录很短，后面一旦业务变多，跨文件跳转会非常痛苦，模块边界也越来越模糊。

## 依赖注入机制深入

NestJS 整个运行时都建立在依赖注入之上。如果你只是用 `@Injectable()` + 构造函数注入，能覆盖 80% 场景，但剩下 20% 的场景不理解 provider 注册方式和作用域，就会卡住。

### 1. Provider 四种注册方式

```ts
@Module({
  providers: [
    // 1. useClass —— 最常见，容器自动实例化
    { provide: UserService, useClass: UserService },
    // 简写就是 UserService

    // 2. useValue —— 注入一个现成的值或对象
    { provide: 'APP_CONFIG', useValue: { maxRetry: 3 } },

    // 3. useFactory —— 需要异步初始化或依赖其他 provider
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (config: ConfigService) => {
        return createRedisClient(config.get('REDIS_URL'))
      },
      inject: [ConfigService],
    },

    // 4. useExisting —— 给已有 provider 起别名
    { provide: 'AliasLogger', useExisting: LoggerService },
  ],
})
```

怎么选：

- 大部分业务 service 用 `useClass` 就够
- 常量、配置对象用 `useValue`
- 需要异步初始化的基础设施（Redis、数据库、第三方 SDK）用 `useFactory`
- 想让同一个实例被不同 token 引用时用 `useExisting`

### 2. 自定义 Injection Token

当你需要注入接口或非 class 类型时，TypeScript 的接口在运行时会丢失，所以不能直接用接口做 token：

```ts
// 定义 token
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY')

// 注册
{
  provide: PAYMENT_GATEWAY,
  useClass: StripePaymentGateway,
}

// 注入
@Injectable()
export class OrderService {
  constructor(
    @Inject(PAYMENT_GATEWAY) private gateway: PaymentGateway,
  ) {}
}
```

这让你可以随时把 `StripePaymentGateway` 换成 `AlipayPaymentGateway`，而 `OrderService` 完全不用改。

### 3. 循环依赖与 forwardRef

两个 service 互相注入就会出现循环依赖。NestJS 提供 `forwardRef` 来解决：

```ts
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
  ) {}
}
```

但 `forwardRef` 是"止痛药"，不是"解药"。如果你发现频繁需要它，通常说明：

- 两个 service 的职责边界没拆清
- 应该提取一个共享 service 或用事件机制解耦

### 4. Provider 作用域

NestJS provider 默认是 **单例（DEFAULT）**，整个应用共享一个实例。还有两种作用域：

| 作用域 | 实例创建时机 | 适用场景 |
| --- | --- | --- |
| DEFAULT | 应用启动时创建一次 | 绝大多数 service |
| REQUEST | 每个请求创建一个 | 明确依赖请求上下文的对象 |
| TRANSIENT | 每次注入创建一个 | 无状态的工具类，需要独立实例 |

```ts
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService { ... }
```

**性能警告**：request scope 会向上"传染"——如果 A 是 request scope，依赖 A 的 B 也会变成 request scope。大量 provider 变成 request scope 会显著增加每个请求的实例化开销。

原则：只在确实需要请求级隔离时才用 request scope，仅仅为了"拿到当前用户"不值得把整条依赖链都变成 request scope——用 middleware 或 decorator 把用户信息注入请求对象更轻量。

## 模块系统进阶

NestJS 用 `Module` 组织代码，但如果只会写 `imports / providers / exports`，就很难理解 ConfigModule 为什么要 `forRoot()`、TypeOrmModule 为什么要 `forFeature()`。

### 1. 动态模块

动态模块的核心思路是：模块的配置由调用方决定，而不是模块自己硬编码。

```ts
// 一个典型的动态模块
@Module({})
export class MailModule {
  static forRoot(options: MailOptions): DynamicModule {
    return {
      module: MailModule,
      providers: [
        { provide: 'MAIL_OPTIONS', useValue: options },
        MailService,
      ],
      exports: [MailService],
    }
  }

  static forRootAsync(options: MailAsyncOptions): DynamicModule {
    return {
      module: MailModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'MAIL_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        MailService,
      ],
      exports: [MailService],
    }
  }
}
```

`forRoot` 和 `forFeature` 的分工：

- `forRoot`：全局注册一次，通常在 AppModule 里调用，负责创建共享的连接或配置
- `forFeature`：在业务模块里调用，注册模块级别的资源（比如 TypeORM 的 entity）

这不是语法约定，而是**架构约定**：全局状态注册一次，模块级状态按需注册。

### 2. 全局模块

```ts
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
```

`@Global()` 让模块的 exports 在所有模块中可用，不需要显式 import。

适合用的场景：日志、配置、数据库连接这些**真正全局共享**的基础设施。

不适合用的场景：业务 service。一旦业务 service 变成全局，模块边界就名存实亡了。

### 3. 模块重导出

```ts
@Module({
  imports: [DatabaseModule],
  exports: [DatabaseModule], // 重导出，让导入 CommonModule 的模块也能用 DatabaseModule
})
export class CommonModule {}
```

适用场景：把多个基础设施模块聚合成一个"公共模块"，减少业务模块的 import 列表。

### 4. 懒加载模块

```ts
@Injectable()
export class ReportService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  async generateReport() {
    const { PdfModule } = await import('./pdf/pdf.module')
    const moduleRef = await this.lazyModuleLoader.load(() => PdfModule)
    const pdfService = moduleRef.get(PdfService)
    return pdfService.generate()
  }
}
```

适合：启动时不需要加载的重量级模块（PDF 生成、数据分析、CLI 子命令）。减少冷启动时间，按需加载。

## Controller、Service、Repository 怎么分层

### 1. Controller 要尽量薄

Controller 更适合做这些事：

- 接 HTTP 参数
- 调用 service
- 选择响应状态码
- 调整少量接口语义

不要在 Controller 里堆这些逻辑：

- 多表事务
- 复杂业务编排
- 权限细节判断
- 大段数据转换
- 外部系统调用重试

### 2. Service 负责业务流程和规则

Service 更适合承接：

- 业务校验
- 状态流转
- 多 repository / 外部服务编排
- 事务边界
- 幂等、补偿、审计等业务策略

### 3. Repository 负责数据访问，不负责业务决策

Repository / DAO 层应该重点关心：

- 查询条件怎么表达
- 数据怎么持久化
- 返回什么样的持久化对象

但不要把业务规则塞进 repository，比如：

- “未支付订单不能取消”
- “只有管理员可以查看全部用户”

这些判断应该回到 service 或策略层。

## DTO、Entity 和 View Model 不要混用

NestJS 项目里最容易失控的一件事，就是把一个类同时拿来做：

- 请求参数 DTO
- 数据库存储模型
- 内部领域对象
- 对外响应结构

这样短期省事，长期一定越来越混乱。

更稳的方式是：

- `CreateUserDto` / `UpdateUserDto`：只负责输入校验
- `UserEntity` 或领域对象：只表达领域语义
- ORM 模型：只负责持久化映射
- `UserView` / `UserResponseDto`：只负责返回给外部的结构

### 推荐的最小边界

```text
HTTP 输入 -> DTO
业务处理 -> Entity / Domain Model
数据库交互 -> ORM Model / Repository
HTTP 输出 -> Response DTO / View Model
```

### 为什么这件事重要

因为一旦字段含义发生变化，比如：

- 内部需要 `passwordHash`
- 外部绝不能返回 `passwordHash`
- 请求里传的是 `password`

你就会发现“一个对象走天下”的写法很快变成灾难。

## 序列化与响应转换

上面讲了 DTO、Entity 和 View Model 要分开，但实际项目里手动在每个 controller 方法里做字段映射太啰嗦。NestJS 提供了内建的序列化机制。

### 1. ClassSerializerInterceptor

配合 `class-transformer`，在 entity 上声明哪些字段要隐藏：

```ts
import { Exclude, Expose } from 'class-transformer'

export class UserEntity {
  id: number
  email: string

  @Exclude()
  passwordHash: string

  @Expose()
  get displayName(): string {
    return this.email.split('@')[0]
  }
}
```

全局启用序列化：

```ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
```

这样 controller 返回 `UserEntity` 实例时，`passwordHash` 会自动被剔除，`displayName` 会自动出现在响应里。

### 2. 分组序列化

同一个实体，管理员和普通用户看到的字段不同：

```ts
export class UserEntity {
  id: number
  email: string

  @Expose({ groups: ['admin'] })
  role: string

  @Expose({ groups: ['admin'] })
  lastLoginIp: string
}
```

在 controller 里通过 `@SerializeOptions` 指定当前请求的分组：

```ts
@Get('profile')
@SerializeOptions({ groups: ['user'] })
getProfile() { ... }

@Get('admin/users')
@SerializeOptions({ groups: ['admin'] })
getAdminUserList() { ... }
```

### 3. 统一响应包装

大部分项目需要统一响应格式 `{ code, data, message }`。用自定义 Interceptor 做全局包装：

```ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 0,
        data,
        message: 'success',
      })),
    )
  }
}
```

注意：统一包装和 `ClassSerializerInterceptor` 可以同时用，但要注意注册顺序——先序列化，再包装。

## Pipe、Guard、Interceptor、Filter 的分工

这几个概念常被混用，但它们其实职责非常清楚。

### 1. Pipe：处理“输入是否可用”

Pipe 更适合做：

- 参数转换
- DTO 校验
- 枚举、数字、日期等格式归一

例如全局启用 `ValidationPipe`：

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
```

这类配置的价值，是把“未知字段”“类型不对”“参数格式不对”尽量挡在 Controller 外面。

### 2. Guard：处理“有没有资格进入业务”

Guard 更适合做：

- 是否登录
- 是否具备某个角色或权限
- 是否满足某个访问策略

Guard 的问题是“你能不能进来”，不是“你提交的数据对不对”。

### 3. Interceptor：处理“请求前后要做什么横切增强”

Interceptor 常见用途：

- 统一响应包装
- 请求耗时统计
- tracing / metrics 埋点
- 缓存
- 对返回值做统一转换

### 4. Exception Filter：处理“出错后怎么稳定返回”

Filter 更适合做：

- 捕获业务异常
- 映射状态码和错误码
- 统一错误响应格式
- 记录 request id、trace id 和关键错误上下文

### 一个实用判断法

- 输入不合法：优先 Pipe
- 没权限：优先 Guard
- 需要横切增强：优先 Interceptor
- 需要统一错误出口：优先 Filter

## 自定义装饰器与元数据

NestJS 的很多能力（Guard 判断角色、参数提取当前用户）都依赖自定义装饰器。这不是"高级用法"，而是日常开发的基本工具。

### 1. 参数装饰器：createParamDecorator

从请求上下文中提取信息，注入到 controller 方法参数里：

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user
    return data ? user?.[data] : user
  },
)
```

使用：

```ts
@Get('profile')
getProfile(@CurrentUser() user: UserEntity) { ... }

@Get('email')
getEmail(@CurrentUser('email') email: string) { ... }
```

### 2. 元数据装饰器：SetMetadata + Reflector

用来在 controller 或方法上打标记，配合 Guard 做声明式权限控制：

```ts
// 定义角色装饰器
import { SetMetadata } from '@nestjs/common'
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

// Guard 中读取元数据
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    )
    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.some(role => user.roles?.includes(role))
  }
}
```

使用：

```ts
@Post('admin/users')
@Roles('admin')
createUser(@Body() dto: CreateUserDto) { ... }
```

这种模式的好处是权限声明和业务逻辑彻底分离。加一个权限检查只需要加一个装饰器，不需要改 controller 内部代码。

### 3. 组合装饰器：applyDecorators

当多个装饰器总是一起出现时，合并成一个减少重复：

```ts
import { applyDecorators, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger'

export function Auth(...roles: string[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '未登录或权限不足' }),
  )
}
```

使用：

```ts
@Post('admin/users')
@Auth('admin')
createUser(@Body() dto: CreateUserDto) { ... }
```

一个装饰器就包含了：角色声明、Guard 挂载、Swagger 文档标记。

## 配置、数据库与事务边界

### 1. 配置不要散在 `process.env`

更稳的做法是用 `@nestjs/config` 做统一收口：

- 在 `ConfigModule` 里集中加载
- 启动时做 schema 校验
- 通过 typed config 暴露给业务层

如果你想把配置管理、日志、测试和 CI 这条工程化主线单独理顺，继续看：

- [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md)
- [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md)

如果你还想把 `@nestjs/config`、secret 注入、Webhook / JWT key 兼容窗口和外部 API token 轮换这条线单独理顺，继续看：

- [Node.js Secrets、密钥与凭证轮换实践](./secret-management-and-credential-rotation-practice.md)

如果你想把运行时开关、灰度放量和 kill switch 单独理顺，继续看：

- [Node.js Feature Flag、运行时开关与灰度治理实践](./feature-flag-and-runtime-governance-practice.md)

最怕的是：

- Controller 直接读 `process.env`
- Service 到处拼环境变量名
- 某个必填配置缺失，结果线上跑到一半才报错

### 2. 数据库接入先选“边界”，再选 ORM

无论你用 Prisma、TypeORM 还是 MikroORM，都建议先想清这几个问题：

- Repository 是否是唯一数据库入口
- 事务在哪里发起
- 查询对象和响应对象是否分层
- 是否允许 service 直接到处写 SQL / ORM 调用

如果你想把连接管理、事务边界、Repository 分层和 ORM / Query Builder 取舍单独系统化，继续看：

- [Node.js 数据库、事务与 ORM/Query Builder 实践](./database-transaction-and-orm-practice.md)

### 3. 事务边界通常应该落在 service

比较稳的思路通常是：

- repository 负责单一数据访问动作
- service 负责把多个动作组合成一个业务事务

不要在每个 repository 方法里偷偷提交事务。  
一旦有跨表一致性、库存扣减、订单创建、积分入账这种流程，就很难收口。

### 4. API 版本管理

生产项目迟早要面对 API 版本共存的问题。NestJS 内建支持三种方式：

```ts
// main.ts
app.enableVersioning({
  type: VersioningType.URI, // /v1/users、/v2/users
})
```

在 controller 里声明版本：

```ts
@Controller({ path: 'users', version: '1' })
export class UsersV1Controller { ... }

@Controller({ path: 'users', version: '2' })
export class UsersV2Controller { ... }
```

也可以在单个方法上用 `@Version('2')`。

三种版本策略：

| 策略 | 示例 | 推荐程度 |
| --- | --- | --- |
| URI | `/v1/users` | 推荐，最直观，网关和文档友好 |
| Header | `X-API-Version: 1` | 适合内部服务 |
| Media Type | `Accept: application/vnd.app.v1+json` | REST 纯粹主义，实际较少用 |

### 5. 请求作用域 provider 要谨慎

NestJS 支持 request-scoped provider，但它不是默认就该用的能力。

它适合：

- 明确依赖请求上下文的对象
- 需要按请求构造的轻量对象

不适合：

- 把大量 service 都变成 request scope
- 只为了“拿到当前用户”就全局放大实例创建成本

## 认证、授权与请求上下文

### 1. 认证和授权要拆开

- 认证：你是谁
- 授权：你能做什么

很多项目的问题不是没做登录，而是把授权逻辑散在每个 Controller 里：

```ts
if (user.role !== 'admin') {
  throw new ForbiddenException()
}
```

这种写法一多，后面会非常难维护。

### 2. 更稳的做法

- Guard 负责完成认证或基础访问控制
- Service / policy 层负责业务级授权判断
- 通过自定义 decorator 或上下文对象把当前用户注入到边界层

### 3. 请求上下文最好有统一载体

一个成熟一点的服务，通常会把这些信息贯穿整个请求：

- request id
- trace id
- 当前用户
- 租户信息
- 调用来源

你可以用 middleware + interceptor + logger context 把它们串起来，而不是到处手写透传。

如果你想把 request id、日志、trace 和指标观测链路单独理顺，继续看：

- [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md)

## 生命周期钩子

NestJS 应用从启动到关闭有一组明确的生命周期钩子。理解它们才能正确处理资源初始化和优雅关闭。

### 启动阶段

```text
构造函数 → onModuleInit → onApplicationBootstrap → 开始监听请求
```

- `onModuleInit`：模块内 provider 初始化完成后调用，适合做数据库连接预热、缓存预加载
- `onApplicationBootstrap`：所有模块初始化完成后调用，适合做跨模块的启动逻辑

### 关闭阶段

```text
收到 SIGTERM → onModuleDestroy → beforeApplicationShutdown → onApplicationShutdown → 进程退出
```

- `onModuleDestroy`：开始销毁模块，适合清理定时任务、关闭消费者
- `beforeApplicationShutdown(signal)`：HTTP server 还在运行，可以做最后的请求收尾
- `onApplicationShutdown(signal)`：HTTP server 已关闭，适合关闭数据库连接池、Redis 连接

### 必须显式启用

```ts
const app = await NestFactory.create(AppModule)
app.enableShutdownHooks() // 不调用这行，关闭阶段的钩子不会触发
```

### 典型用法

```ts
@Injectable()
export class QueueConsumer implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer

  async onModuleInit() {
    this.consumer = await createConsumer()
    await this.consumer.start()
  }

  async onModuleDestroy() {
    await this.consumer.stop()
  }
}
```

为什么不能省略：如果不写关闭钩子，容器退出时消费者可能正在处理消息，数据库连接池可能有未完成的事务，都会导致数据不一致或资源泄漏。

## 异步任务、队列和定时任务

NestJS 很容易让人把所有逻辑都塞进 HTTP 请求里，但很多场景更适合拆到异步链路：

- 发邮件、短信、站内信
- 导出报表
- 调第三方接口做重试
- 批量同步或补偿任务

### 更稳的拆分方式

- HTTP 请求只做快速确认
- 真正的重任务扔到队列或后台任务
- 明确重试、幂等、告警和死信策略

如果用 BullMQ 这类队列，至少要先想清：

- 任务唯一键怎么设计
- 重试几次
- 幂等怎么做
- 失败后是人工处理还是自动补偿

定时任务也一样。  
不要因为 NestJS 提供 `@Cron()` 就直接把所有任务写到一个 service 里，最好先把任务边界、锁、重复执行风险和监控方式讲清。

如果你想把队列、定时任务、worker、重试、死信和优雅关闭单独理顺，继续看：

- [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md)
- [Node.js 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- [Node.js Webhook、回调与签名校验实践](/nodejs/webhook-and-callback-practice)
- [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md)

## Swagger / OpenAPI 文档生成

团队协作和前后端对接，API 文档不是可选项。NestJS 通过 `@nestjs/swagger` 可以从代码直接生成 OpenAPI 文档。

### 基本接入

```ts
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const config = new DocumentBuilder()
  .setTitle('Order API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api-docs', app, document)
```

### DTO 装饰器驱动文档

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateOrderDto {
  @ApiProperty({ description: '商品 ID', example: 'prod_001' })
  @IsString()
  productId: string

  @ApiProperty({ description: '数量', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}
```

如果你已经用了 `class-validator` 装饰器，`@nestjs/swagger` 的 CLI 插件可以自动推断部分 schema，减少重复标注。

### Controller 装饰器

```ts
@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  @Post()
  @ApiOperation({ summary: '创建订单' })
  @ApiResponse({ status: 201, description: '订单创建成功' })
  @ApiResponse({ status: 400, description: '参数校验失败' })
  create(@Body() dto: CreateOrderDto) { ... }
}
```

### 实用建议

- 开发和测试环境开启 Swagger，生产环境通过环境变量关闭
- DTO 是文档的主要信息源，保持 DTO 装饰器和校验装饰器同步
- 复杂响应结构用 `@ApiResponse` + 自定义 DTO 描述，不要让前端猜返回格式

## 测试与部署清单

### 1. 测试不要只测 Controller 的 200 成功

更健康的覆盖至少包括：

- service 层单元测试
- controller / e2e 测试
- DTO 校验失败路径
- 权限不足路径
- repository / 数据访问集成测试
- 外部依赖失败与超时路径

如果你想把测试分层、Mock/Fake/Test Double、CI 和目录结构单独系统化，继续看：

- [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md)

### 2. e2e 测试重点看什么

- 全局 Pipe 是否生效
- Guard / Filter / Interceptor 是否都接在真正的请求链路上
- 错误响应格式是否稳定
- 鉴权失败、参数错误、业务冲突是否都能返回清晰语义

### 3. 部署前至少检查这些事

- `NODE_ENV`、端口、数据库、缓存、第三方凭证是否统一收口
- 健康检查和 readiness 是否完备
- 日志是否结构化
- 是否支持优雅关闭
- 队列消费者和 HTTP 服务是否需要拆进不同进程
- 是否区分 migration、worker、api 三类启动命令

### 4. 健康检查要落地

部署清单里提到的"健康检查和 readiness 是否完备"，用 `@nestjs/terminus` 落地：

```ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: MicroserviceHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ])
  }
}
```

K8s 场景下，liveness 和 readiness 要分开：

- **liveness**：应用本身是否还活着（死循环、OOM 卡住），失败会重启 Pod
- **readiness**：应用是否准备好接收流量（数据库连不上、缓存没预热），失败会从 Service 摘除

不要把所有检查都放在 liveness 里——数据库短暂不可用不应该导致 Pod 被反复重启。

### 5. 优雅退出不要忽略

Node.js 服务上线后很常见的问题不是“起不来”，而是：

- 容器退出太急，连接没收尾
- 消费者任务处理到一半被杀掉
- 健康检查摘流后仍在接新请求

NestJS 部署到 Docker / K8s 时，建议至少明确：

- `SIGTERM` 到来后怎么停止接新流量
- HTTP server、数据库连接池、消息消费者如何关闭
- preStop、terminationGracePeriodSeconds 和应用关闭逻辑是否对齐

## 常见坏味道

- Controller 里直接写事务和复杂业务
- 一个 DTO 同时承担请求、响应和数据库模型
- 把所有权限判断都写成零散的 `if role === ...`
- 配置读取散落在各层，启动阶段没有统一校验
- 业务 service 直接依赖太多第三方 SDK，没有通过 infra 层或 adapter 收口
- 只有 happy path 测试，没有错误路径、鉴权失败和幂等重试测试
- 所有 provider 都注册为 request scope，每个请求都大量实例化，性能严重下降
- 循环依赖到处用 `forwardRef` 补救，不从模块设计上解决
- 动态模块不区分 `forRoot` / `forFeature`，全局状态和模块级状态混在一起
- 不写生命周期钩子，数据库连接和消费者关闭全靠 `process.exit` 硬杀
- 不写 Swagger 装饰器，前端只能靠口头沟通和抓包猜 API 格式

## 推荐实践项目

### 1. 用户与权限中心

目标：

- 实现登录、刷新令牌、角色权限校验
- 区分认证和授权边界
- 补齐 Guard、Decorator、统一错误响应和审计日志

### 2. 订单与支付回调服务

目标：

- 设计订单创建、库存预扣、支付确认和回调幂等流程
- 把事务边界、状态机、补偿和 outbox 思路讲清
- 让 HTTP 请求链路和异步事件链路能对齐

### 3. 管理后台 BFF

目标：

- 聚合多个下游服务接口
- 设计 DTO、View Model、缓存和错误映射
- 让 Controller 足够薄，Service 能稳定承接编排逻辑

## 高频自检题

- NestJS 的 `Module`、`Controller`、`Provider` 分别在解决什么问题
- `Pipe`、`Guard`、`Interceptor`、`Exception Filter` 各自应该处理哪类问题
- 为什么 DTO、Entity、ORM Model、Response DTO 不应该混成一个类
- 事务为什么通常要在 service 层收口，而不是 repository 各自提交
- 为什么很多异步任务不应该直接塞在 HTTP 请求里完成
- 为什么 request-scoped provider 不能滥用
- `useClass`、`useValue`、`useFactory`、`useExisting` 分别适合什么场景
- 动态模块的 `forRoot` / `forRootAsync` 解决什么问题，和 `forFeature` 怎么分工
- `createParamDecorator` 和 `SetMetadata` + `Reflector` 的典型配合方式是什么
- NestJS 的生命周期钩子执行顺序是什么，优雅关闭为什么需要显式调用 `enableShutdownHooks`
- `ClassSerializerInterceptor` 怎么控制同一实体在不同角色下的返回字段
- 健康检查里 liveness 和 readiness 的区别是什么，为什么不能把所有检查都放在 liveness 里

## 一句话收尾

NestJS 真正的价值，不是把 Node.js 写得更“像 Java”，而是给你一套更适合团队协作的后端骨架。  
只要你把模块边界、输入校验、鉴权、事务、错误处理和部署链路放在一张图里理解，NestJS 才会从“能跑”走到“能长期维护”。
