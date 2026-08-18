# dsh-web-css-themes

方便地自定义和管理 dsh Web UI 的自定义 CSS 主题。

dsh 的前端样式由 `--dsw-alias-*` 设计令牌驱动。自定义 CSS 主题本质上就是覆盖这些令牌
（以及少量组件规则）。官方做法是直接修改
`@deepseek-ai/dsh-web-frontend` 的 `dist/index.html`，手动加入：

```html
<link rel="stylesheet" href="/assets/my-theme.css">
```

本插件把这件事产品化：

- 在 `$DSH_HOME/web-themes`（默认 `~/.dsh/web-themes`）下以 `.css` 文件保存主题；
- 激活的主题记录在 `$DSH_HOME/web-themes/active.json`；
- 通过 webserver 的 index tap 自动向前端 `index.html` 注入
  `<link rel="stylesheet" href="/dsh-themes/active.css" id="dsh-theme-stylesheet">`
  （等价于手动改 `index.html`，但升级/重装后仍然生效）；
- 在 Web UI 的「设置 → CSS 主题」页面中提供主题列表、启用/停用、CSS 编辑、保存和删除。

## 安装

```bash
dsh plugin --profile web add dsh-web-css-themes
```

本地开发/打包安装：

```bash
dsh plugin --profile web add "file:/path/to/dsh-web-css-themes"
```

## 使用

1. 启动 `dsh web`；
2. 打开「设置 → CSS 主题」；
3. 选择一个主题并点击「启用」，页面会即时切换；点击「停用自定义主题」可恢复默认外观；
4. 点击「新建主题」，填写 id（字母/数字/点/下划线/连字符，不能为 `active`）、显示名称和 CSS；
5. 也可以直接把 `.css` 文件放入 `$DSH_HOME/web-themes`，刷新列表即可看到。

## 主题 CSS 书写要点

主题文件的第一行可以写名称注释，插件会读取它作为显示名称：

```css
/* @name Midnight Cherry */
body {
  --dsw-alias-bg-base: #15121F;
  --dsw-alias-brand-primary: #F05A7E;
}
```

覆盖设计令牌时建议写在 `body` 上（暗色模式可配合 `body[data-ds-dark-theme]`）。
可参考 `@deepseek-ai/dsh-web-frontend` 自带的 `ds-balletcore.css` 查看完整令牌列表。

## API

- `GET /dsh-themes/active.css`：当前激活主题的 CSS（供 index tap 注入的 link 使用）；
- `GET /dsh-themes/<id>.css`：指定主题的 CSS；
- `GET /api2/css-themes/list`：主题列表；
- `POST /api2/css-themes/activate`：`{"id": "..."}` 启用，`{"id": null}` 停用；
- `POST /api2/css-themes/save`：`{"id": "...", "name": "...", "css": "..."}` 保存；
- `POST /api2/css-themes/delete`：`{"id": "..."}` 删除。

## 文件布局

```text
dsh-web-css-themes/
├── package.json          # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # 插入宿主插件行
├── lib/index.js          # 宿主插件：路由、CSS 服务、index tap
├── dist/client.js        # 浏览器插件：设置页
└── examples/             # 首次初始化时复制到 $DSH_HOME/web-themes 的示例主题
```
