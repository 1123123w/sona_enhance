# Sona 自用 Fork

这是 [WJZ-P/sona](https://github.com/WJZ-P/sona) 的个人自用 fork，用于在保留原版功能的基础上维护少量刚需改动。

原项目是基于 [Pengu Loader](https://pengu.lol/) 的英雄联盟客户端增强插件。原作者、许可证、主要功能和安装方式请以 upstream 仓库为准。

## 本 Fork 的定位

- 尽量跟随原版 `main` 更新。
- 自用功能以小补丁形式维护，方便在官方更新后重新应用。
- 不代表原作者立场，也不保证这些改动会被 upstream 接受。

## 额外改动

### Counter 英雄推荐

排位选人阶段，根据对方已选英雄给出 counter 英雄建议。

- 仅在单双排、灵活排位选人阶段生效。
- 点击敌方头像打开推荐列表，不向选人聊天窗口发送消息。
- 数据源为 OP.GG `global ranked` 对位数据。
- 国服客户端只用于读取当前选人状态，因为 OP.GG 不支持腾讯服务器数据。

## 使用方式

1. 安装并启用 Pengu Loader。
2. 构建本项目，生成插件文件。
3. 将构建产物放入 Pengu Loader 的插件目录。
4. 启动英雄联盟客户端，在 Sona 面板的「工具」页开启需要的功能。

本项目构建后会输出到本机 Pengu 插件目录：

```text
C:\Users\pierr\Documents\Codex\plugins\sona
```

## 构建

```powershell
npm ci
npm run build
```

构建产物应包含：

```text
index.js
index.css
```

## 同步 upstream 的策略

这个 fork 的长期维护方式是：

1. 以原版最新 `main` 作为底座。
2. 将自用功能作为独立补丁重新应用。
3. 构建验证通过后再推送到本 fork。

这样可以减少长期分叉带来的合并噪音。如果官方未来实现了等价功能，可以直接停止维护对应补丁。

## Upstream

- 原项目：[WJZ-P/sona](https://github.com/WJZ-P/sona)
- 许可证：[AGPL-3.0](LICENSE)

