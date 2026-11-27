#!/usr/bin/env python3
"""Merge the pinned Q additions through explicit, stable runtime anchors."""
import hashlib, json, pathlib, re, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def load(p):return json.loads((ROOT/p).read_text())
manifest=load('stories/q-expanded-source-manifest.json')
for entry in manifest:
 assert hashlib.sha256((ROOT/entry['file']).read_bytes()).hexdigest()==entry['sha256'], 'Pinned Q source changed: '+entry['file']

base=[load('stories/q/days02-06.json'),load('stories/q/days07-16.json'),load('stories/q/days17-22.json'),load('stories/q/days23-26.json')]
final=load('stories/q/days27-31.json')
days=sum(base,[])+final['days'];story=load('stories/q/day01.json');endings=final['endings'];owl=load('stories/q-owlpost.json')
byday={d['day']:d for d in days}
blocks={}
for p in sorted((ROOT/'story-archive').glob('q-day*-additions-approved.md')):
 day=0;index=0;key=None
 for num,line in enumerate(p.read_text().splitlines(),1):
  m=re.match(r'## Day\s*(\d+)',line)
  if m:day=int(m[1]);index=0;key=None
  elif line.startswith('## '):key=None
  elif line.startswith('### '):
   key=f'{day}.{index}';index+=1;blocks[key]={'heading':line[4:],'rows':[],'source':str(p.relative_to(ROOT)),'line':num}
  elif key and line.strip():blocks[key]['rows'].append(line.strip())
# Apply only the author's approved continuity corrections to the runtime copy.
fixes=[
 ('你上次看见的时候，它还翻不过来啊。','你上次看见的时候，它翻得还没这么稳啊。'),
 ('会了。我试了快一个月。就等你问呢。','现在翻得稳多了。我试了快一个月。'),
 ('没过多久，你的视线又落在旁边那张空椅子上。','没过多久，你低头看了看自己正坐着的椅子。'),
 ('刚才进门时，你顺手把书包放在了那里。','刚才进门时，你顺手把书包放在了脚边。'),
 ('昨天落在这儿的。','之前落在这儿的。'),
 ('池昌民：第一支舞，你现在想跳吗？','池昌民：我们去跳舞吗？'),
 ('池昌民：对了，二十四号你要是在，第一支舞跟我跳吗？','池昌民：对了，平安夜的舞会，你想和我一起跳舞吗？'),
 ('池昌民：十二号，我在这儿等你？','池昌民：比赛那天，我在这儿等你？'),
 ('画像里的老巫师','奥斯瓦尔德'),('画里的老巫师','奥斯瓦尔德'),('老巫师','奥斯瓦尔德'),
]
def walk(v):
 if isinstance(v,str):
  for a,b in fixes:v=v.replace(a,b)
  return v
 if isinstance(v,list):return [walk(x) for x in v]
 if isinstance(v,dict):return {k:walk(x) for k,x in v.items()}
 return v
story=walk(story);days=walk(days);byday={d['day']:d for d in days}
# Establish the remembered drop before the handkerchief is lent.
a=byday[17]['stages'][2]['choices'][0]['lines'];i=a.index('池昌民停在下一级台阶上，转身接过去。');a[i:i+1]=['池昌民停在下一级台阶上，接过你递来的羽毛笔。他转身时，笔杆碰到栏杆，落在台阶上。他弯腰捡起来。']
# Same dormitory friend returns early, keeping the original friend ending intact.
a=byday[30]['stages'][0]['opening'];a[0:0]=['放假时离校的室友发来消息，说会提前在元旦回来，还约了池昌民下棋。']
# The portrait's Tuesday clue was incomplete, not a rule silently discarded.
blocks['30.1']['rows'].insert(7,'猎犬画像：「书上那句星期二说的是上次检修。钟响的时候，其他日子也能过去。」')
# Corrections in approved additions.
for k,b in blocks.items():
 b['rows']=[x.replace('他们收到昨天寄的信了？','他们收到前天寄的信了？').replace('昨天研究过的位置','之前研究过的位置').replace('今天的雪好像比六号多很多。','今天的雪好像比初雪那天多很多。').replace('十三号买的卡纸','上次去霍格莫德买的卡纸') for x in b['rows']]
