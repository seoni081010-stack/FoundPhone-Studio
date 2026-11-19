# 金善旴 Day 1–31 接入与验证

## 确认稿

Day 1–29 及 `sunwoo-day31-lover-full.md` 来自 main 的已确认存档；恋人全文保持原样。用户粘贴补齐 Day 30、Day 31 共同开场、朋友和未说出口，分别保存为 `story-archive/sunwoo-day30-full.md`、`sunwoo-day31-common-full.md`、`sunwoo-day31-friends-full.md`、`sunwoo-day31-unspoken-full.md`。

按用户本轮明确确认，仅补回粘贴稿丢失的 `{{playerName}}`，并将未说出口标题设为《好像差一点》。其余已确认台词、旁白、选项和三个最终句不改写。编译数据逐行记录源文件与行号；单元测试逐字核对白话及所有角色/玩家台词，检查每一条确认对白都被编译使用。

`python3 scripts/compile-sunwoo.py` 生成 `stories/sunwoo.json` 与 `stories/sunwoo-endings.json`。`--check` 检查生成物是否过期。`story:validate` 检查源稿与数据一致，`story:build` 自动重编译。Day 12 已确认的赛前目光补充按存档指定位置插入；Day 8 第二组选项后的等待旁白归入共同段落，不留在 B 分支内。

## 共同规则与结局

严格使用其他路线相同的门槛：好感 100 起恋人、80–99 朋友、低于 80 未说出口，不设置金善旴专属 120/160 门槛。Day 31 两段共同开场读完后，进入 00:05 的分支时确定并保存结局；分支内部仍保留原稿 A/B 和加分。每次选择只加分一次。

信件可以稍后阅读、回复；不强制靠读完所有信件增加分数。未读及部分已读信件随玩家轮次保留，可跨日从猫头鹰信箱恢复，阅读旧信不改变当前主线日期/阅读位置。这样，主线全 B 不回复信件为 67 点，全部 B（含信件）为 93 点，全 A 为 186 点，三条结局均可正常到达。人物档案仍沿用共同的 0–100% 显示上限。

人物对白打字机，旁白整块显示；所有玩家台词都可点击，选项只呈现选中的后续，再回到公共段落。姓名在运行时替换 `{{playerName}}`。相册在 Day 6、12、24 使用三条已确认线索；最终记忆使用对应结局已确认的标题和最终句，不另编新文案，在结束场景后确认解锁，再进入共同结局页。Escape 不确认解锁。

三条独立预览分别从对应的 Day 31 完整剧本开头开始，预选结局；每个链接使用独立试玩身份，主线正常存档保持独立：

- `?preview=sunwoo-ending-together`
- `?preview=sunwoo-ending-friends`
- `?preview=sunwoo-ending-unspoken`

Date 使用用户给定八条回复，>45 接受、≤45 拒绝，从对应四条中随机抽取，不增加主线分数。魁地奇纸条、结果及兑奖继续复用现有组件，不在纸条里放角色对话；斯莱特林固定获胜，不因玩家支持的队伍改变。

## 验证命令

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run story:validate`
- `npm run story:test`
- `STORY_FILE=stories/hyunjae/story.json npm run story:validate`
- `STORY_FILE=stories/hyunjae/story.json npm run story:test`
- `STORY_FILE=stories/hyunjae/story.json npm run build`

通用 story 校验还保留中性模板；实际发布构建使用既有 Hogwarts 主线模板。Sunwoo 编译一致性、原稿完整性和结局可达性由新增单元测试及下列真实浏览器通关检查覆盖。

生产预览端口 4180，Chromium，390×844，脚本支持 `BASE_URL` 与 `CHROMIUM_PATH`：

- `CAMPAIGN=low node scripts/verify-sunwoo-runtime.mjs`：31 天主线全 B、信件保留未读、格兰芬多竞猜、未说出口。
- `CAMPAIGN=middle node scripts/verify-sunwoo-runtime.mjs`：31 天全部 B、全部信件及固定回复、斯莱特林竞猜、朋友。
- `CAMPAIGN=high node scripts/verify-sunwoo-runtime.mjs`：31 天全部 A、全部信件及固定回复、恋人。
- `PREVIEWS_ONLY=1 node scripts/verify-sunwoo-runtime.mjs`：三个独立 Day 31 链接均走 B 分支（包括恋人「你怎么现在才问啊？」），核对各自最终句、结局类型、相册解锁与正式身份隔离。
- `node scripts/verify-sunwoo-map.mjs`：Day 1–31 共 76 个场景时间/地点及七人标记。
- `node scripts/verify-sunwoo-ending-gates.mjs`：在 00:05 进入分支时检查共同开场加分后的 79/80、99/100 边界。
- `node scripts/verify-sunwoo-backlog.mjs`：跨日旧信恢复、固定回复、只加分一次、刷新保存、当前主线不回退。
- `node scripts/verify-seven-route-isolation.mjs`：七个角色入口、四个固定 Dock、七人信箱与画像、存档隔离。
- `BASE_URL=http://127.0.0.1:4180/ INVITATION_LEAD=sunwoo node scripts/verify-date-invitations.mjs`：Date 45/46 边界、六地点、八句回信与两次刷新。

浏览器检查使用桌面 Chromium 的移动视口；不等同于真机 Safari 测试。

## main 与部署

代码同时包含本次完整剧情和之前已部署的其他路线、地图、打字机、礼物、Date 修正。合并 main 归档时保留当前已上线的裴俊英运行稿，并显式限定八份运行源文件，避免重新载入旧的重复合并稿。

提交保存在 main。仓库 `github-pages` 环境目前仅允许 `feature/instagram-video-call-spotify-playlist` 发布；连接无法修改该设置（GitHub API 403）。因此通过既有 `pages.yml` 从被允许的发布分支部署 main 的同一提交；main 推送照常运行构建检查，实际发布分支与 main 使用相同 SHA。原 Pages 地址保持不变。
