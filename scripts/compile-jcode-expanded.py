"""Merge approved Jacob additions into the original route with auditable anchors."""
import copy,hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'story-archive'
NAMES=['01-05','06-10','11-15','16-20','21-25','26-30']
FILES=[f'jcode-day{x}-additions-approved.md' for x in NAMES]+['jcode-day31-approved.md']
SPEAKERS='裴俊英|你|厄尼|Eloise|Roger|李贤在|池昌民|金泳勋|一年级学生|另一个学生|学生|画像|维奥莱特|斯普劳特教授|家养小精灵|平斯夫人'
OPTION=re.compile(r'^([AB])(?:｜)?「(.*?)」\s*(?:心动\s*)?\+(\d+)\s*$')
CONDS={
 '若 Day 03 喜欢甜一点：':'sweet','若不喜欢太甜：':'!sweet','若喜欢甜一点：':'sweet',
 '若玩家给他拍照：':'photo','若一起制作两个雪人：':'snow-pair','若 Day 05 邀请唱歌：':'sing',
 '若 Day 09 约定携带照片：':'carry-photo','若玩家12号选择交换卡片：':'swap-cards',
 '若 Day 04/08 选择热巧克力：':'hot-chocolate','若此前想尝试其他热饮：':'!hot-chocolate',
}
def clean(s):return s.strip().replace('**','').strip()
def unquote(s):return s[1:-1] if s.startswith('「') and s.endswith('」') else s

def parse(rows,day,section,outer=None):
 out=[];pending=[];choice=None;branch=None;inside=[]
 time=re.search(r'\b(\d{2}:\d{2})\b',section['heading'])
 meta=dict(time=time[1] if time else None,place=None,channel='mail' if '信箱' in section['heading'] else 'scene')
 def emit(b):out.append(dict(**meta,when=list(outer or [])+inside,**b))
 def flush():
  nonlocal pending
  if pending:
   if choice is not None:choice['options'][branch]['lines'].extend(pending)
   else:emit(dict(kind='lines',lines=pending))
   pending=[]
 def finish():
  nonlocal choice,branch
  flush()
  if choice is not None:
   assert len(choice['options'])==2,(day,section['heading'],'incomplete choice')
   for opt in choice['options']:
    if not opt['body']:
     assert opt['lines'] and opt['lines'][0].get('speaker')=='你'
     opt['body']=opt['lines'].pop(0)['body']
   emit(choice);choice=None;branch=None
 for number,raw in rows:
  s=clean(raw);ref=dict(file=section['file'],line=number)
  if not s or s=='---' or s in ['【旁白】','【共同剧情】']:continue
  if s=='### 分支汇合':finish();inside=[];continue
  if re.match(r'^12月\d+日\s*·',s):continue
  if s=='猫头鹰信箱：':finish();meta['channel']='mail';continue
  if day in [2,3,8] and '信箱' in section['heading'] and s.startswith('固定回复') and choice is not None:finish()
  if s.startswith(('接原版','接回原版')):break
  if s.startswith(('若玩家12号没有选择交换卡片','不默认','不新增','记录','回收','游戏接入','接入注意','替换原版','接续原版','原版','保留原版','减少','根据','饮品选择','三张卡片','后续可添加','为24号','此段替换','20日原版','此分支','两条分支','没有新增','插入原版','原稿不改','保留','状态：','取消','后续须')):continue
  if s.startswith('使用同一'):continue
  if s in CONDS:
   finish();inside=[CONDS[s]];continue
  if s=='否则：':finish();assert len(inside)==1;inside=[inside[0][1:] if inside[0].startswith('!') else '!'+inside[0]];continue
  if s.startswith('汇合：') or s.startswith('分支汇合：') or s=='### 分支汇合':
   finish();inside=[];s=s.split('：',1)[1].strip() if '：' in s else ''
   if not s:continue
  m=OPTION.match(s) or re.match(r'^([AB])｜(?:好感度|心动)\s*\+(\d+)$',s)
  if m:
   letter=m[1]
   if letter=='A':finish();choice=dict(kind='choice',id=f'jx{day:02}:{section["number"]}:{len(out)}',options=[])
   else:flush();assert choice is not None
   body=m[2] if len(m.groups())==3 else ''
   gain=int(m[3] if len(m.groups())==3 else m[2]);branch=len(choice['options']);choice['options'].append(dict(body=body,affinity=gain,rawAffinity=gain,lines=[],source=ref));continue
  if s=='【巧克力蛙卡片选择弹窗】':finish();emit(dict(kind='trading-cards'));continue
  if s.startswith('选择：热巧克力／'):
   finish();emit(dict(kind='drink'));continue
  if s.startswith('游戏内时间推进五分钟'):
   finish();meta['time']='24:00';continue
  if s.startswith(('固定回复','固定回答')):
   s=re.sub(r'^固定(?:回复|回答)[①②③④⑤⑥⑦⑧一二三四五六七八\d]*[：:｜]\s*','',s)
   if s.startswith(('固定回复','固定回答')):continue
   pending.append(dict(speaker='你',body=unquote(s),source=ref));continue
  if s.startswith('【') or s.startswith('#') or s.startswith('END·'):continue
  m=re.match(r'^('+SPEAKERS+r')[：:]\s*(.*)$',s)
  item=dict(speaker=m[1],body=unquote(m[2]),source=ref) if m else dict(body=s,source=ref)
  if item['body']:pending.append(item)
 finish()
 return out