blocks['12.0']['heading']=blocks['12.0']['heading'].replace('10:30','10:00');blocks['12.1']['heading']=blocks['12.1']['heading'].replace('10:40','10:20')
# Day 21 is still a school day: move this after the final afternoon lesson.
blocks['21.0']['heading']=blocks['21.0']['heading'].replace('12:30','15:30')
# Day13 optional memory refers to an actual Honeydukes visit, not an unseen match-day sweet.
for m in owl:
 if m['day']==13:
  m['opening']='我刚在口袋里摸到上次在蜂蜜公爵买的糖。糖纸都皱了，还好里面那颗没碎。你想吃吗？'
  m['options'][0]['answer']='我没拆。我记得是我们上次在蜂蜜公爵看过的那种。'
  m['options'][1]['reply']='你吃吧。上次我已经吃过了。'
 if m['day']==6:m['opening']='雪停了一会儿。刚才我们在窗上画的那个太阳，已经被水珠冲掉半边了。你那边还在下吗？'
 if m['day']==12:
  m['options'][1]={'reply':'比赛最后那一下，整个看台都在喊。','answer':'对。\n我本来还想跟你说话，结果自己的声音都听不清了。'}
  m['follow']={'choice':1,'reply':'不过今天真的很好玩。','answer':'嗯，我现在闭上眼睛还能想起来最后那一球。\n今天一起看比赛真的很开心。'}
# Later manuscript explicitly supersedes the obsolete preservation lines on Day20.
r=blocks['20.1']['rows']; start=next(i for i,x in enumerate(r) if '等糖霜' in x or '凝固' in x)
late=(ROOT/'story-archive/q-day21-25-additions-approved.md').read_text().splitlines()[6:14]
if r[start-1]=='池昌民笑着将两个姜饼人并排摆好。':start-=1
r[start:]=late
# Remove only editorial instructions; narrative beginning with 不/原 is NOT discarded.
def editorial(x):
 return bool(re.match(r'^(?:接入注意|接入说明|接入核对|后续11|Day\d|接原|接回原|原短笺|原可选短笺|原相册|原地图短笺|原黑国王短笺|原结尾|原“你怎么坐|原「我已经|原舞会|根据昨天选择|不新增|不提前约定|不描述玩家|不预告告白|不强行|回收2号|以下为用户|直接显示以下|正文结束|保留原|全部尚未|若原版选择.*：$)',x)) and not x.startswith('若')
# Condition section pairs read stable original keys or explicit new choice flags.
cond={
 '6.0':('q-expanded-04-1-selected',0), '7.0':('q-expanded-06-1-selected',0),
 '12.0':('q-expanded-11-0-selected',0),'16.1':('q-day16-stage2-selected',0),
 '19.0':('q-day19-stage0-selected',0),'19.1':('q-expanded-06-1-selected',0),
 '23.3':('q-day18-stage1-selected',0),'23.4':('q-expanded-23-0-selected',0),
 '24.2':('q-day24-stage1-selected',0),'24.3':('q-expanded-18-0-selected',0),
 '24.4':('q-day24-stage2-selected',0),'26.1':('q-day26-stage2-selected',0),
 '28.0':('q-day28-stage1-selected',0),'30.1':('q-expanded-15-1-selected',0),
}
def clean(x):
 x=re.sub(r'^固定(?:回复|追问)[^｜]*｜','你：',x)
 # Remove only enclosing speech quotes, preserving quotations inside a sentence.
 m=re.match(r'^([^：]+)：「(.*)」$',x)
 if m:x=m[1]+'：'+m[2]
 return x

