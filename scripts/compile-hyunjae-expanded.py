"""Compile the approved Hyunjae expansion; preserve source lines and explicit conditions."""
import json,re,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'story-archive'
OUT=ROOT/'stories/hyunjae-expanded.json'
SPEECH=re.compile(r'^([^：:]{1,30})[：:]\s*(.+)$')
OPT=re.compile(r'^([ABC])｜(?:「(.*?)」|([^　]+?))(?:[　\s]+心动\s*\+(\d+))?$')
FIXED=re.compile(r'^固定回复[^｜]*｜「(.*)」$')
COND={
 '同学院、同年级':'same-house-year','同年级、不同学院':'same-year-other-house','同学院、不同年级':'same-house-other-year','不同学院、不同年级':'other-house-year',
 '昨天一起看初雪':'snow-together','昨天独自看初雪':'!snow-together','如果昨天围巾进雪':'snow-scarf','如果昨天围巾没有进雪':'!snow-scarf',
 '选择了在门厅会合':'dinner-meet','选择了帮忙留座位':'!dinner-meet',
 '如果昨天选择了烤鸡':'food-roast','如果昨天选择了清淡食物':'!food-roast',
 '如果选择了第三排':'third-row','如果选择了和朋友先找位置':'!third-row',
 '如果玩家获得竞猜兑换券':'voucher-won','如果玩家没有获得竞猜兑换券':'!voucher-won',
 '如果玩家持有魁地奇竞猜兑换券':'voucher-held','如果玩家没有获得兑换券':'!voucher-held',
 '如果玩家此前选择烤鸡':'food-roast','如果玩家此前选择清淡食物':'!food-roast',
 '如果昨天已经接受邀请':'tree-together','如果昨天没有一起看圣诞树':'!tree-together',
 '如果玩家选择过想看他吃酸糖的表情':'wanted-sugar-face','如果玩家没有选择过该对白':'!wanted-sugar-face',
 '如果玩家选择一起吃巧克力':'chocolate-together','如果玩家选择让他挑一块最好吃的':'!chocolate-together',
 '如果上午约定一起吃':'chocolate-together','如果上午已经收到单独包装的巧克力':'!chocolate-together',
 '如果玩家约定早饭后见面':'holiday-breakfast','如果玩家约定午饭见面':'!holiday-breakfast',
 '如果玩家主动参与围巾选择':'scarf-active','如果玩家没有主动参与围巾选择':'!scarf-active',
 '如果玩家曾与李贤在共同经历初雪及槲寄生剧情':'snow-together','如果玩家没有共同经历初雪剧情':'!snow-together',
 '如果玩家曾选择过13日苦糖表情相关对白':'sugar-face','如果玩家没有选择过相关对白':'!sugar-face',
 '如果26号主动约定午饭':'lunch-promise','如果26号没有主动约定午饭':'!lunch-promise',
 '如果玩家曾明确表示喜欢烤鸡':'food-roast','如果玩家选择其他饮食偏好':'food-light','如果没有明确偏好记录':'!food-known',
 '如果玩家触发过苦糖表情记忆':'sugar-face','如果没有相关记忆':'!sugar-face',
 '如果玩家曾与李贤在一起看初雪':'snow-together','如果玩家没有与李贤在一起看初雪':'!snow-together',
 '如果玩家曾约定将魔法灯留到跨年':'lamp-promise','如果玩家没有作出该约定':'!lamp-promise',
 '选择格兰芬多':'team-gryffindor','选择斯莱特林':'!team-gryffindor',
 '预测成功':'voucher-won','预测未成功':'!voucher-won',
}
OUTER={
 (6,'一起看初雪'):'snow-together',(6,'独自看初雪'):'!snow-together',
 (15,'一起吃晚餐'):'dinner-now',(15,'晚一点去礼堂'):'!dinner-now',
 (17,'一起去看圣诞树'):'tree-together',(17,'留在宿舍休息'):'!tree-together',
 (22,'早饭后的约定'):'holiday-breakfast',(22,'午饭时见面'):'!holiday-breakfast',
 (22,'图书馆的下午'):'library-afternoon',(22,'城堡里没有走过的路'):'!library-afternoon',
 (29,'灯光亮起的时候'):'lantern-early',(29,'隔着窗户看灯'):'!lantern-early',
}
# Existing daily scoring opportunities only. The remaining new conversations add 0.
CORE={1:['1','2'],2:['1','2'],3:['1','4'],4:['1','2'],5:['1','3'],6:['1','3A','2B'],7:['1A','1B','2'],8:['3','5'],9:['1','2'],10:['1','5'],11:['1','4'],12:['1','2'],13:['3','4'],14:['1'],15:['4','5'],16:['2','3'],17:['2','4A','3B'],18:['1','2A','2B','4'],19:['3','4'],20:['2A','2B','4'],21:['1A','1B','2'],22:['2','3A','3B'],23:['3'],24:['2','3','6'],25:['1','2'],26:['2','4'],27:['2','3','4'],28:['2','4'],29:['2','4'],30:['4','5'],31:['final']}

