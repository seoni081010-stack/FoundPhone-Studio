type DateScene = { reply: string; scene: string[] };

const hyunjaeDates: Record<string, DateScene> = {
  puddifoot: { reply: "好啊。先说好，你点的蛋糕要分我一口。", scene: ["他把蛋糕推到桌子正中，自己先拿起叉子。", "你不是说分我一口？我这才第一口。", "你管这叫一口？叉子都快拿不动了。", "……那剩下半块都归你。"] },
  "three-broomsticks": { reply: "去啊。你先到的话，帮我留个靠窗的位置。", scene: ["他端着两杯黄油啤酒回来，在你对面坐下。", "我刚才差点把这杯端给隔壁桌。", "那你怎么认出我的？", "你从我站起来就一直盯着这杯。"] },
  "hogs-head": { reply: "好。那里安静，你上次没讲完的事可以接着讲了。", scene: ["角落里只剩一张小桌，他把椅子往你这边拖了一点。", "行了，刚才说到哪儿了？", "你还记得啊？我都快忘了讲到哪儿了。", "记得。你每次讲到最好笑的地方就被人打断。"] },
  "diagon-alley-walk": { reply: "可以。丽痕书店见，你要是先到，别一个人把整间店逛完。", scene: ["你从书架上抽出一本书，发现他正从另一侧看着同一本。", "你也想看这个？", "我只是想看看你挑了什么。", "一起看呗。手慢点，我这页还差两行。"] },
  "leaky-cauldron": { reply: "好啊，正好我饿了。你想吃什么？我可以先帮你占座。", scene: ["他朝你招手，把菜单转到你面前。", "我看了半天，最后决定等你来选。", "这么信我？那我可要乱点了。", "嗯。选错了我也能帮你吃一半。"] },
  "florean-fortescue": { reply: "好！你挑一个口味，我挑一个，先别告诉我你选什么。", scene: ["两份冰淇淋端上来，居然是同一个口味。你们对视了一眼。", "等一下，你是不是偷听我点单了？", "喂，我先点的。你才可疑。", "那没办法了。下次再来一次，看看还会不会撞。"] },
};
const hyunjaeDeclines = [
  "对不起啊，变形术的练习还没补完。我答应教授今天交，下次我早点留时间。",
  "今天可能去不了了，抱歉。格兰芬多那边临时要我换一轮巡查，等我忙完再找你。",
  "抱歉，我和同学约了整理魔咒学笔记，他还在等我。下次你再叫我，好不好？",
];
export const routeDateContent: Record<string, { venues: Record<string, DateScene>; declines: string[] }> = {
  hyunjae: { venues: hyunjaeDates, declines: hyunjaeDeclines },
};