def parse_rows(rows,key):
 rows=[x for x in rows if not editorial(x)]
 # A conditional spans to the next 汇合 or the block end; nested AB supported.
 out=[];i=0
 while i<len(rows):
  x=rows[i]
  if x.startswith('若'):
   assert key in cond,(key,x)
   j=i+1
   while j<len(rows) and not rows[j].startswith('若'):j+=1
   assert j<len(rows),(key,'unpaired condition')
   first=rows[i+1:j]; secondline=rows[j];j+=1;second=[]
   if '：' in x and x.split('：',1)[1] and '：' in secondline and secondline.split('：',1)[1]:
    first=[x.split('：',1)[1]];second=[secondline.split('：',1)[1]]
    # Inline colour annotations are spoken by Q, not anonymous narration.
    first=[v if '：' in v else '池昌民：'+v for v in first];second=[v if '：' in v else '池昌民：'+v for v in second]
    out.append({'if':cond[key][0],'value':cond[key][1],'yes':parse_rows(first,key),'no':parse_rows(second,key)})
    i=j;continue
   if '：' in x and x.split('：',1)[1]:first.insert(0,x.split('：',1)[1])
   if '：' in secondline and secondline.split('：',1)[1]:second.append(secondline.split('：',1)[1])
   while j<len(rows) and not rows[j].startswith('汇合'):
    second.append(rows[j]);j+=1
   out.append({'if':cond[key][0],'value':cond[key][1],'yes':parse_rows(first,key),'no':parse_rows(second,key)})
   i=j+1;continue
  m=re.match(r'^A[｜｜]\s*(.+?)(?:\s*\+\d+)?$',x)
  if m:
   label=m[1].strip();a=[];b=[];j=i+1
   while j<len(rows) and not re.match(r'^B｜',rows[j]):a.append(rows[j]);j+=1
   assert j<len(rows),(key,'no B')
   labelB=re.sub(r'\s*\+\d+$','',rows[j][2:]).strip();j+=1
   while j<len(rows) and not rows[j].startswith('汇合'):
    # A later conditional belongs to the common part, not branch B.
    b.append(rows[j]);j+=1
   out.append({'choice':[{'label':clean(label).strip('「」'),'flow':parse_rows(a,key)},{'label':clean(labelB).strip('「」'),'flow':parse_rows(b,key)}], 'key':'q-expanded-'+key.replace('.', '-',1).split('-')[0].zfill(2)+'-'+key.split('.')[1]+'-selected'})
   i=j+1;continue
  if not x.startswith('汇合'):out.append(clean(x))
  i+=1
 return out
# Trim editorial mixed into the tail of single-heading days.
for k,end in [('8.0','原“你怎么坐'),('12.5','原开头'),('22.0','接原钟声')]:
 pass
