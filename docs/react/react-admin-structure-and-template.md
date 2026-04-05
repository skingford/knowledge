---
title: React 后台权限模型的目录结构与代码模板
description: 基于 React 中后台的权限、菜单与路由设计，给出一套可直接落地的目录结构、配置拆分方式和代码模板，帮助你把 permission key、路由守卫、菜单配置和权限组件真正放进工程里。
---

# React 后台权限模型的目录结构与代码模板

前一篇我们已经把权限系统拆成了四层：

- 路由权限
- 菜单权限
- 按钮权限
- 字段权限

但很多项目的问题不在“概念没懂”，而在于：**知道应该分层，却不知道代码到底该放哪。**

结果就是大家还是会回到老路：

- 在 `router.tsx` 里混菜单
- 在页面组件里写权限判断
- 在 hooks 里临时拼菜单树
- 在表单组件里顺手处理字段权限

这篇的目标就是把“设计原则”进一步落到工程结构上，给你一套能直接拿去起项目的目录思路和代码模板。

## 适合谁看

- 已经接受 permission key、路由守卫、菜单配置要分层，但不知道怎么组织代码
- 正在起一个 React 中后台项目，想先把目录和模板打稳
- 已经有后台项目，但权限逻辑散在很多文件里，准备整理重构

## 学习目标

- 把权限、菜单、路由、布局和页面消费放进清晰目录结构
- 拿到一套最小可用的代码模板，包括 permission key、权限中心、守卫、菜单配置和权限组件
- 明确哪些逻辑应该放基础设施层，哪些逻辑应该留在业务页面层

## 快速导航

