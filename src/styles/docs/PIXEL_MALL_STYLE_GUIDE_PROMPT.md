# Pixel Mall CSS 使用指南与代码生成 Prompt

这份文档给所有组员和大模型使用。写 React / HTML / JS 时必须遵守它，目的是保证公共 CSS 可复用、不冗余、可扩展、不因为缺文件报错，并且所有页面保持像素风商城的统一视觉。

## 一、项目视觉目标

Pixel Mall 是一个粉白、可爱、简约的像素风主题商城。页面要像一个完整商城系统，而不是普通商城套一层滤镜。

必须统一：

- 商品图使用像素风素材或像素化图片
- 商品卡、按钮、输入框、弹窗、标签保持像素硬边
- 前台页面使用活泼粉白色系
- 后台页面使用同一套像素边框，但视觉更克制
- 不要写随机颜色、随机阴影、随机圆角

### css目录结构
src/styles/
  index.css

  01-tokens/
    colors.css
    spacing.css
    typography.css

  02-base/
    reset.css
    base.css

  03-components/
    actions/
      button.css
    forms/
      form.css
      quantity.css
    data-display/
      tag.css
      table.css
    commerce/
      product-card.css
      order-card.css
      address-card.css
      cart-item.css
    navigation/
      navbar.css
      bottom-bar.css
    feedback/
      modal.css
      empty-state.css
    theme/
      theme-panel.css

  04-layouts/
    app-shell.css
    mobile-page.css
    admin-shell.css
    grid.css

  05-pages/
    shop/
      home.css
      category.css
      detail.css
      cart.css
      create-order.css
      pay.css
      orders.css
      profile.css
      login.css
      favorites.css
      address.css
    admin/
      admin-login.css
      admin-dashboard.css
      admin-roles.css
      admin-products.css

  06-states/
    states.css
    responsive.css

  07-themes/
    themes.css

  docs/
    PIXEL_MALL_STYLE_GUIDE_PROMPT.md


## 二、CSS 引入方式

React 入口只引入一个文件：

```js
import "./styles/index.css";
```

HTML 展示页只引入一个文件：

```html
<link rel="stylesheet" href="./src/styles/index.css">
```

不要在页面里分别引入很多 CSS 文件。所有分层 CSS 都由 `src/styles/index.css` 统一导入。

## 三、CSS 分层结构

```text
src/styles/
  index.css

  01-tokens/
    colors.css
    spacing.css
    typography.css

  02-base/
    reset.css
    base.css

  03-components/
    actions/
      button.css
    forms/
      form.css
      quantity.css
    data-display/
      tag.css
      table.css
    commerce/
      product-card.css
      order-card.css
      address-card.css
      cart-item.css
    navigation/
      navbar.css
      bottom-bar.css
    feedback/
      modal.css
      empty-state.css
    theme/
      theme-panel.css

  04-layouts/
    app-shell.css
    mobile-page.css
    admin-shell.css
    grid.css

  05-pages/
    shop/
      home.css
      category.css
      detail.css
      cart.css
      create-order.css
      pay.css
      orders.css
      profile.css
      login.css
      favorites.css
      address.css
    admin/
      admin-login.css
      admin-dashboard.css
      admin-roles.css
      admin-products.css

  06-states/
    states.css
    responsive.css

  07-themes/
    themes.css
```

导入顺序不能乱：

```text
tokens -> themes -> base -> components -> layouts -> pages -> states/responsive
```

原因：

- 变量必须最先存在
- 主题需要覆盖颜色变量
- 公共组件要早于页面样式
- 页面样式可以覆盖局部布局
- 状态和响应式必须最后覆盖

## 四、命名规则

所有公共样式类使用 `pm-` 前缀。

```text
pm-组件名
pm-组件名-区域
pm-组件名-变体
```

示例：

```text
pm-btn
pm-btn-primary
pm-product-card
pm-product-media
pm-product-title
pm-cart-item
pm-cart-summary
```

所有 JS 状态类使用 `is-` 或 `has-` 前缀。

```text
is-active
is-selected
is-disabled
is-loading
is-empty
has-error
has-success
```

JS 只负责切换状态 class，不直接写内联 style。

正确：

```jsx
<button className={`pm-btn pm-btn-primary ${loading ? "is-loading" : ""}`}>
  提交订单
</button>
```

错误：

```jsx
<button style={{ background: "red", borderRadius: 12 }}>
  提交订单
</button>
```

## 五、组件样式和页面样式的边界

公共组件文件只写“这个组件本身长什么样”。

例如：