# Day8 ending replacement is its own anchored fragment, not part of the afternoon scene.
r=blocks['8.0']['rows'];i=next(i for i,x in enumerate(r) if x.startswith('原“你怎么坐'));extra8=r[i+2:];blocks['8.0']['rows']=r[:i]
blocks['9.1']['rows']=[x for x in blocks['9.1']['rows'] if x not in ['池昌民站在楼梯口，认真地想了一会儿。','池昌民：「要不先去找点吃的？」']]
# Day12 mail block is handled by the optional-letter data above.
blocks.pop('12.5')
# Normalise inline condition headings into two branches.
# Day24 tie colour labels are commentary; the branches are already A/B player replies.
# Day20 end block must run before the original final choice, inside the kitchen.
blocks['20.2']['heading']=blocks['20.2']['heading'].replace('厨房外','厨房')
blocks['20.2']['rows']=[x for x in blocks['20.2']['rows'] if not ('单独装' in x or '将刚刚制作的姜饼' in x or '手中的纸袋' in x or '纸袋换到另一只手' in x)]
# Day27 return choice is played after the light show, not before it.
ret=byday[27]['stages'][1]
ret['opening']=[x for x in ret['opening'] if x not in ['结完账，你们一起走到门外。街上已经有人挨家点灯，雪水顺着屋檐滴下来。','池昌民站在台阶上，把装笔尖的小纸袋塞进口袋。','池昌民：你还要去哪儿吗？']]
ret['opening']+=['结完账，你们一起走到门外。池昌民把装笔尖的小纸袋塞进口袋。']
# All character dialogue is click-to-advance/typewritten; source fixed replies become outgoing speech.
ops=[]
def op(key,node,anchor=None,where='before',field=None):
 b=blocks[key];flow=parse_rows(b['rows'],key)
 if key=='24.0':flow.insert(2,{'if':'q-expanded-23-0-selected','value':0,'yes':['他戴着昨天选好的深蓝色领带。'],'no':['他戴着昨天选好的深灰色领带。']})
 h=b['heading'].split('｜')[0];m=re.match(r'(\d\d:\d\d)\s*(.*)',h)
 time=m[1] if m else None;place=m[2] if m else None
 if place and ('原' in place or '（' in place):place=None
 aliases={'礼堂':'大礼堂','霍格沃茨礼堂':'大礼堂','佐科':'佐科魔法笑话店','西侧走廊':'城堡西侧长廊','西侧长廊':'城堡西侧长廊','黑湖':'黑湖湖畔','门厅外':'庭院与拱门','楼梯':'城堡楼梯','图书馆外':'图书馆外的走廊','图书馆外走廊':'图书馆外的走廊','城堡三楼':'三楼猎犬画像旁'}
 place=aliases.get(place,place)
 if '信箱' in h or '短笺' in h:channel='mail'
 else:channel='scene'
 if channel=='mail':place=None
 ops.append({'id':'q-expanded-'+key.split('.')[0].zfill(2)+'-'+key.split('.')[1], 'day':int(key.split('.')[0]),'node':node,'anchor':anchor,'where':where,'field':field,'flow':flow,'time':time,'place':place,'channel':channel,'source':b['source'],'line':b['line']})
