export type MatchLine = "opening" | "wonConcern" | "wonPlayerReply" | "wonTease" | "lossConcern" | "lossPlayerReply" | "lossDrink" | "buyPlayerReply" | "buyToast" | "buyPlayerQuestion" | "buyAnswer" | "stayPlayerReply" | "stayAnswer" | "stayPlayerQuestion" | "stayTease";

// Dialogue is authored separately for each route. Shared match controls live in HogwartsDevice.
export const routeMatchContent: Record<string, Partial<Record<MatchLine, string>>> = {
  hyunjae: {
    "opening": "你来得还挺早。",
    "wonConcern": "你刚才在看台上那么紧张，我还以为你押的是我们。",
    "wonPlayerReply": "我就不能一边替你紧张，一边押他们赢吗？",
    "wonTease": "可以。那你喝第一口的时候，能不能稍微替我难过一下？",
    "lossConcern": "我们输了球，你输了加隆。现在只剩一个问题了。",
    "lossPlayerReply": "什么？",
    "lossDrink": "你还喝不喝黄油啤酒？我反正要喝一杯。",
    "buyPlayerReply": "买。都到这儿了，我总不能只喝西北风吧。",
    "buyToast": "敬今天最有眼光的观众。",
    "buyPlayerQuestion": "你确定要夸我？我刚押错了。",
    "buyAnswer": "我说的是你选了靠窗的位置。球赛那件事，我们明天再提。",
    "stayPlayerReply": "我不点了。陪你坐一会儿吧。",
    "stayAnswer": "行。那你陪我听听，他们打算把最后一球讲几遍。",
    "stayPlayerQuestion": "这已经是第四遍了。",
    "stayTease": "你还真数了？"
}
};