```text
03-components/actions/button.css
03-components/commerce/product-card.css
03-components/forms/form.css
```

页面文件只写“这个组件在当前页面怎么摆放”。

例如：

```text
05-pages/shop/cart.css
05-pages/shop/detail.css
05-pages/admin/admin-products.css
```

判断标准：

```text
一个页面用：放 05-pages
两个以上页面用：放 03-components
```

例如：

- `pm-cart-summary` 只在购物车页使用，放 `05-pages/shop/cart.css`
- `pm-order-card` 订单列表、订单详情、支付页都能用，放 `03-components/commerce/order-card.css`
- `pm-address-card` 地址页和创建订单页都能用，放 `03-components/commerce/address-card.css`

## 六、新增 CSS 是否需要占位

HTML 使用还没写样式的 class 不会报错，但为了协作，必须占位。

规则：

```text
如果页面里新增了 pm- class，就在对应 CSS 文件里加空选择器占位。
如果 index.css 导入了某个 CSS 文件，这个文件必须真实存在。
```

例如页面写了：

```jsx
<main className="pm-page pm-cart-page">
  <section className="pm-cart-list">
    <article className="pm-cart-item">
      ...
    </article>
  </section>
</main>
```

那么 `05-pages/shop/cart.css` 里必须有：

```css
.pm-cart-page {
}

.pm-cart-list {
}
```

`pm-cart-item` 已经在 `03-components/commerce/cart-item.css` 里存在，不要在页面文件重复写。

## 七、不要重复造公共组件

必须优先复用这些公共类：

按钮：

```text
pm-btn
pm-btn-primary
pm-btn-accent
pm-btn-mint
pm-btn-dark
pm-btn-ghost
pm-btn-danger
pm-icon-btn
pm-btn-block
```

标签：

```text
pm-tag
pm-tag-hot
pm-tag-new
pm-tag-info
pm-tag-sale
pm-tag-danger
pm-tag-muted
```

表单：

```text
pm-control
pm-label
pm-input
pm-select
pm-textarea
pm-help
pm-search
pm-check
```

商品：

```text
pm-product-card
pm-product-media
pm-product-title
pm-product-desc
pm-product-foot
pm-price
pm-old-price
```

弹窗：

```text
pm-modal-mask
pm-modal
pm-modal-head
pm-modal-title
pm-modal-close
pm-modal-actions
pm-alert
```

订单：

```text
pm-order-card
pm-order-head
pm-order-product
pm-order-foot
pm-order-title
pm-order-desc
```

地址：

```text
pm-address-card
pm-address-head
pm-address-actions
pm-address-name
pm-address-phone
pm-address-text
```

购物车：

```text
pm-cart-item
pm-cart-media
pm-cart-info
pm-cart-title
pm-cart-spec
pm-cart-actions
pm-quantity
```

## 八、主题色功能

CSS 已经支持预置主题和 DIY 主题。

预置主题：

```text
sakura 默认粉色
mint 薄荷绿色
sky 天空蓝色
candy 糖果紫色
diy 自定义
```

React 中可以这样设置主题：

```jsx
<div id="app" data-theme="sakura">
  ...
</div>
```

切换预置主题时，只改 `data-theme`：

```jsx
document.documentElement.dataset.theme = "mint";
```

DIY 主题使用 CSS 变量：

```jsx
document.documentElement.dataset.theme = "diy";
document.documentElement.style.setProperty("--pm-diy-primary", "#ff77aa");
document.documentElement.style.setProperty("--pm-diy-primary-soft", "#ffe0ef");
document.documentElement.style.setProperty("--pm-diy-primary-deep", "#cc4f82");
document.documentElement.style.setProperty("--pm-diy-bg", "#fffaf2");
document.documentElement.style.setProperty("--pm-diy-accent", "#ffe066");
document.documentElement.style.setProperty("--pm-diy-accent-2", "#80e7c8");
document.documentElement.style.setProperty("--pm-diy-accent-3", "#8fd7ff");
document.documentElement.style.setProperty("--pm-diy-text", "#3b2f3a");
document.documentElement.style.setProperty("--pm-diy-line", "#3b2f3a");
```

如果用户选择颜色后要持久化，可以把这些值存进 `localStorage`，页面加载时恢复到 `document.documentElement.style`。

注意：

- 不要直接改组件 CSS 的颜色
- 只改主题变量
- 组件必须使用 `--pm-color-*` 语义变量

正确：

```css
.pm-custom-block {
  background: var(--pm-color-primary);
  color: var(--pm-white);
}
```

