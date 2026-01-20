# 如何找到 Shopify 网站使用的主题/模板

## 洛楽着物网站使用的主题

根据对 https://rakuraku-kimono.com/zh 的分析，该网站使用的主题是：

**主题名称**: **Kalles**  
**版本**: **4.3.1**  
**主题ID**: 166904201522  
**Schema名称**: Kalles  
**Schema版本**: 4.3.1

## 查找 Shopify 主题的多种方法

### 方法 1: 检查页面源码（最直接）

#### 步骤 1: 打开浏览器开发者工具
- **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Safari**: 按 `Cmd+Option+I` (需要先启用开发菜单)

#### 步骤 2: 打开 Console 标签
在开发者工具中找到 "Console" (控制台) 标签

#### 步骤 3: 输入以下 JavaScript 代码

```javascript
// 方法 A: 检查 Shopify 全局对象
console.log(window.Shopify?.theme);

// 或者更详细的信息
console.log({
  shop: window.Shopify?.shop,
  theme: window.Shopify?.theme,
  routes: window.Shopify?.routes
});
```

#### 步骤 4: 查看输出结果

示例输出：
```javascript
{
  name: "kalles-v4-3-1-official",
  id: 166904201522,
  schema_name: "Kalles",
  schema_version: "4.3.1",
  theme_store_id: null,
  role: "main"
}
```

### 方法 2: 检查 CSS 文件路径

#### 步骤 1: 打开开发者工具
#### 步骤 2: 切换到 "Network" (网络) 标签
#### 步骤 3: 刷新页面
#### 步骤 4: 筛选 CSS 文件
在筛选器中输入 `css`

#### 步骤 5: 查看 CSS 文件路径

Shopify 主题的 CSS 文件通常遵循以下格式：
```
https://[店铺域名]/cdn/shop/t/[主题ID]/assets/[文件名].css
```

示例：
```
https://rakuraku-kimono.com/cdn/shop/t/10/assets/theme.css
https://rakuraku-kimono.com/cdn/shop/t/10/assets/t4s-submenu.css
```

**关键信息**:
- `t/10` 中的 `10` 是主题ID（简化版本）
- 文件名中的 `t4s` 前缀通常表示 "The4" 主题系列（Kalles 属于 The4 主题系列）

### 方法 3: 检查页面源码中的 meta 标签

#### 步骤 1: 打开开发者工具
#### 步骤 2: 切换到 "Elements" (元素) 标签
#### 步骤 3: 查找 `<head>` 标签
#### 步骤 4: 查找包含主题信息的标签

某些主题会在 `<head>` 中添加主题标识：
```html
<meta name="theme-name" content="Kalles">
```

### 方法 4: 检查 JavaScript 文件

#### 步骤 1: 打开开发者工具
#### 步骤 2: 切换到 "Network" (网络) 标签
#### 步骤 3: 筛选 JS 文件
#### 步骤 4: 查找主题相关的 JavaScript 文件

示例：
```
https://rakuraku-kimono.com/cdn/shop/t/10/assets/theme.min.js
https://rakuraku-kimono.com/cdn/shop/t/10/assets/t4s-instant-page.min.js
```

文件名中的 `t4s` 前缀是 Kalles 主题的特征。

### 方法 5: 使用在线工具

#### Shopify Theme Detector

可以使用在线工具自动检测：
- **Shopify Theme Detector**: https://www.shopify.com/partners/shopify-cheat-sheet
- **WhatTheme**: https://whattheme.net/ (支持 Shopify 主题检测)

### 方法 6: 检查 HTML 类名

某些主题会在 `<body>` 或主要容器上添加主题特定的类名。

#### 步骤 1: 打开开发者工具
#### 步骤 2: 检查 `<body>` 标签的类名

示例：
```html
<body class="template-index kalles-template">
```

### 方法 7: 查看 Shopify 主题商店

如果主题来自 Shopify 主题商店，可以通过以下方式查找：

1. 访问 Shopify 主题商店: https://themes.shopify.com/
2. 搜索主题名称（如 "Kalles"）
3. 查看主题详情页，通常会显示使用该主题的商店示例

## Kalles 主题信息

### 主题详情

- **名称**: Kalles
- **开发者**: The4
- **类别**: 多用途电商主题
- **价格**: 付费主题（通常在 $59-$299 之间）
- **Shopify 主题商店**: https://themes.shopify.com/themes/kalles

### 主题特点

1. **高度可定制**: 提供丰富的自定义选项
2. **响应式设计**: 完全支持移动端
3. **性能优化**: 加载速度快
4. **多语言支持**: 支持多语言切换
5. **丰富的功能**: 
   - 产品变体选择
   - 购物车功能
   - 愿望清单
   - 产品比较
   - 快速查看
   - 等等

### 识别特征

1. **文件命名**: CSS/JS 文件名通常包含 `t4s` 前缀
2. **主题ID**: 通常在 URL 路径中显示为 `/t/10/` 或类似的数字
3. **Schema名称**: `Kalles`
4. **全局变量**: `window.Shopify.theme.schema_name === "Kalles"`

## 其他常见的 Shopify 主题

### 免费主题
- **Dawn**: Shopify 2.0 默认主题
- **Craft**: 简约风格
- **Studio**: 创意风格
- **Sense**: 现代风格

### 付费主题
- **Kalles**: 多用途主题（The4）
- **Brooklyn**: 经典主题
- **Narrative**: 故事叙述风格
- **Debut**: 简洁风格
- **Venture**: 现代风格

## 查找主题的完整脚本

将以下代码保存为浏览器书签，点击即可显示主题信息：

```javascript
javascript:(function(){
  const shopify = window.Shopify;
  if (!shopify) {
    alert('这不是一个 Shopify 网站，或者无法检测到 Shopify 信息。');
    return;
  }
  
  const theme = shopify.theme;
  const shop = shopify.shop;
  
  const info = `
Shopify 店铺信息:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
店铺: ${shop || '未知'}
主题名称: ${theme?.name || '未知'}
主题ID: ${theme?.id || '未知'}
Schema名称: ${theme?.schema_name || '未知'}
Schema版本: ${theme?.schema_version || '未知'}
主题商店ID: ${theme?.theme_store_id || '未在主题商店' || '自定义主题'}
角色: ${theme?.role || '未知'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
  
  console.log(info);
  alert(info);
})();
```

### 使用方法

1. 复制上面的代码
2. 在浏览器中创建新书签
3. 将代码粘贴到书签的 URL 字段
4. 访问任何 Shopify 网站
5. 点击该书签即可显示主题信息

## 注意事项

1. **主题可能被修改**: 网站所有者可能对主题进行了自定义修改
2. **主题ID可能变化**: 主题ID在不同环境下可能不同
3. **私有主题**: 某些自定义主题可能无法在主题商店中找到
4. **主题更新**: 主题版本可能会更新，但名称通常保持不变

## 总结

对于洛楽着物网站，最可靠的识别方法是：

1. ✅ 使用 `window.Shopify.theme` 对象（最准确）
2. ✅ 检查 CSS/JS 文件路径中的 `t4s` 前缀
3. ✅ 查看文件路径中的主题ID (`t/10`)

**结论**: 该网站使用的是 **Kalles v4.3.1** 主题，由 The4 开发。

---

## 参考资源

- [Shopify 主题商店](https://themes.shopify.com/)
- [Kalles 主题页面](https://themes.shopify.com/themes/kalles)
- [Shopify 主题开发文档](https://shopify.dev/themes)
- [The4 官方网站](https://the4.co/) (Kalles 主题开发者)


