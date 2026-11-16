# 金泳勋 Day 25–31

原稿：`story-archive/younghoon-day25-full.md` 至 `younghoon-day31-full.md`，以及 `younghoon-ending-page-copy.md`。八份原稿保持不变。新增数据由 `python scripts/compile-younghoon-finale.py` 生成，保留既有 Day 1–24 的六份 JSON。其他男主的剧情数据不变。

普通游戏沿用原有存档，Day 24 完成后继续 Day 25。Day 31 先读礼堂场景、20:46 信件和旧观测室告白，再确认最终相册提示，选择恋人、朋友或未说出口。所有选项均依原稿开放，不额外增加好感门槛。每条结局正文读完后点击「查看结局」进入对应文案页；「返回」恢复只读的 12 月 31 日行程。

独立试玩入口从第 31 天开头开始，包含当日信件、相册及对应结局正文，不改正式进度：

- `?preview=younghoon-ending-together`
- `?preview=younghoon-ending-friends`
- `?preview=younghoon-ending-unspoken`

三入口各自预选对应结局，隔离试玩通信记录。自由三选一入口为 `?preview=younghoon-day31`。其他日期可使用 `?preview=younghoon-day25` 等。

## 验证

- `npm run typecheck`、`npm run lint`、`npm test`（包括全原稿对白/旁白逐行保留核对）。
- `STORY_FILE=stories/hyunjae/story.json npm run story:validate`、`STORY_FILE=stories/hyunjae/story.json npm run story:test`、`STORY_FILE=stories/hyunjae/story.json npm run build`。
- 在 4173 端口启动生产预览后运行 `node scripts/verify-younghoon-browser.mjs`：390×844，Day 25–30 的 A/B 路径、Day 31 三选一结局、信件及固定回复、相册提示（Escape 不关闭）、结局页返回和最终相册。
- `node scripts/verify-younghoon-links.mjs`：三个独立入口从当日开头通关。可设置 `BASE_URL` 验证 Pages。
- `node scripts/verify-younghoon-save.mjs`：从 Day 24 存档续玩至 Day 25，刷新保留阅读位置、好感度和既有线索。

浏览器脚本默认使用 `/usr/bin/chromium`；完整分支脚本支持 `CHROMIUM_PATH` 指定浏览器。以上属于桌面 Chromium 的移动视口检查，不代表真机 Safari 验证。

发布继续使用原 GitHub Pages 仓库、既有工作流及 `feature/instagram-video-call-spotify-playlist` 发布分支。

## 地图、旁白与送礼回归

`node scripts/verify-route-map-typewriter.mjs` 检查 Day 1–31 所有已标注时刻与地点、七个人物标记，以及四条路线的逐字旁白。地图现在为金泳勋所有剧情地点提供明确坐标；旧版漏掉的 Day 24 19:00 礼堂外转场通过独立元数据恢复，不改原稿、剧情分支或存档的 beat/cursor。

`node scripts/verify-gift-persistence.mjs` 在正式游戏入口创建隔离测试存档，实际购买并赠送偏好与普通礼物，核对四条路线：偏好 +5、普通 +2；送其他男主时当前男主好感度低于 70，嫉妒 +3，达到 70 后 +5；两项数值均以 100 为上限。每种情形刷新两次，检查当前男主与收礼人的数值未丢失、未重复计算。高分及封顶测试使用明确的既往送礼记录作为初始条件。

这些修正不新增或接入约会文案；新增文案须另行审阅确认。

`node scripts/verify-scene-time-save.mjs` 验证 Day 24 的 19:00 转场、Day 26 的 16:00 场景完成状态在旧时刻存档恢复后正确保存；刷新保留 beat、阅读位置和好感度。剧情进度采用基于前一状态的更新，避免转场时间与阅读游标同时保存时相互覆盖。
