# H5 前端开发工作留痕（完整版）

> **范围**：仅前端实现（`mock` + `services` + `localStorage`），无真实后端。  
> **用途**：阶段验收、作业 `Report.md` 撰写、轻量化文档对照。  
> **最后更新**：2026-06-04

---

## 一、进度总览

| 阶段 | 名称 | 状态 | 完成日期 |
|------|------|------|----------|
| 0 | 数据与路由地基 | ✅ 已完成 | 2026-06-04 |
| 1 | H5 应用壳与基础组件 | ✅ 已完成 | 2026-06-04 |
| 2 | 首页与分类 | ✅ 已完成 | 2026-06-04 |
| 3 | 商品详情与加购 | ✅ 已完成 | 2026-06-04 |
| 4 | 用户体系 | ✅ 已完成 | 2026-06-04 |
| 5 | 购物车 | ✅ 已完成 | 2026-06-04 |
| 6 | 订单交易闭环 | ✅ 已完成 | 2026-06-04 |
| 7 | 体验打磨与可选 | ✅ 已完成 | 2026-06-04 |

---

## 二、README / 轻量化文档 — H5 功能对照（自检）

| 作业/文档要求 | 路由/入口 | 实现文件 | 状态 |
|---------------|-----------|----------|------|
| 商城主页面：搜索框 | `/home?keyword=` | `views/h5/Home.jsx` + `SearchBar` | ✅ |
| 商城主页面：轮播图 | `/home` | `Carousel.jsx` + `home.css` 轮播样式 | ✅ |
| 商城主页面：热门商品 | `/home` | `goodService.getPublicGoodList` + 分页 | ✅ |
| 分类索引 + 分类下商品 | `/category` | `CategoryPage.jsx` | ✅ |
| 商品详情 + 加购/立即购买 | `/detail/:goodId` | `DetailPage.jsx` | ✅ |
| 用户登录/注册 | `/login` | `LoginPage.jsx` + `validation.js` | ✅ |
| 未登录拦截购物车/下单 | 守卫路由 | `RequireUserAuth.jsx` | ✅ |
| 购物车增删改勾选结算 | `/cart` | `CartPage.jsx` + `cartService` | ✅ |
| 创建订单（地址+清单） | `/createOrder/:id`、`/checkout` | `CreateOrderPage`、`CheckoutPage` | ✅ |
| 模拟支付成功/失败 | `/pay/:orderId` | `PayPage.jsx` 倒计时+二维码 mock | ✅ |
| 订单列表 | `/orderList` | `OrderListPage.jsx` 状态筛选+分页 | ✅ |
| 订单详情（状态/商品/地址/物流） | `/orderDetail/:id` | `OrderDetailPage.jsx` | ✅ |
| 我的页面 | `/profile` | `ProfilePage.jsx` | ✅ |
| 收藏（可选 H5-19） | `/favorites` | `FavoritesPage.jsx` + `favoriteService` | ✅ |
| 地址管理（加分 H5-20） | `/address` | `AddressPage.jsx` + `addressService` | ✅ |
| 移动端底部导航 | 全局 | `H5Shell` + `BottomBar` | ✅ |
| 前后台商品数据联动 | 数据层 | 共用 `goodService` / `pixelMall:products` | ✅ |
| 数据刷新不丢失 | 数据层 | `localStorage` 持久化 | ✅ |

**轻量化编号**：H5-01～20、COMMON-01～08（H5 相关部分）均已覆盖。

---

## 三、变更记录

### 2026-06-04（第一次）— 阶段 0～6 主链路

- 搭建 `H5Shell`、`BottomBar`、路由表、五大 service 联通
- 完成首页/分类/详情/登录/我的/购物车/下单/支付/订单页基础能力

### 2026-06-04（第二次）— 阶段 7 补齐 + 全量自检

**新增/增强：**

| 能力 | 新增文件/改动 |
|------|----------------|
| 收藏 | `favoriteService.js`、`FavoritesPage.jsx`、详情页收藏按钮 |
| 地址管理 | `addressService.js`、`AddressPage.jsx`、`AddressPicker.jsx`、下单页选地址 |
| 首页轮播 | `Carousel.jsx` |
| 列表分页 | `usePagination.js`、`Pagination.jsx`（首页/分类/收藏/订单） |
| 支付增强 | `PayPage`：15 分钟倒计时、支付方式选择、像素风二维码 mock |
| 表单校验 | `validation.js`（登录/注册/地址/下单） |
| 路由懒加载 | `h5LazyPages.js` + `H5Shell` Suspense |
| 订单列表筛选 | `OrderListPage` 状态 Tab |

**构建与检查：**

```bash
npx eslint .          # 通过
npx vite build        # 通过（含 code-split 懒加载 chunk）
```

