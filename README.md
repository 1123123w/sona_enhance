# Sona-E 自用增强版 / Personal Enhanced Edition

这是基于 [WJZ-P/sona](https://github.com/WJZ-P/sona) 维护的个人自用 fork，当前公开仓库为 [1123123w/sona_enhance](https://github.com/1123123w/sona_enhance)。

This is a personal fork based on [WJZ-P/sona](https://github.com/WJZ-P/sona). The public fork is [1123123w/sona_enhance](https://github.com/1123123w/sona_enhance).

目标不是替代原项目，而是在持续吸收原版实用功能的基础上，保留更适合国服环境和个人使用习惯的改动。后续同步原版时优先吸收功能思路，不直接照搬原版文案、设置位置、默认值或 README。

The goal is not to replace the upstream project. This fork keeps practical upstream ideas while tailoring copy, settings placement, defaults, and documentation for personal use on Tencent servers.

## 当前重点 / Highlights

- **OP.GG KR 数据源**：配装、符文、英雄 T 级、Counter 和 Ban 推荐统一使用 OP.GG 韩国 ranked 数据。
- **选人 Counter 推荐**：排位选人时点击敌方头像，显示针对该英雄和分路的 counter 英雄列表，不向聊天窗口发送推荐。
- **Ban 推荐**：选人阶段提供 KR ranked 各分路 Ban 率前 10，支持按段位切换。
- **本地 OP.GG 缓存**：OP.GG 全英雄 ranked 数据和单英雄配装数据会缓存 4 天，设置页高级选项可手动清空。
- **锁定后自动符文**：可选开启锁定英雄后自动应用 OP.GG KR 第一套符文；若已有智能保存符文，则优先恢复个人配置。
- **多语言界面**：面板支持简体中文、繁体中文和英文，默认简体中文。
- **原版功能同步**：保留原版的自动接受、战绩查询、英雄选择阶段增强、智能配装、组队界面增强、好友状态增强、设置备份等实用能力。

- **OP.GG KR data source**: Builds, runes, champion tiers, Counter, and Ban recommendations use OP.GG Korea ranked data.
- **Champ select Counter recommendations**: Click enemy champion icons in ranked champ select to view counter picks by champion and lane without sending chat messages.
- **Ban recommendations**: View top 10 KR ranked ban-rate champions by position, with tier filtering.
- **Local OP.GG cache**: All-champion ranked data and single-champion build data are cached for 4 days. The cache can be cleared in advanced settings.
- **Auto runes after lock-in**: Optionally apply the first OP.GG KR rune page after locking a champion. Saved smart runes take priority.
- **Multilingual UI**: The panel supports Simplified Chinese, Traditional Chinese, and English. Simplified Chinese is the default.
- **Upstream feature sync**: Keeps useful upstream features such as auto accept, match history, champ select enhancement, smart builds, lobby enhancement, enhanced friend status, and settings backup.

## 使用说明 / Usage

1. 安装并启用 Pengu Loader。
2. 构建本项目后，将生成的插件目录放入 Pengu 插件目录。
3. 在 Sona-E 面板中按需开启功能。

1. Install and enable Pengu Loader.
2. Build this project and place the generated plugin directory into your Pengu plugins directory.
3. Enable the features you need in the Sona-E panel.

常用开关建议 / Recommended toggles:

- `配装推荐面板 / Build Recommendation Panel`：开启后可使用 OP.GG 推荐面板、Ban 推荐入口和相关数据能力。
- `Counter 英雄推荐 / Counter Recommendations`：开启后可在排位选人阶段点击敌方头像查看 counter 列表。
- `锁定后自动应用符文 / Auto Apply Runes After Lock-In`：默认关闭，需要明确希望自动覆盖符文时再开启。
- `组队界面增强 / Lobby Enhancement`：默认关闭，需要在组队页自动查询成员近期表现时再开启。

## 同步策略 / Sync Strategy

本 fork 按自用分支维护，不再默认向原作者提交 PR。

This fork is maintained as a personal branch and no longer opens PRs by default.

同步原版主线时遵循：

- 吸收原版新增功能的核心能力。
- 不盲目沿用原版设置页位置、文案、默认开启状态和 README。
- 对会主动请求数据、自动改动客户端状态、影响聊天窗口的功能，默认保持谨慎。
- 同步后运行构建检查，再按需要推送到个人 fork。

When syncing upstream:

- Absorb the core capability of useful upstream features.
- Do not blindly copy upstream settings placement, copy, default states, or README content.
- Keep conservative defaults for features that request data, mutate client state, or affect chat.
- Run a build check after syncing, then push to the personal fork only when needed.

## 数据与限制 / Data And Limits

- OP.GG 不支持腾讯服务器数据，因此推荐数据使用 KR ranked；国服客户端只用于读取当前选人状态和应用本地配置。
- OP.GG 缓存有效期为 4 天；清空缓存后下次使用会重新请求。
- Counter / Ban 推荐只做展示，不自动选择或禁用英雄。
- 自动符文默认关闭，避免在不知情的情况下覆盖当前符文页。

- OP.GG does not support Tencent server data, so recommendations use KR ranked data. The Tencent client is only used to read local champ select state and apply local configuration.
- OP.GG cache entries live for 4 days. Clearing the cache forces the next use to request fresh data.
- Counter and Ban recommendations are display-only; they do not pick or ban champions automatically.
- Auto runes are disabled by default to avoid overwriting rune pages unexpectedly.

## 上游项目 / Upstream

- 原项目 / Upstream project: [WJZ-P/sona](https://github.com/WJZ-P/sona)
- 原作者 / Author: thanks to [WJZ-P](https://github.com/WJZ-P) for creating and maintaining Sona.
- 本 fork 保留原项目的基础能力和许可证要求。原作者新增功能会定期评估并按自用需求吸收。
- This fork keeps the upstream foundation and license requirements. New upstream features are reviewed periodically and adapted for personal use when useful.

## License

沿用原项目许可证。

Follows the upstream project license.