错误：

```css
.pm-custom-block {
  background: #ff6fa8;
}
```

## 九、页面开发者写代码的标准模板

每个页面最外层必须有 `pm-page` 和页面 class：

```jsx
export default function CartPage() {
  return (
    <main className="pm-page pm-cart-page">
      ...
    </main>
  );
}
```

首页：

```text
pm-home-page
```

分类页：

```text
pm-category-page
```

详情页：

```text
pm-detail-page
```

购物车：

```text
pm-cart-page
```

创建订单：

```text
pm-create-order-page
```

支付页：

```text
pm-pay-page
```

订单列表：

```text
pm-orders-page
```

订单详情：

```text
pm-order-detail-page
```

我的：

```text
pm-profile-page
```

登录：

```text
pm-login-page
```

后台商品管理：

```text
pm-admin-products-page
```

后台首页：

```text
pm-admin-dashboard-page
```

后台角色权限：

```text
pm-admin-roles-page
```

## 十、给大模型生成代码时使用的 Prompt

把下面这段直接发给大模型：

```text
你正在为 Pixel Mall 像素主题商城生成 React 页面代码。必须遵守以下 CSS 协作规范：

1. 项目已经有全局 CSS：src/styles/index.css，入口文件统一 import "./styles/index.css"。
2. 不要写内联 style，不要生成随机颜色、随机圆角、随机阴影。
3. 所有样式类必须优先复用 pm- 公共类。
4. 按钮使用 pm-btn、pm-btn-primary、pm-btn-ghost、pm-icon-btn 等。
5. 商品卡使用 pm-product-card、pm-product-media、pm-product-title、pm-product-desc、pm-product-foot、pm-price。
6. 表单使用 pm-control、pm-label、pm-input、pm-select、pm-textarea、pm-help。
7. 标签使用 pm-tag、pm-tag-hot、pm-tag-new、pm-tag-info、pm-tag-sale。
8. 弹窗使用 pm-modal-mask、pm-modal、pm-modal-head、pm-modal-title、pm-modal-actions。
9. 页面最外层必须同时使用 pm-page 和页面 class，例如 pm-cart-page。
10. JS 状态只切换 is-active、is-selected、is-disabled、is-loading、is-empty、has-error、has-success，不直接写 style。
11. 如果需要新增 class，必须使用 pm- 前缀，并说明应该放到 components 还是 pages。
12. 如果新增 class 只在一个页面用，放 05-pages/shop 或 05-pages/admin 的对应页面 CSS；如果两个以上页面复用，放 03-components 的准确子包，例如 commerce、forms、feedback。
13. 如果 index.css 导入了 CSS 文件，这个文件必须存在；新增 CSS 文件先放空选择器占位也可以。
14. 主题色必须使用 CSS 变量 --pm-color-*，不要硬编码颜色。
15. 支持主题：data-theme="sakura"、"mint"、"sky"、"candy"、"diy"。
16. 如果生成主题切换逻辑，只修改 document.documentElement.dataset.theme 和 --pm-diy-* 变量。
17. 生成页面时不要重复定义公共组件 CSS，只写页面结构和必要的页面 class。
18. 页面内容必须符合商城 PRD：前台首页、分类、详情、购物车、创建订单、支付、订单、我的、登录；后台登录、角色权限、商品管理。

按钮类组件 -> 03-components/actions
表单类组件 -> 03-components/forms
商城业务组件 -> 03-components/commerce
导航组件 -> 03-components/navigation
弹窗/空状态/提示 -> 03-components/feedback
标签/表格等展示组件 -> 03-components/data-display
主题相关组件 -> 03-components/theme
前台页面样式 -> 05-pages/shop
后台页面样式 -> 05-pages/admin

请按以上规则生成代码。
```

## 十一、提交前检查清单

页面开发者提交前检查：

```text
1. 页面最外层是否有 pm-page 和页面 class
2. 是否复用了公共按钮、标签、输入框、商品卡
3. 是否没有内联 style
4. 是否没有硬编码主题色
5. 新增 class 是否已经占位
6. 新增 CSS 文件是否已在 index.css 导入
7. JS 是否只切换 is- / has- 状态 class
8. 页面在移动端是否不会明显溢出
```

CSS 负责人检查：

```text
1. 新组件是否真的需要进入 components
2. 页面 CSS 是否只管页面布局
3. 公共组件是否被重复定义
4. 主题变量是否覆盖完整
5. 响应式是否放在 06-states/responsive.css
6. 后台页面是否保持简洁像素风
```