def score(day,key,option):
 if key not in CORE[day] or option>1:return 0
 if day==31:return [4,3][option]
 if day in [14,23]:return [3,2][option]
 if (day==18 and key in ['1','4']) or (day==24 and key in ['2','3']) or (day==27 and key in ['2','4']):return [1,0][option]
 return [2,1][option]

def clean(s):return s.replace('**','').strip().removesuffix('\\').rstrip()
def head(s):return clean(s).lstrip('# ').strip('*').rstrip('：:').strip()
def source(file,i):return dict(file=file,line=i+1)
def line(s,src):
 s=clean(s)
 if not s:return None
 if s.startswith('>'):return dict(speaker='李贤在',body=s[1:].strip(),source=src)
 m=FIXED.match(s)
 if m:return dict(speaker='你',body=m[1],source=src)
 m=SPEECH.match(s)
 if m and m[1]!='最终结果':
  text=m[2];text=text[1:-1] if text.startswith('「') and text.endswith('」') else text
  return dict(speaker=m[1],body=text,source=src)
 return dict(body=s.strip('*'),source=src)

class Parser:
 def __init__(self,d,raw,filename):
  self.d,self.rows,self.file=d,raw.splitlines(),filename
  self.beats=[];self.pending=[];self.time='09:00';self.place='霍格沃茨门厅';self.channel='scene'
  self.outer=[];self.temp=[];self.detail=[];self.key='';self.coverage={};self.initial=None
 def when(self):return self.outer+self.temp+self.detail
 def add(self,b):
  self.beats.append(dict(**b,time=self.time,place=self.place,channel=self.channel,when=self.when()))
  if self.initial is None:self.initial=dict(time=self.time,place=self.place)
 def flush(self):
  if self.pending:self.add(dict(kind='lines',lines=self.pending));self.pending=[]
 def take(self,i,kind):self.coverage[str(i+1)]=kind
 def meta(self,s):
  h=head(s)
  return (not h or s.startswith('---') or h.startswith(('选择①','选择②','选择③','选择④','选择⑤','选择⑥','选择⑦','选择⑧','分支汇合','根据','饮食偏好','昨日','晚餐前差异','学院及年级','竞猜奖励','接入说明','触发条件','本文件','新增相册线索','愿望不影响','此分支','无论玩家','正式游戏','获得一张','选择格兰芬多','选择斯莱特林','下注额不返还','弗雷德 &','你认为哪所','- 格兰芬多','- 斯莱特林','下注1–10','最后一次选择','进入朋友结局','接回原版','圣诞愿望回收','恋人结局在原版','保留「','保持原版','（此处','Make a wish','这是一个只属于','独立游戏弹窗','李贤在正在','前往长廊','霍格沃茨 · 礼堂'))
   or (s.startswith('*') and not s.startswith('**') and h.startswith(('记录','根据','如果','使用同一个','此分支','灯的颜色','恋人','保留','保持'))))
 def parse(self):
  i=0
  while i<len(self.rows):
   raw=self.rows[i];s=clean(raw);h=head(raw);src=source(self.file,i)
   if h.startswith('接入说明') or h.startswith('结局一') or h.startswith('结局二') or h.startswith('结局三'):break
   stamp=re.match(r'^(\d{2}:\d{2}) · (.+)$',s)
   if s.startswith('---'):
    self.flush();self.temp=[];self.detail=[];self.take(i,'section-end');i+=1;continue
   if stamp:
    self.flush();self.time=stamp[1];self.place=stamp[2]
    if self.d==15 and '魔法相册' in self.place:self.outer=[];self.temp=[];self.detail=[]
    self.channel='mail' if '猫头鹰' in self.place else 'scene'
    if self.channel=='mail':self.place='猫头鹰信箱'
    if self.place=='地点跳转':self.place='霍格沃茨西侧长廊'
    if self.place in ['魁地奇比赛正式开始','魁地奇比赛结果']:self.place='魁地奇球场看台'
    if self.place=='冬季灯展':self.place='霍格沃茨西侧回廊'
    self.take(i,'stage');i+=1;continue
   if h=='寄给冬天的愿望' or (h.startswith('使用同一个独立愿望填写弹窗')):
    self.flush();self.add(dict(kind='wish'));self.take(i,'wish');i+=1
    while i<len(self.rows) and head(self.rows[i]) in ['Make a wish','这是一个只属于你的秘密。将愿望挂上圣诞树','独立游戏弹窗交互预览，正式游戏中不显示重新预览按钮。','']:
     self.take(i,'wish-ui');i+=1
    continue
   if '独立竞猜弹窗' in h:
    self.flush();self.add(dict(kind='wager'));self.take(i,'wager');i+=1;continue
   if h=='竞猜结果弹窗':
    self.flush();self.time='15:30';self.add(dict(kind='wager-result'));self.take(i,'result');i+=1;continue
   if h=='圣诞愿望回收（新增插入，不替换原版告白）':self.take(i,'heading');i+=1;continue
   if s.startswith('选择') and re.match(r'选择[①②③④⑤⑥⑦⑧]',s):
    self.flush();m=re.match(r'选择([①②③④⑤⑥⑦⑧])([AB]?)',s);self.key=str('①②③④⑤⑥⑦⑧'.index(m[1])+1)+m[2];self.take(i,'choice-heading');i+=1;continue
   if h.startswith('最后一次选择'):self.flush();self.key='final';self.take(i,'choice-heading');i+=1;continue
   if h.startswith('围巾回忆汇合'):self.flush();self.detail=[];self.take(i,'condition-end');i+=1;continue
   if h.startswith('分支汇合'):
    self.flush();self.temp=[];self.detail=[];self.take(i,'condition-end');i+=1;continue
   if h in COND:
    self.flush()
    if h.startswith('如果昨天围巾'):self.detail=[COND[h]]
    else:self.temp=[COND[h]];self.detail=[]
    self.take(i,'condition');i+=1;continue
   if re.match(r'分支[AB]｜',h):
    self.flush();self.outer=[OUTER[(self.d,h.split('｜',1)[1])]];self.temp=[];self.detail=[];self.take(i,'outer-condition');i+=1;continue
   if h in ['公共剧情','共同剧情','当日晚间']:
    self.flush();self.outer=[];self.temp=[];self.detail=[];self.take(i,'condition-end');i+=1;continue
   if self.d==6 and h=='魔法相册 · 新线索解锁':
    self.flush();self.add(dict(kind='clue',clue=dict(id='photo-snow',title='庭院初雪',body='初雪落在庭院里，他伸手接住两片雪，抬头望向石拱门边的槲寄生。\n\n《石拱门下的初雪》\n\n他认出了拱门上悬挂的**槲寄生**。\n\n只是那天，他并没有告诉你，为什么在抬头看见它的一瞬间，忽然停下了脚步。',unlocked=True)))
    while i<len(self.rows) and not self.rows[i].startswith('---'):self.take(i,'clue');i+=1
    continue
   if self.d==15 and '魔法相册更新' in self.place:
    self.flush();self.channel='scene';self.place='魔法相册';self.add(dict(kind='clue',clue=dict(id='hyunjae-food-note',title='多记住的一行',body='李贤在的日程表背面，多出了一行与级长工作无关的字。\n\n{{foodNote}}\n\n那张写满课程和巡查安排的羊皮纸上，第一次出现了一件不属于他自己的事情。',unlocked=True)))
    for j in range(i,len(self.rows)):self.take(j,'clue')
    break
   option=OPT.match(s)
   if option and option[1]=='A':
    self.flush();opts=[]
    while i<len(self.rows):
     row=clean(self.rows[i]);m=OPT.match(row)
     if not m:break
     index=ord(m[1])-ord('A');body=m[2] or m[3];opt=dict(body=body,affinity=score(self.d,self.key,index),rawAffinity=int(m[4] or 0),lines=[],source=source(self.file,i));self.take(i,'option');i+=1
     while i<len(self.rows):
      v=clean(self.rows[i]);vh=head(self.rows[i])
      if OPT.match(v) or vh.startswith(('分支汇合','选择','结局')) or self.rows[i].startswith('---') or re.match(r'^\d{2}:\d{2} · ',v) or self.rows[i].startswith('#'):break
      # Notes under an option are author instructions, never spoken text.
      if self.meta(self.rows[i]):self.take(i,'note');i+=1;continue
      l=line(self.rows[i],source(self.file,i))
      if l:opt['lines'].append(l)
      self.take(i,'option-line');i+=1
     opts.append(opt)
     if i>=len(self.rows) or not OPT.match(clean(self.rows[i])):break
    assert len(opts)>=2,(self.file,self.key,opts)
    self.add(dict(kind='choice',id=f'{self.d:02}:{self.key}',options=opts));continue
   if self.d==25 and h.startswith('如果玩家曾明确表达食物偏好'):
    self.flush();self.add(dict(kind='meal',meal='breakfast'));self.take(i,'meal-action');i+=1;continue
   if self.d==27 and h.startswith('李贤在根据已记录的偏好'):
    self.flush();self.add(dict(kind='meal',meal='lunch'));self.take(i,'meal-action');i+=1;continue
   if self.meta(raw) or raw.startswith('#') or h in ['李贤在','圣诞舞会','第一支舞','舞会结束','巧克力约定回收'] or (self.d==25 and h.startswith(('如果玩家曾明确表达','如果没有偏好记录'))):
    self.take(i,'structure');i+=1;continue
   if h.startswith('如果'):raise AssertionError((self.file,i+1,'unhandled condition',s))
   l=line(raw,src)
   if l:
    if self.d==4 and s in ['*刚才是你先笑的。*','*明明是你先给我看的。*']:l['speaker']='李贤在' if '刚才' in s else '你'
    self.pending.append(l)
   self.take(i,'line');i+=1
  self.flush()
  assert self.initial,(self.file,'empty')
  return dict(day=self.d,title=head(self.rows[0]).split('｜',1)[-1],schedule=f'12月{self.d}日 · {self.initial["time"]} · {self.initial["place"]}',**self.initial,beats=self.beats,coverage=self.coverage)