---

## 四、阶段明细

### 阶段 0：数据与路由地基

| 步骤 | 文件 | 说明 |
|------|------|------|
| storage | `utils/storage.js` | 安全读写、JSON 解析 fallback |
| mock | `mock/data.js` | 商品/分类/用户/订单/地址/收藏种子数据 |
| 商品 | `goodService.js` | 列表/搜索/分类/上下架 |
| 用户 | `userService.js` | 登录/注册/退出（**不**自动登录） |
| 购物车 | `cartService.js` | 加购/勾选/库存校验/结算校验 |
| 订单 | `orderService.js` | 单品下单、购物车下单、`items[]`、支付 |
| 收藏 | `favoriteService.js` | 增删查、`pixelMall:favorites` |
| 地址 | `addressService.js` | CRUD、默认地址、`pixelMall:addresses` |
| Context | `ServiceContext.jsx` | admin/good/order/user/cart/favorite/address |
| 路由 | `h5Routes.jsx`、`h5LazyPages.js`、`router.jsx` | H5 子路由 + Admin 分离 |

**localStorage Key 一览：**

```text
pixelMall:products
pixelMall:categories
pixelMall:users
pixelMall:currentUser
pixelMall:carts
pixelMall:orders
pixelMall:favorites
pixelMall:addresses
```

---

### 阶段 1：H5 应用壳与基础组件

| 组件/工具 | 路径 |
|-----------|------|
| H5Shell | `components/h5/H5Shell.jsx` |
| BottomBar | `components/h5/BottomBar.jsx` |
| RequireUserAuth | `components/h5/RequireUserAuth.jsx` |
| ProductCard | `components/h5/ProductCard.jsx` |
| SearchBar | `components/h5/SearchBar.jsx` |
| Carousel | `components/h5/Carousel.jsx` |
| Pagination | `components/h5/Pagination.jsx` |
| AddressPicker | `components/h5/AddressPicker.jsx` |
| useServices | `hooks/useServices.js` |
| usePagination | `hooks/usePagination.js` |
| productDisplay | `utils/productDisplay.js` |
| validation | `utils/validation.js` |

---

### 阶段 2～6：页面路由表

| 路由 | 页面 | 登录保护 | 核心能力 |
|------|------|----------|----------|
| `/`、`/home` | Home | 否 | 搜索、轮播、分类入口、热门商品分页、加购 |
| `/category` | Category | 否 | 分类侧栏、关键词、商品分页 |
| `/detail/:goodId` | Detail | 否 | 详情、加购、立即购买、收藏 |
| `/login` | Login | 否 | 登录/注册、字段校验、`redirect` |
| `/profile` | Profile | 是 | 用户信息、各入口、退出 |
| `/cart` | Cart | 是 | 勾选、数量、删除、结算校验 |
| `/checkout` | Checkout | 是 | 购物车结算、地址选择/填写 |
| `/createOrder/:goodId` | CreateOrder | 是 | 立即购买、数量、地址 |
| `/pay/:orderId` | Pay | 是 | 倒计时、支付 mock、成功/失败 |
| `/orderList` | OrderList | 是 | 状态筛选、分页 |
| `/orderDetail/:orderId` | OrderDetail | 是 | 状态、商品清单、地址、物流时间线 |
| `/favorites` | Favorites | 是 | 收藏列表、取消收藏、分页 |
| `/address` | Address | 是 | 地址 CRUD、默认地址 |

**登录保护**（`RequireUserAuth`）：除首页、分类、详情、登录外，交易与个人中心相关路由均需登录。

---

### 阶段 7：体验打磨（已完成）

| 项 | 实现说明 | 状态 |
|----|----------|------|
| 收藏页 H5-19 | `/favorites`，详情/我的页入口 | ✅ |
| 地址管理 H5-20 | `/address`，下单 `AddressPicker` 联动 | ✅ |
| 支付倒计时/二维码 PLUS-04 | 15:00 倒计时 + `pm-pay-qrcode-mock` | ✅ |
| 商品/订单分页 PLUS-03 | 首页/分类/收藏/订单列表 | ✅ |
| 表单验证 PLUS-02 | `validation.js` 用于登录/地址/下单 | ✅ |
| 数据持久化 PLUS-01 | 全 service 写 storage | ✅ |
| 响应式 PLUS-05 | 沿用 `06-states/responsive.css` | ✅ |
| 路由懒加载 PLUS-06 | `React.lazy` + `Suspense` | ✅ |

**未做（低优先级）：** 单元测试（PLUS-07）、部署链接（PLUS-08）、独立搜索页（已在首页 query 实现）。

---

## 五、样式与规范符合性