- [先给结论：推荐目录结构](#先给结论推荐目录结构)
- [目录到底怎么拆更稳](#目录到底怎么拆更稳)
- [最小可用代码模板](#最小可用代码模板)
- [菜单、路由、权限怎么串起来](#菜单路由权限怎么串起来)
- [页面里应该怎么消费权限](#页面里应该怎么消费权限)
- [最容易写歪的地方](#最容易写歪的地方)

## 先给结论：推荐目录结构

如果你是 React 后台项目，可以先用这套：

```txt
src/
  app/
    router/
      routes.tsx
      guards.tsx
    layouts/
      app-layout.tsx
    providers/
      auth-provider.tsx
      permission-provider.tsx
  permissions/
    permission-keys.ts
    permission-service.ts
    permission-context.tsx
    permission-gate.tsx
    field-permission.ts
  navigation/
    menus.ts
    menu-builder.ts
  features/
    user-management/
      pages/
      components/
      forms/
      schemas/
    role-management/
      pages/
      components/
  services/
    auth.ts
    user.ts
  hooks/
    use-current-user.ts
    use-permissions.ts
  utils/
  tests/
```

一句话理解：

- `app/router/` 管页面访问边界
- `permissions/` 管统一权限模型
- `navigation/` 管菜单定义和过滤
- `features/` 管业务页面和业务组件
- 页面层只消费权限能力，不重新发明权限规则

## 目录到底怎么拆更稳

### 1. `permissions/` 只负责权限模型，不负责具体页面

这个目录应该尽量稳定，里面放“权限系统公共层”。

建议放这些文件：

- `permission-keys.ts`：统一维护 permission key
- `permission-service.ts`：封装 `hasPermission`、`hasAnyPermission`、`hasAllPermissions`
- `permission-context.tsx`：把当前用户权限注入 React 上下文
- `permission-gate.tsx`：按钮、区块级权限包装组件
- `field-permission.ts`：字段可见、可编辑、脱敏相关工具

这一层的目标不是知道“用户管理页面长什么样”，而是提供一套所有页面都能复用的权限能力。

### 2. `app/router/` 负责访问控制，不负责菜单渲染

路由层要解决的是：

- 用户是否登录
- 是否有访问页面的权限
- 进入后走哪个布局
- 无权限时跳到哪里

它不应该负责：

- 左侧菜单怎么展示
- 某个按钮是否显示
- 页面里某块表单是否禁用

### 3. `navigation/` 只负责导航，不代替路由守卫

建议至少拆成两部分：

- `menus.ts`：声明菜单树
- `menu-builder.ts`：根据权限过滤可见菜单

也就是说，菜单系统只做“给不给入口”，不做“真正拦截访问”。

### 4. `features/` 按业务域拆，而不是按技术类型平铺

权限设计再好，如果业务代码全都堆在 `pages/` 和 `components/` 根目录，后面还是会乱。

更稳的方式通常是：

- 用户管理一组
- 角色管理一组
- 订单管理一组
- 配置中心一组

权限消费逻辑跟着业务域走，但权限规则定义不要散回业务域里。

## 最小可用代码模板

下面这组模板不是完整框架，但足够当项目骨架。

### 1. permission key 常量

```ts
// src/permissions/permission-keys.ts
export const PERMISSIONS = {
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  ROLE_READ: 'role.read',
  ROLE_ASSIGN: 'role.assign',
  ORDER_READ: 'order.read',
  ORDER_EXPORT: 'order.export',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
```

重点不是写成常量对象有多高级，而是：**整个前端项目都只认这一份 key 出口。**

### 2. 权限服务

```ts
// src/permissions/permission-service.ts
import type { PermissionKey } from './permission-keys'

export function createPermissionService(granted: PermissionKey[]) {
  const set = new Set(granted)

  return {
    hasPermission(permission: PermissionKey) {
      return set.has(permission)
    },
    hasAnyPermission(permissions: PermissionKey[]) {
      return permissions.some((permission) => set.has(permission))
    },
    hasAllPermissions(permissions: PermissionKey[]) {
      return permissions.every((permission) => set.has(permission))
    },
  }
}
```

页面不要自己处理数组查找、去重、兼容判断，把这些都收口到这里。

### 3. 权限上下文

```tsx
// src/permissions/permission-context.tsx
import { createContext, useContext } from 'react'
import type { PermissionKey } from './permission-keys'
import { createPermissionService } from './permission-service'

const PermissionContext = createContext(createPermissionService([] as PermissionKey[]))

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions: PermissionKey[]
  children: React.ReactNode
}) {
  const value = createPermissionService(permissions)
  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions() {
  return useContext(PermissionContext)
}
```

页面里只拿 `usePermissions()`，不要让页面去解析用户对象原始结构。

### 4. 按钮 / 区块权限组件

```tsx
// src/permissions/permission-gate.tsx
import type { ReactNode } from 'react'
import type { PermissionKey } from './permission-keys'
import { usePermissions } from './permission-context'

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = usePermissions()
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
}
```

这层价值在于统一消费方式，让页面 JSX 少一点散乱判断。

### 5. 路由配置

```tsx
// src/app/router/routes.tsx
import type { ReactNode } from 'react'
import { PERMISSIONS, type PermissionKey } from '@/permissions/permission-keys'
import { UserListPage } from '@/features/user-management/pages/user-list-page'
import { RoleListPage } from '@/features/role-management/pages/role-list-page'

export type AppRoute = {
  path: string
  element: ReactNode
  permission?: PermissionKey
  withLayout?: boolean
}

export const appRoutes: AppRoute[] = [
  {
    path: '/users',
    element: <UserListPage />,
    permission: PERMISSIONS.USER_READ,
    withLayout: true,
  },
  {
    path: '/roles',
    element: <RoleListPage />,
    permission: PERMISSIONS.ROLE_READ,
    withLayout: true,
  },
]
```

注意这里挂的是访问页面权限，不是按钮权限全集。

### 6. 路由守卫

```tsx
// src/app/router/guards.tsx
import { Navigate } from 'react-router-dom'
import type { PermissionKey } from '@/permissions/permission-keys'
import { usePermissions } from '@/permissions/permission-context'

export function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionKey
  children: React.ReactNode
}) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
```

路由守卫的目标是防止进入页面，不要在这里顺便做菜单逻辑。

### 7. 菜单配置

```ts
// src/navigation/menus.ts
import { PERMISSIONS, type PermissionKey } from '@/permissions/permission-keys'

export type MenuItem = {
  key: string
  title: string
  to?: string
  permission?: PermissionKey
  children?: MenuItem[]
}

export const menus: MenuItem[] = [
  {
    key: 'user-management',
    title: '用户与权限',
    children: [
      {
        key: 'users',
        title: '用户管理',
        to: '/users',
        permission: PERMISSIONS.USER_READ,
      },
      {
        key: 'roles',
        title: '角色管理',
        to: '/roles',
        permission: PERMISSIONS.ROLE_READ,
      },
    ],
  },
]
```

### 8. 菜单过滤器

```ts
// src/navigation/menu-builder.ts
import type { MenuItem } from './menus'
import { createPermissionService } from '@/permissions/permission-service'
import type { PermissionKey } from '@/permissions/permission-keys'

export function buildMenus(items: MenuItem[], permissions: PermissionKey[]): MenuItem[] {
  const service = createPermissionService(permissions)

  function filter(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => !item.permission || service.hasPermission(item.permission))
      .map((item) => ({
        ...item,
        children: item.children ? filter(item.children) : undefined,
      }))
      .filter((item) => !item.children || item.children.length > 0 || item.to)
  }

  return filter(items)
}
```

菜单过滤只负责可见性，不负责访问控制。

## 菜单、路由、权限怎么串起来

推荐的启动顺序通常是：

1. 登录后拿到当前用户和权限列表
2. 用 `PermissionProvider` 注入整棵应用
3. 路由层用 `RequirePermission` 控制页面访问
4. 菜单层用 `buildMenus` 生成可见导航
5. 页面内用 `PermissionGate` 控制按钮和区块

这样整条链路的判断口径才会一致。

## 页面里应该怎么消费权限

以用户管理页为例，页面应该更像这样：

```tsx
import { PERMISSIONS } from '@/permissions/permission-keys'
import { PermissionGate } from '@/permissions/permission-gate'

export function UserListPage() {
  return (
    <section>
      <h1>用户管理</h1>

      <PermissionGate permission={PERMISSIONS.USER_CREATE}>
        <button>新建用户</button>
      </PermissionGate>
    </section>
  )
}
```

而不是这样：

```tsx
currentUser.role === 'admin'
```

页面层应该关心“有没有某个能力”，而不是“当前到底是什么角色”。

## 字段权限模板也要单独留口

如果你已经预判后台里会出现字段级权限，建议一开始就留工具层，而不是等需求来了再四处补。

例如：

```ts
// src/permissions/field-permission.ts
export function canEditField({
  hasPermission,
  permission,
  readonly,
}: {
  hasPermission: (permission: string) => boolean
  permission?: string
  readonly?: boolean
}) {
  if (readonly) return false
  if (!permission) return true
  return hasPermission(permission)
}
```

这类工具不一定一开始就很复杂，但应该有明确归属。

## 最容易写歪的地方

### 1. 把所有配置都塞进一个超级大文件

例如把权限 key、路由、菜单、按钮逻辑全部塞进 `app-config.ts`。短期省文件，长期最难维护。

### 2. 业务页面重新发明权限判断

只要页面里重新开始解析用户角色，你前面的抽象就会慢慢失效。

### 3. 菜单过滤和路由守卫共用一份临时逻辑

它们相关，但职责不一样。能复用的是 permission service，不是把两层直接糊成一个函数。

### 4. 把字段权限写死在表单组件内部

这样后面做复用、做审批流、做状态切换时会很痛苦。

## 最后给一个落地顺序

如果你现在要把这套方案真正落进项目里，建议按这个顺序做：

1. 先补 `permission-keys.ts`
2. 再补 `permission-service.ts` 和 `PermissionProvider`
3. 然后把路由守卫接上
4. 再整理菜单配置和菜单过滤器
5. 最后把页面里的散落判断逐步替换成 `PermissionGate`

这套顺序的好处是：可以渐进式改，不需要一次性大重构。

## 关联阅读

- [React 后台多租户与多组织权限扩展设计](./react-admin-multi-tenant-permission-design.md)
- [React 后台权限、菜单与路由设计：一套不容易失控的方案](./react-admin-permission-menu-routing.md)
- [React 后台管理系统生态组合：一套高效可维护的方案](./react-admin-stack.md)
- [React 生态组合：一套最好用的务实方案](./react-ecosystem-stack.md)
- [React 技术指南：组件、状态、Effect 与工程边界](./react-technical-guide.md)
