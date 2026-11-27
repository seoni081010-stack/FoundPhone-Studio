# 裴俊英扩写接入与验证

## 接入范围

以正式版 `7e764d508ab0d4fee26f63c01c82cbaa281f9a86` 为底稿，读取存档分支 `archive/jcode-december-expansion` 的 `6ff5074dfb73926349bad9504ba11dd77027a6b6` 七份完整确认稿。Day1–30按105个明确的插入／替换段落合并原路线；Day31使用最新完整公共段及三条独立结局。确认稿和用户授权的最小衔接修订保存在仓库，逐文件原始／修订SHA-256见 `stories/jcode-expanded-source-manifest.json`。

- 原始路线文本保留；仅修改授权的局部冲突，详见 `jcode-expanded-continuity.md` 与 `stories/jcode-expanded-approved-adaptations.json`。
- 编译器在构建和校验时核对所有确认稿哈希及全部人物对白是否出现在互动数据中。Day31三条路径还逐句比对公共段、双方选项及各自独立正文，分别130／128／127条文字记录，与原稿相等。
- 共保留四条相册（Day1、6、17、24），各自明确点击更新提示后继续；没有新增最终相册。
- Day13可选纸色、装饰及自由写字，草稿和提交保存。Day25按最新要求新增Jacob写给玩家的独立圣诞来信弹窗；不读取Day13玩家字段，原13日存档不变。
- Day18使用用户提供卡面处理后的五角形图片，以「纽特·斯卡曼德」「忒修斯·斯卡曼德」「阿不思·邓布利多」为选项，不显示A／B／C。选卡不加分、不解锁相册；仅12日答应交换后显示。
- 所有人物对白沿用SceneDialogue逐字输出；旁白整段显示；固定回复点击推进。
- 没有新增暗房显影或舞会动画。底部四入口、约会系统及其他六条路线原稿保持现状。

## 计分与结局

保留确认稿原始+2／+1，并补齐原版未标分选项的已确认全局A+2／B+1。实际最高原始分为248，折算为0–100剧情心动值；初始学院／年级好感与送礼沿用现有机制，正常结局仍按100／80阈值自动判定。

单元模拟的全A为248→100，全B为123→49.596774，混合路径217→87.5。180种混合策略覆盖全部可达对话选项，三种结局均可正常到达，不要求用预览绕过计分。选项ID、计分记录和条件标志持久保存，刷新不会再次计分。

扩写存档使用独立版本键 `hogwarts-jacob-expanded-v1`；原版键保留，不删除或覆写。其他六条路线继续使用原有存档键。预览只在内存中运行，不写正常路线存档。

## 自动检查

以下命令通过：

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`：30个文件、255项测试通过。
- `STORY_FILE=stories/hyunjae/story.json npm run story:validate`
- `STORY_FILE=stories/hyunjae/story.json npm run story:test`
- `STORY_FILE=stories/hyunjae/story.json npm run build`：通过；仅把新扩写数据拆为独立JS块，保留原PWA缓存上限及Pages工作流。

浏览器验证脚本：

- `scripts/verify-jacob-expanded.mjs`：三条31天连续通关、固定回复、选择、条件记忆、四次相册提示、逐日刷新、时间和分值保存、三独立结局及盖章／返回。
- `scripts/verify-jacob-cards.mjs`：13日制作、草稿刷新与提交；18日三卡真实图片加载、中文选项、无额外分值／线索、选择保存。
- `scripts/verify-seven-route-isolation.mjs`：七人入口、四个固定按钮、七人信箱及其他路线存档隔离。
- `scripts/verify-layered-map.mjs`：手机／桌面分层地图、七人标记、原楼层标签和存档不变。
- `scripts/verify-shared-events.mjs`：七人两种下注、相同纸条、单次扣款、刷新保存以及跨年烟花。

本次设备验证为Chromium手机尺寸与桌面尺寸；未用实体iOS／Android设备验证。

## 浏览器实测结果

三条正常路线均从Day1连续完成至Day31：高分剧情心动100→恋人，混合83.467742→朋友，低分49.596774→未说出口。每条均确认四次独立相册提示，并逐日刷新核对日期、分值及后续课程时间恢复。三个独立预览均检查烟花、盖章、返回正常31日行程及不写入正常存档。

13日贺卡草稿、颜色、装饰与提交通过；18日三张卡图片实际解码为1281×1227，各中文选项分别点击、刷新保存且分值／相册不变。七人入口／七人信箱、手机与桌面地图、七人各两种下注共14种及跨年烟花均通过。

## 部署入口

正式游戏：https://seoni081010-stack.github.io/FoundPhone-Studio/

裴俊英入口：https://seoni081010-stack.github.io/FoundPhone-Studio/?route=jacob

三结局预览分别为 `?preview=jcode-ending-together`、`?preview=jcode-ending-friends`、`?preview=jcode-ending-unspoken`。

部署沿用 `.github/workflows/pages.yml`，main与既有发布分支使用同一提交。发布状态、SHA及线上复测以交付回复中的实际结果为准。