- **唯一 CSS 入口**：`src/styles/index.css`
- **类名**：`pm-*` 组件类、`is-*` / `has-*` 状态类，无内联 style
- **页面 class**：各页 `pm-page` + `pm-*-page`（如 `pm-cart-page`）
- **新增样式占位**：轮播 `home.css`、支付二维码 `pay.css`、收藏项 `favorites.css`、地址选中 `address-card.css`

---

## 六、演示与验收

### 演示账号

| 端 | 账号 | 密码 |
|----|------|------|
| H5 前台 | shopper | shopper123 |
| 后台 | admin | admin123 |

### 推荐演示路径

1. 未登录打开 `/cart` → 跳转登录  
2. 登录后首页搜索、轮播切换、分类浏览  
3. 详情页收藏 → `/favorites` 查看  
4. 加购 → `/cart` 勾选 → `/checkout` 选地址 → 提交  
5. `/pay/:id` 倒计时内支付成功 → 订单详情看物流  
6. `/address` 新增地址并设默认 → 再次下单验证  
7. 后台 `/admin/products` 下架商品 → 刷新 H5 列表验证联动  

### 命令

```bash
npm install
npm run lint      # 或 npx eslint .
npm run build
npm run check     # metadata + Report + build（需先填 metadata/Report）
```

---

## 七、文件清单（H5 相关新增/主要改动）

```text
src/
  components/h5/
    H5Shell.jsx, BottomBar.jsx, RequireUserAuth.jsx
    ProductCard.jsx, SearchBar.jsx, Carousel.jsx
    Pagination.jsx, AddressPicker.jsx
  hooks/
    useServices.js, usePagination.js
  pages/
    CategoryPage.jsx, CartPage.jsx, ProfilePage.jsx
    CheckoutPage.jsx, FavoritesPage.jsx, AddressPage.jsx
    (+ 重写 Detail/Login/Pay/Order*/CreateOrder)
  views/h5/
    Home.jsx
  router/
    h5Routes.jsx, h5LazyPages.js, h5.ts
  services/
    favoriteService.js, addressService.js
    (+ 增强 cart/order/user)
  utils/
    productDisplay.js, validation.js
  mock/data.js (+ addresses)
```

---

## 八、工作总结素材（可摘抄 Report.md）

### 8.1 前台实现概述

Pixel Mall H5 采用 **React 19 + React Router 7 + Context/Service + localStorage**。前台在 `H5Shell` 移动端壳内运行，底部五栏导航串联首页、分类、购物车、订单、我的。商品数据与后台共用 `goodService`，后台修改商品后前台刷新即可同步。

### 8.2 路由设计（H5 部分）

```text
/ 、/home          → 首页（搜索/轮播/热门）
/category         → 分类
/detail/:goodId   → 详情
/login            → 登录注册
/cart             → 购物车（需登录）
/checkout         → 购物车结算
/createOrder/:id  → 立即购买
/pay/:orderId     → 支付
/orderList        → 订单列表
/orderDetail/:id  → 订单详情
/profile          → 我的
/favorites        → 收藏
/address          → 地址管理
```

### 8.3 状态与持久化

- **全局能力**：`ServiceProvider` 注入各 service  
- **登录态**：`pixelMall:currentUser`  
- **业务数据**：商品/购物车/订单/收藏/地址分 key 存储  
- **刷新**：数据不丢失（购物车、登录、订单、收藏、地址）

### 8.4 加分项（H5 相关）

| 加分项 | 完成情况 |
|--------|----------|
| 数据持久化 | ✅ localStorage |
| 表单验证 | ✅ 登录/注册/地址/下单 |
| 分页 | ✅ 首页/分类/收藏/订单 |
| 支付模拟优化 | ✅ 倒计时 + 二维码 mock + 支付方式 |
| 响应式 | ✅ 现有 responsive.css |
| 性能优化 | ✅ 路由懒加载 code splitting |

### 8.5 遇到的问题

| 问题 | 解决 |
|------|------|
| 启动即自动登录 | 移除 `userService` 构造时默认写入 currentUser |
| 订单仅单品结构 | `order.items[]` 兼容购物车多品 |
| ESLint 路由文件混导出 | 懒加载拆至 `h5LazyPages.js` |
| useEffect 内 setState 告警 | 分页改 clamp 计算；地址用 useState 初始化函数 |

---

## 九、后续可选（非阻塞提交）

- [ ] 将本文档状态同步到 `轻量化开发文档.md` 表格  
- [ ] 填写 `Report.md` 组员分工与截图  
- [ ] 补充更多 `src/assets` 商品像素图素材  

---

**结论**：H5 前台按 README 必做项与轻量化 H5-01～20 已全部落地；阶段 7 加分能力已实现。本地 `eslint` + `vite build` 验证通过，可进行联调演示与报告撰写。