def p(day,stage=0,suffix=''):return f'q-day{day:02}-stage{stage}'+suffix
# Ordered operations at shared anchors are applied in reverse at runtime.
for k,n,a,w in [
 ('1.0','q-day01-0',None,'after'),('1.0','q-day01-1',None,'after'),
 ('2.0',p(2,0,'-tail'),None,'after'),('2.1',p(2,1,'-tail'),None,'start'),
 ('3.0',p(3), '池昌民：还真是。','after'),('3.1',p(3,0,'-tail'),None,'start'),
 ('4.0',p(4),None,'start'),('4.1',p(4,0,'-tail'),None,'end'),
 ('5.0',p(5,1,'-tail'),None,'start'),('5.1',p(5,1,'-tail'),'池昌民：走吧，也给你买点。','after'),
 ('6.0',p(6),None,'start'),('6.1',p(6,0,'-tail'),'走到石桥尽头时，你的帽子被什么轻轻勾了一下。','before'),('6.2',p(6,0,'-tail'),None,'end'),
 ('7.0',p(7),None,'start'),('7.1',p(7,0,'-tail'),None,'end'),('8.0',p(8),None,'start'),
 ('9.0',p(9,1,'-tail'),None,'end'),
 ('10.0',p(10,1,'-tail'),'你把捡到的那一叠递过去。最上面那张画着池昌民，旁边还有一只被画得歪歪扭扭的甲虫。','before'),('10.1',p(10,1,'-tail'),None,'end'),
 ('11.0',p(11),None,'start'),('11.1',p(11,1,'-tail'),None,'start'),
 ('12.1',p(12),'哨声响起。','before'),('12.2',p(12,0,'-tail'),None,'start'),('12.3',p(12,1,'-tail'),None,'start'),
 ('13.0',p(13,2,'-tail'),None,'end'),('14.0',p(14),None,'start'),('14.1',p(14,2,'-tail'),None,'start'),
 ('15.0',p(15,0,'-tail'),None,'start'),('15.1',p(15,1,'-tail'),None,'start'),('15.2',p(15,1,'-tail'),None,'end'),
 ('16.0',p(16),'池昌民抱着几卷羊皮纸，从另一间温室旁走过来。','before'),('16.1',p(16,2,'-tail'),'他低头系好纸卷，第一次没绕紧，又重新绑了一遍。','before'),
 ('17.0',p(17),None,'start'),('17.1',p(17,2,'-tail'),None,'start'),
 ('18.0',p(18),None,'start'),('18.1',p(18,1),None,'start'),('18.2',p(18,2,'-tail'),None,'start'),
 ('19.0',p(19,1),None,'start'),('19.1',p(19,2,'-tail'),None,'start'),
 ('20.0',p(20),None,'start'),('20.1',p(20,2),None,'start'),('20.2',p(20,2),'你们谢过小精灵，往门口走。到了画框旁，池昌民才想起什么，折回去取了桌角那个纸袋。','before'),
 ('21.0',p(21),None,'start'),('21.2',p(21),'池昌民：坐吗？我还差一张。','after'),
 ('22.0',p(22,2,'-tail'),None,'start'),('22.1',p(22,2,'-tail'),None,'end'),
 ('23.0',p(23),None,'start'),('23.2',p(23,1),None,'start'),('23.3',p(23,2,'-tail'),None,'start'),
 ('24.0',p(24,0,'-tail'),None,'start'),('24.1',p(24,1),None,'start'),('24.2',p(24,1,'-tail'),None,'start'),('24.3',p(24,2),None,'start'),('24.4',p(24,2,'-tail'),None,'start'),
 ('25.0',p(25),None,'start'),('25.1',p(25,2,'-tail'),None,'start'),
 ('26.0',p(26,0,'-tail'),None,'start'),('26.1',p(26,2,'-tail'),None,'start'),
 ('27.0',p(27,1,'-choice'),None,'start'),('27.1',p(27,1,'-choice'),None,'start'),('27.2',p(27,1,'-choice'),None,'start'),
 ('27.3',p(27,1,'-tail'),None,'start'),('28.0',p(28,1,'-tail'),None,'start'),
 ('29.0',p(29),None,'start'),('29.1',p(29,1,'-tail'),None,'end'),
 ('30.0',p(30),None,'start'),('30.1',p(30),None,'start'),('30.2',p(30,1),None,'start'),
]:op(k,n,a,w)
op('14.2',p(14,2,'-tail'),None,'end')
op('30.3',p(30,1,'-tail'),None,'end')
# Append complete sequential scenes after these blocks.
sequences=[('1.0',['1.1']),('5.1',['5.2','5.3']),('9.0',['9.1','9.2']),('19.1',['19.2','19.3']),('21.0',['21.1']),('22.1',['22.2']),('23.0',['23.1']),('23.3',['23.4']),('24.4',['24.5']),('25.1',['25.2','25.3','25.4']),('26.1',['26.2']),('28.0',['28.1','28.2','28.3']),('29.1',['29.2','29.3']),('30.2',[])]
for parent,children in sequences:
 for existing in [o for o in ops if o['id']=='q-expanded-'+parent.split('.')[0].zfill(2)+'-'+parent.split('.')[1]]:
  existing['append']=[]
  for child in children:
   op(child,existing['node']);existing['append'].append(ops.pop())