def read_sections():
 sections={d:[] for d in range(1,32)}
 for name in FILES[:6]:
  day=None;current=None
  for n,raw in enumerate((A/name).read_text().splitlines(),1):
   s=clean(raw)
   m=re.match(r'^## Day (\d+)',s)
   if m:day=int(m[1]);current=None;continue
   if s.startswith('### '):
    assert day
    current=dict(file=name,number=len(sections[day])+1,heading=s[4:],rows=[]);sections[day].append(current);continue
   if day==7 and current is None and s:
    current=dict(file=name,number=1,heading='仅4日给他拍照后追加照片',rows=[]);sections[day].append(current)
   if current is not None:current['rows'].append((n,raw))
 return sections

def main():
 sections=read_sections();records=[]
 for day,ss in sections.items():
  if day==31:continue
  for s in ss:
   outer=['photo'] if day==7 else ['sing'] if day==15 and '唱歌约定' in s['heading'] else ['swap-cards'] if day==18 and s['number']==2 else []
   parsed=parse(s['rows'],day,s,outer)
   records.append(dict(day=day,section=s['number'],heading=s['heading'],beats=parsed))
 print('Parsed',len(records),'approved insertion/replacement sections')
 return records

# Source-addressed merge: original paragraphs retain their stable legacy coordinates.
def compile_route():
 base=json.loads(subprocess.check_output(['node','scripts/export-jcode-base.mjs'],cwd=ROOT))
 records=main()
 sections={(r['day'],r['section']):r for r in records};used=set();events={};deleted=set();prefix={};suffix={}
 places={1:'霍格沃茨礼堂',2:'霍格沃茨温室',3:'霍格沃茨庭院',4:'霍格沃茨庭院',5:'霍格沃茨图书馆',6:'霍格沃茨庭院',7:'霍格沃茨图书馆',8:'图书馆外',9:'麻瓜研究教室',10:'霍格沃茨西侧回廊',11:'厨房外',12:'魁地奇球场',13:'霍格沃茨回廊',14:'霍格沃茨图书馆',15:'霍格沃茨厨房',16:'霍格沃茨图书馆',17:'霍格沃茨暗房',18:'霍格沃茨礼堂',19:'霍格沃茨庭院',20:'礼堂外',21:'霍格沃茨厨房',22:'霍格沃茨门厅',23:'霍格沃茨西侧回廊',24:'霍格沃茨礼堂',25:'图书馆外',26:'霍格沃茨庭院',27:'秘密花园的石亭',28:'霍格莫德街道',29:'图书馆外',30:'天文塔下的走廊'}
 special_places={(1,2):'霍格沃茨图书馆',(1,3):'霍格沃茨回廊',(2,1):'霍格沃茨礼堂',(3,1):'二楼回廊',(4,1):'霍格沃茨礼堂',(4,4):'霍格沃茨门厅',(5,1):'中央楼梯',(5,2):'霍格沃茨礼堂',(5,4):'图书馆外',(8,1):'中央楼梯',(11,1):'霍格沃茨礼堂',(12,1):'城堡前小路',(13,1):'霍格沃茨庭院',(13,2):'霍格沃茨礼堂',(14,1):'霍格沃茨礼堂',(16,1):'霍格沃茨门厅',(16,3):'图书馆外',(17,1):'霍格沃茨礼堂',(17,2):'暗房外的回廊',(18,2):'霍格沃茨回廊',(20,1):'厨房外',(21,1):'魔咒学教室外',(22,2):'霍格沃茨庭院',(23,1):'霍格沃茨礼堂',(24,2):'礼堂门口',(25,1):'公共走廊',(25,4):'霍格沃茨门厅',(26,1):'霍格沃茨礼堂',(27,1):'第三温室旁小路',(28,3):'霍格莫德村口',(29,1):'霍格沃茨礼堂',(29,2):'中央楼梯',(30,1):'礼堂外',(30,3):'空教室'}
 effects={(3,2,1):('sweet',True,False),(4,3,0):('photo',True,False),(4,4,0):('hot-chocolate',True,False),(5,3,0):('sing',True,False),(6,2,0):('snow-pair',True,False),(9,2,0):('carry-photo',True,False),(12,2,0):('swap-cards',True,False)}
 def addition(d,s):
  used.add((d,s));r=sections[(d,s)];bb=copy.deepcopy(r['beats']);n=0
  for b in bb:
   b['place']='猫头鹰信箱' if b['channel']=='mail' else special_places.get((d,s),places[d])
   if b['kind']=='choice':
    if (d,s,n) in effects:
     name,a,c=effects[d,s,n]
     for i,o in enumerate(b['options']):o['effects']={name:a if i==0 else c}
    n+=1
   b['insertion']={'day':d,'section':s}
  if d==13 and s==2:
   for i,b in enumerate(bb):
    if b['kind']=='lines':
     ix=next((j for j,l in enumerate(b['lines']) if l['body']=='你们各自低头制作着贺卡。'),None)
     if ix is not None:
      bb[i:i+1]=([dict(b,lines=b['lines'][:ix])] if ix else [])+[dict(b,kind='greeting-card',lines=[])]+[dict(b,lines=b['lines'][ix:])];break
  return bb
 def add(d,s,b=None,l=None,after=False):
  v=addition(d,s)
  if b is None:(suffix if after else prefix).setdefault(d,[]).extend(v)
  else:events.setdefault((d,b,l,after),[]).extend(v)
 def drop(d,b,a,z):
  for i in range(a,z+1):deleted.add((d,b,i))
 # Before/after each original scene, including new mailbox scenes.
 for d,s in [(1,1),(2,1),(3,1),(4,1),(5,1),(5,2),(8,1),(11,1),(13,1),(13,2),(14,1),(16,1),(17,1),(20,1),(21,1),(23,1),(24,1),(26,1),(29,1),(30,1)]:add(d,s)
 for d,s in [(2,5),(3,3),(4,5),(5,5),(6,4),(8,3),(9,3),(10,5),(11,3),(12,4),(14,4),(16,3),(17,2),(18,2),(18,3),(19,3),(22,3),(23,3),(24,4),(24,5),(25,5),(26,3),(29,3),(30,4)]:add(d,s,after=True)
 for args in [
 (1,2,2,21,True),(1,3,6,0,False),(2,2,0,36,True),(2,3,4,13,True),(2,4,4,21,True),(3,2,2,8,True),
 (4,2,2,19,True),(4,3,4,24,True),(4,4,4,58,True),(5,3,2,26,True),(5,4,2,42,True),
 (6,1,2,0,True),(6,2,4,0,False),(6,3,7,None,False),(7,1,2,0,False),
 (8,2,2,21,False),(9,1,0,9,False),(9,2,2,16,True),(10,1,0,13,True),(10,2,0,39,True),(10,3,2,0,False),(10,4,2,25,True),
 (11,2,0,15,True),(12,1,0,5,True),(12,2,5,0,False),(12,3,7,0,False),
 (13,3,2,0,False),(13,4,2,15,False),(14,2,2,3,False),
 (15,2,0,22,False),(15,1,0,22,False),(15,3,2,0,False),(15,4,2,0,False),(15,5,2,0,False),
 (16,2,0,32,True),(18,1,4,0,True),(19,1,0,34,True),(19,2,4,0,False),
 (20,2,0,27,True),(20,3,4,0,False),(21,2,2,24,True),(22,1,0,14,True),(22,2,4,43,False),
 (23,2,4,0,False),(24,2,2,0,False),(24,3,4,37,False),
 (25,1,0,13,True),(25,2,2,38,False),(25,3,2,38,False),(25,4,4,0,True),
 (26,2,2,22,True),(27,1,2,1,False),(27,2,2,61,False),(27,3,4,98,False),
 (28,1,2,24,False),(28,2,4,0,False),(28,3,4,50,False),(29,2,4,35,False),(30,2,2,0,True),(30,3,4,8,True),
 ]:add(*args)
 for d,b,a,z in [(8,2,21,47),(13,2,15,24),(14,2,3,10),(20,4,0,38),(27,4,99,117),(15,0,10,10)]:drop(d,b,a,z)
 used.add((14,3)) # Explicitly approved original-option replacement, applied below.
 missing=set(sections)-used
 assert not missing,('unmerged sections',missing)
 corrections=json.loads((ROOT/'stories/jcode-expanded-approved-adaptations.json').read_text())['baseSceneReplacements']
 days=[]
 for original in base['days'][:30]:
  d=original['day'];cur=dict(time=original['time'],place=places[d],channel='scene');out=[]
  def append(extra):
   nonlocal cur
   for b0 in extra:
    b=copy.deepcopy(b0);b['time']=b['time'] or cur['time'];cur={k:b[k] for k in ['time','place','channel']};out.append(b)
  append(prefix.get(d,[]));cur=dict(time=original['time'],place=places[d],channel='scene')
  if d==12:cur['time']='10:00';cur['place']='霍格沃茨门厅'
  for bi,old in enumerate(original['beats']):
   append(events.get((d,bi,None,False),[]))
   b=copy.deepcopy(old);b.update(cur);b.update(when=[],legacyBeat=bi,id=f'jx{d:02}:legacy:{bi}')
   if b['kind']=='lines':
    pending=[]
    def flush():
     nonlocal pending
     if pending:out.append(dict(b,**cur,lines=pending));pending=[]
    for li,line in enumerate(old['lines']):
     stage={(1,4,24):('17:00','霍格沃茨回廊'),(4,4,37):('17:30','霍格沃茨回廊'),(6,8,0):('08:45','霍格沃茨回廊'),(12,0,14):('10:20','魁地奇球场'),(12,3,13):('10:30','魁地奇球场'),(12,5,11):('15:30','魁地奇球场'),(12,7,0):('15:40','魁地奇球场'),(25,0,14):('11:45','图书馆外'),(25,2,39):('12:30','霍格沃茨礼堂'),(27,2,3):('15:15','秘密花园的石亭'),(30,2,29):('16:40','空教室')}.get((d,bi,li))
     if stage:flush();cur=dict(time=stage[0],place=stage[1],channel='scene')
     before=events.get((d,bi,li,False),[])
     if before:flush();append(before)
     if (d,bi,li) not in deleted:
      l=copy.deepcopy(line);l['legacySource']=[d,bi,li]
      if str(d) in corrections and d!=21:l['body']=corrections[str(d)].get(l['body'],l['body'])
      if d==1 and l['body']=='我是……':l['body']='我是{{playerName}}。'
      if d==19 and bi==4 and 16<=li<=24:l['when']=['asked-beg']
      if d==20 and bi==0 and 31<=li<=35:l['when']=['asked-beg']
      pending.append(l)
      if d==4 and bi==2 and li==0:pending.append(dict(body='你低头尝了一小口，热巧克力比想象中烫，赶紧停了下来。',approvedRepair='day15-temperature-memory'))
     after=events.get((d,bi,li,True),[])
     if after:flush();append(after)
    flush()
   elif b['kind']=='choice':
    for oi,opt in enumerate(b['options']):
     opt['rawAffinity']=opt.get('affinity',2 if oi==0 else 1);opt['affinity']=opt['rawAffinity']
     for line in opt['lines']:
      if str(d) in corrections and d!=21:line['body']=corrections[str(d)].get(line['body'],line['body'])
     if d==8 and bi==3 and oi==0:opt['effects']={'hot-chocolate':True}
     if d==20 and bi==1:opt['effects']={'second-cup':oi==0}
     if d==19 and bi==3:opt['effects']={'asked-beg':oi==0}
     if d==17 and bi==1:opt['effects']={'camera-lesson':oi==0}
     if d==21 and bi==3:opt['effects']={'marshmallow':oi==1}
    out.append(b)
   elif b['kind']=='team':
    for oi,ll in enumerate(b['options']):
     row=dict(b,kind='lines',lines=ll,when=['team-gryffindor' if oi==0 else '!team-gryffindor']);row.pop('options');out.append(row)
   else:out.append(b)
   append(events.get((d,bi,None,True),[]))
  if d==15:
   for ix,bb in enumerate(out):
    if bb['kind']=='lines' and any(l.get('legacySource')==[15,0,21] for l in bb['lines']):
     pos=next(j for j,l in enumerate(bb['lines']) if l.get('legacySource')==[15,0,21])+1;bb['lines'].insert(pos,dict(speaker='裴俊英',body='正好今天有空，就带你过来了。'));break
  append(suffix.get(d,[]))
  # Fill every beat's display metadata and keep textual source order intact.
  current_time=None
  for i,b in enumerate(out):
   b.setdefault('when',[]);b['when']=list(dict.fromkeys(b['when']));b.setdefault('id',f'jx{d:02}:beat:{i}')
   if b['kind']=='clue':b['place']='魔法相册'
   if d==17 and b['kind']=='clue':b['clue']['body']='一张12月6日初雪时拍下的庭院照片，角落里露出你的围巾。\n\n背面写着：\n\n「本来想拍雪。」\n\n他原本想把照片送给你，却一直没有送出。'
  presence={}
  for bb in out:
   key=(bb['time'],bb['place'],bb['channel']);ll=bb.get('lines',[])+[l for o in bb.get('options',[]) for l in o['lines']]
   physical=bb['channel']=='scene' and any(l.get('speaker')=='裴俊英' or ('裴俊英' in l['body'] and not re.search('收到|消息|纸条|想起|约好|之前|昨天',l['body'])) for l in ll)
   presence[key]=presence.get(key,False) or physical
  for bb in out:bb['jacobPresent']=presence[(bb['time'],bb['place'],bb['channel'])] and bb['kind']!='clue'
  days.append(dict(day=d,title=original['title'],time=out[0]['time'],place=out[0]['place'],schedule=f'12月{d}日 · {out[0]["time"]} · {out[0]["place"]}',beats=out))
 # Latest complete final day: a common sequence plus exactly one exclusive ending.
 raw=(A/FILES[-1]).read_text().splitlines();starts=[i for i,l in enumerate(raw) if re.match(r'^### 结局[一二三]',l)]
 assert len(starts)==3
 common=parse(list(enumerate(raw[:starts[0]],1)),31,dict(heading='20:00 霍格沃茨庭院',file=FILES[-1],number=0))
 endings={}
 for n,kind in enumerate(['together','friends','unspoken']):
  rows=list(enumerate(raw[starts[n]+1:starts[n+1] if n<2 else len(raw)],starts[n]+2));bb=copy.deepcopy(common)+parse(rows,31,dict(heading='20:00 霍格沃茨庭院',file=FILES[-1],number=n+1))
  final_beats=[];final_time='20:00';final_place='霍格沃茨庭院'
  for b in bb:
   if b['kind']=='lines':
    pending=[]
    for l in b['lines']:
     midnight=bool(re.search('新年.*钟声|钟声.*新年',l['body']))
     indoors=kind=='unspoken' and l['body']=='你们一起走回城堡。'
     if midnight or indoors:
      if pending:final_beats.append(dict(b,lines=pending,time=final_time,place=final_place));pending=[]
      if midnight:final_time='24:00'
      if indoors:final_place='中央楼梯'
     pending.append(l)
    if pending:final_beats.append(dict(b,lines=pending,time=final_time,place=final_place))
   else:final_beats.append(dict(b,time=final_time,place=final_place))
  bb=final_beats
  for i,b in enumerate(bb):b.update(jacobPresent=True,id=b.get('id',f'jx31:{kind}:{i}'))
  last=next(l['body'] for b in reversed(bb) for l in reversed(b.get('lines',[])) if not l.get('speaker'))
  endings[kind]=dict(day=31,title='由你选择的冬天',time='20:00',place='霍格沃茨庭院',schedule='12月31日 · 20:00 · 霍格沃茨庭院',beats=bb,ending=dict(id=f'jcode-{kind}',kind=kind,title='END·'+{'together':'恋人','friends':'朋友','unspoken':'未说出口'}[kind],text=last))
 # The maximum path is checked against mixed paths by the runtime regression suite.
 flags={};maximum=0
 def condition(c):return not condition(c[1:]) if c.startswith('!') else bool(flags.get(c,False))
 for day in days+[endings['together']]:
  for b in day['beats']:
   if all(condition(c) for c in b['when']) and b['kind']=='choice':
    o=b['options'][0];maximum+=o['rawAffinity'];flags.update(o.get('effects',{}))
 result=dict(days=days,endings=endings,maximumRawAffinity=maximum,sourceCommit='6ff5074dfb73926349bad9504ba11dd77027a6b6')
 # Audit every approved spoken line against the merged interactive content.
 texts=[]
 for story in days+list(endings.values()):
  for beat in story['beats']:
   texts.extend(line['body'] for line in beat.get('lines',[]))
   for option in beat.get('options',[]):
    texts.append(option['body']);texts.extend(line['body'] for line in option.get('lines',[]))
 for name in FILES:
  for number,raw_line in enumerate((A/name).read_text().splitlines(),1):
   match=re.match(r'^('+SPEAKERS+r')[：:]\s*(.*)$',clean(raw_line))
   if match:
    body=unquote(match[2].strip())
    assert not body or body in texts,(name,number,'Missing approved dialogue',body)
 manifest=json.loads((ROOT/'stories/jcode-expanded-source-manifest.json').read_text())
 for entry in manifest:
  assert hashlib.sha256((ROOT/entry['file']).read_bytes()).hexdigest()==entry['approvedSha256'],entry['file']
 target=ROOT/'stories/jcode-expanded.json';rendered=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
 if '--check' in sys.argv:assert target.exists() and target.read_text()==rendered,'Rebuild Jacob expanded story'
 else:target.write_text(rendered)
 print('Jacob: merged 30 days, 105 approved sections, 3 exclusive latest endings; raw maximum',maximum)
if __name__=='__main__':compile_route()