def compile_all():
 days=[]
 for d in range(1,32):
  name=f'hyunjae-day{d:02}-expanded.md';raw=(A/name).read_text();p=Parser(d,raw,name);result=p.parse()
  # A non-empty run of continuation quotes is a single typed message.
  for b in result['beats']:
   groups=[b.get('lines',[])]+[o['lines'] for o in b.get('options',[])]
   for ls in groups:
    for l in ls:
     if l.get('speaker')=='李贤在' and not l['body']:ls.remove(l)
  # Preserve legacy memories without adding images or changing their IDs.
  if d==17:
   clue=(A/'hyunjae-day17-approved-clue.md').read_text().split('## 《没有署名的愿望》',1)[1].strip()
   result['beats'].append(dict(kind='clue',time='17:00',place='魔法相册',channel='scene',when=[],clue=dict(id='hyunjae-wish',title='没有署名的愿望',body=clue,unlocked=True)))
  if d==22:
   result['beats'].append(dict(kind='clue',time='20:35',place='魔法相册',channel='scene',when=['library-afternoon','library-pie'],clue=dict(id='photo-library-pie',title='图书馆的馅饼',body='你读完那一页，他还坐在旁边，替你压着纸包翘起来的一角。',unlocked=True)))
  if d==24:
   result['beats'].append(dict(kind='clue',time='22:50',place='魔法相册',channel='scene',when=['ball-happy'],clue=dict(id='photo-ball-mistletoe',title='舞会后的石拱门',body='舞会散场后，他在石拱门下放慢脚步，抬头看了一眼槲寄生，又看向你。',unlocked=True)))
  days.append(result)
 variants={}
 raw=(A/'hyunjae-day31-expanded.md').read_text();headers=list(re.finditer(r'^# 结局[一二三].*$',raw,flags=re.M));sections=[(raw[m.end():headers[i+1].start() if i+1<len(headers) else len(raw)],raw[:m.end()].count('\n')) for i,m in enumerate(headers)]
 titles={'together':'恋人结局 · 雪停之前','unspoken':'暧昧结局 · 明年第一个','friends':'朋友结局 · 窗边那个位置'}
 for kind,(section,offset) in zip(['together','unspoken','friends'],sections):
  rows=section.splitlines();lines=[]
  for local_index,s in enumerate(rows):
   h=head(s)
   if h.startswith('接入说明'):break
   if not h or s.startswith(('#','---')) or (s.startswith('*') and not FIXED.match(clean(s))) or h.startswith('触发条件'):continue
   l=line(s,dict(file='hyunjae-day31-expanded.md',line=offset+local_index+1))
   if l:lines.append(l)
  end=dict(day=31,title=days[30]['title'],schedule=days[30]['schedule'],time=days[30]['time'],place=days[30]['place'],beats=days[30]['beats']+[dict(kind='lines',time='19:05',place='霍格沃茨西侧长廊',channel='scene',when=[],lines=lines)],ending=dict(kind=kind,id='hyunjae-'+kind,title=titles[kind],text={'together':'他在石拱门下牵住了你的手。你们谁都没催着走。等窗外的雪停下来，你才发现，刚才还冻得发僵的那只手，已经暖了。','friends':'把话说开以后，你们还是并肩走了回去。快到楼梯口，他问下次去三把扫帚还给不给他留位置。你说：「留啊。但窗边那个归我。」他笑了：「我就知道。」','unspoken':'走到长廊尽头，你们就该往不同的方向走了。他多站了一会儿，说：「明年我还是想第一个来找你。」你说：「那你得来早点。」'}[kind]))
  end['beats'].append(dict(kind='clue',time='19:30',place='魔法相册',channel='scene',when=[],clue=dict(id='photo-new-year',title='跨年长廊',body={'together':'再经过那道石拱门时，他看见了槲寄生，这次什么也没说，只是牵住了你的手。','friends':'雪落在长廊外，你们说好下次去三把扫帚，还是坐窗边。','unspoken':'长廊里很安静，他说，明年还是想第一个来找你。'}[kind],unlocked=True)))
  variants[kind]=end
 for day in days[:30]+list(variants.values()):
  stages={}
  for beat in day['beats']:
   key=(beat['time'],beat['place'],beat['channel'])
   lines=beat.get('lines',[])+[line for opt in beat.get('options',[]) for line in opt['lines']]
   stages[key]=stages.get(key,False) or any(line.get('speaker')=='李贤在' or '李贤在' in line['body'] for line in lines)
  for beat in day['beats']:beat['hyunjaePresent']=beat['channel']=='scene' and stages[(beat['time'],beat['place'],beat['channel'])]
 return dict(days=days[:30],endings=variants)

if __name__=='__main__':
 data=compile_all();result=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 if '--check' in sys.argv:assert OUT.exists() and OUT.read_text()==result,'Hyunjae compiled data is stale'
 else:OUT.write_text(result)
 print('Hyunjae expanded: 31 complete days, 3 original endings and source conditions compiled')