# Special original end replacements.
a=byday[8]['stages'][1]['tail'];i=a.index('你想了想他今晚埋头写作业的样子。');a[i:]=[clean(x) for x in extra8 if not editorial(x)]
# Day22 owner's permission supersedes the original secret borrowing.
a=byday[22]['stages'][0]['choices'][0]['lines'];a[:]=[x.replace('嘱咐他别趁假期动自己那盒巫师棋。','笑着说那枚国王可以借他到开学。').replace('池昌民：他还没发现，少了一枚国王。','池昌民：他昨天还问我，那枚国王在我这里过得怎么样。') for x in a]
byday[15]['stages'][1]['time']='19:20'
byday[18]['stages'][1]['time']='18:45'
byday[19]['stages'][1]['time']='14:30'
byday[30]['stages'][1]['time']='16:20'
a=byday[22]['stages'][0]['choices'][0]['lines'];a.extend(['室友：记得开学以后还给我！','池昌民笑着朝他挥了挥手。'])
# Updated original end-of-day time used by map and close-scene UI.
lastTimes={1:'18:10',4:'17:10',5:'15:40',7:'18:00',9:'18:00',10:'17:10',13:'16:10',15:'20:00',16:'17:00',18:'19:10',19:'16:30',20:'18:10',21:'19:30',22:'12:00',23:'16:30',24:'22:30',25:'16:00',26:'10:30',27:'17:30',28:'17:30',29:'21:00',30:'17:00'}
for d,t in lastTimes.items():
 if d in byday:byday[d]['stages'][-1]['endTime']=t
# Day31 exact revised lover ending and common variants.
t=(ROOT/'story-archive/q-day31-approved.md').read_text();s=byday[31]['stages']
s[0]['opening'][-1]='池昌民：还有十几分钟就到新年了。';s[0]['choices'][0]['label']='那我们一起在这里等新年吧。';s[0]['choices'][0]['lines'][:2]=['你：那我们一起在这里等新年吧。','池昌民：好啊。']
v=s[1]['openingVariant'];v['accepted']='\n'.join(clean(x) for x in t.split('### 条件一：')[1].split('\n',1)[1].split('### 条件二：')[0].strip().splitlines());v['otherwise']='\n'.join(clean(x) for x in t.split('### 条件二：')[1].split('\n',1)[1].split('### 汇合')[0].strip().splitlines())
endings['together']['lines']=[clean(x.strip()) for x in t.split('窗外的烟花渐渐散去')[1].split('## 保留事项')[0].splitlines() if x.strip()];endings['together']['lines'][0]='窗外的烟花渐渐散去'+endings['together']['lines'][0]
# Additional zero-date Christmas midnight mail runs next morning, without a second day transition.
mid=blocks['24.6'];mid['rows']=[x for x in mid['rows'] if not x.startswith('原短笺保留')];op('24.6',p(25),None,'start');ops[-1]['day']=25;ops[-1]['time']='00:00';ops[-1]['channel']='mail';ops[-1]['place']='猫头鹰信箱'
midnight=ops.pop();ops.insert(next(i for i,o in enumerate(ops) if o['id']=='q-expanded-25-0'),midnight)
# External match intro/pub flows are exported for the existing shared match modal.
matchIntro=parse_rows(blocks['12.0']['rows'],'12.0');matchPub=parse_rows(blocks['12.4']['rows'],'12.4')
# No player's drink is invented: the existing authored cup belongs to Q.
# Track every source block; unused blocks indicate an integration omission.
used={o['source']+':'+str(o['line']) for o in ops}
for o in ops:
 for a in o.get('append',[]):used.add(a['source']+':'+str(a['line']))
used.update(blocks[k]['source']+':'+str(blocks[k]['line']) for k in ['12.0','12.4'])
assert all(b['source']+':'+str(b['line']) in used for b in blocks.values()),[k for k,b in blocks.items() if b['source']+':'+str(b['line']) not in used]
output={'version':1,'story':story,'days':days,'endings':endings,'owlpost':owl,'operations':ops,'matchIntro':matchIntro,'matchPub':matchPub,'coverage':{'blocks':len(blocks),'integrated':len(used)},'scoring':'New additions award zero; all original choice increments and 100/80 gates are retained.'}
path=ROOT/'stories/q-expanded.json';data=json.dumps(output,ensure_ascii=False,indent=2)+'\n'
if '--check' in sys.argv:
 assert path.exists() and path.read_text()==data,'Q compiled data stale'
else:path.write_text(data)
print(f'Q expansion: {len(blocks)} anchored blocks compiled')
