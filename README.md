# Blip Task Pet

面向 IN4MATX 151 playtest 的任务养成原型：输入或口述任务，完成任务获得 XP，让 Blip 升级并解锁徽章。使用原生 HTML、CSS 和 JavaScript ES Modules，无第三方运行时依赖，无构建步骤。

## 本地运行

需要 Python 3；开发检查还需要 Node.js 20+ 和 npm。无需执行 `npm install`。

```sh
npm start
```

也可以直接运行 `python3 -m http.server 8000`，然后访问 **http://localhost:8000**。按 `Ctrl+C` 停止。

**请通过 HTTP 服务访问，不再双击 HTML 文件。** ES Modules 在 `file://` 下会受浏览器模块加载限制。更换端口可使用 `python3 -m http.server 8001`。

## 目录

```text
index.html                   页面结构与资源入口
js/
  app.js                     应用入口：组装模块、绑定页面动作、处理业务事件
  config/game.js             等级、XP、徽章、示例句和存储键
  domain/
    parser.js                英文任务拆分、时间和优先级解析
    progression.js           完成任务、批量添加、升级和跨天规则
  state/
    initial-state.js         初始演示数据
    store.js                 唯一状态所有者、动作接口和订阅通知
  services/
    storage.js               localStorage 读写与数据校验
    speech.js                浏览器语音识别适配和取消
  ui/
    dom.js                   DOM 查询与 HTML 转义
    render.js                主界面渲染
    sprites.js               像素 SVG 生成
    feedback.js              提示与升级动画
    navigation.js            页签切换
    intro.js                 新手引导
    talk.js                  输入面板、任务草稿和示例动画
css/
  style.css                  样式导入入口，控制加载顺序
  base.css                   主题变量与全局样式
  layout.css                 页面布局和页脚
  components/                手机界面、宠物面板、弹层
  accessibility.css          减少动画偏好
  utilities.css              小型辅助样式
  legacy-dossier.css         原型遗留的概念展示样式，当前页面未使用
scripts/check.mjs            语法、导入路径与 DOM 引用检查
tests/                       业务、存储和语音适配器测试
docs/                        架构、数据及开发说明
```

## 检查

```sh
npm test
npm run check
```

手工回归步骤见 [开发指南](docs/DEVELOPMENT.md)。自动测试不调用真实麦克风，也不代替浏览器视觉检查。

## 文档

- [架构与模块职责](docs/ARCHITECTURE.md)
- [数据模型与业务规则](docs/DATA_MODEL.md)
- [开发、测试和部署指南](docs/DEVELOPMENT.md)

## 当前边界

- 进度只保存在当前浏览器的 localStorage，没有服务器或账户同步。存储被禁用时可继续使用当前会话，刷新后无法恢复。
- 语音适配器使用浏览器提供的识别能力，默认 `en-US`；不可用时播放示例文字，始终支持手动输入。
- 任务解析是英文规则解析器，不是 AI 服务；拆分错误可添加逗号后重新解析。
- Google Fonts 是外部字体资源；无法访问时使用系统字体。
- 日期、连续天数与周记录沿用演示规则，通过 “Skip to tomorrow” 推进，不按真实午夜自动更新。
