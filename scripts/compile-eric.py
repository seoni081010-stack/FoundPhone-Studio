"""Compile only the approved Eric final manuscripts, retaining every authored line and source location."""
import hashlib, json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'story-archive'
CHOICE=re.compile(r'^([AB])[.．、]\s*「(.*?)」(?:\s*[（(]\+(\d+)[）)])?$')
SPEECH=re.compile(r'^([^：:]{1,40})[：:]\s*「(.*)」$')
META=re.compile(r'^(?:Day \d+ (?:结束|完成)|猫头鹰信箱：|魔法相册：|本日公共剧情结束后|ENDING \d+ ·|【共享互动占位：)')

def rows(path):
 return [(s.replace('**','').strip(),dict(file=path.name,line=i+1)) for i,s in enumerate(path.read_text().splitlines())]
def parse_line(row):
 s,source=row
 if not s or s.startswith(('#','---','>','[开发标注','[游戏接入指示','角色约束：','共享世界线：','玩家与 Eloise 一同观赛。Day')) or META.match(s) or re.match(r'^Day \d+ 结束',s):return None
 s=re.sub(r'^【旁白】','',s).strip()
 if not s:return None
 if s.startswith('*') and s.endswith('*'):s=s[1:-1]
 m=SPEECH.fullmatch(s)
 return dict(speaker=re.sub(r'（(?:点击|固定回复)）','',m[1]),body=m[2],source=source) if m else dict(body=s,source=source)

class Parser:
 def __init__(self,day,title,content):
  self.day,self.title,self.rows=day,title,content
  self.time,self.place,self.channel='','','scene'
  self.beats=[];self.pending=[];self.initial=None
 def stamp(self):return dict(channel=self.channel,time=self.time,place=self.place)
 def add(self,beat):self.beats.append(dict(**beat,**self.stamp()))
 def flush(self):
  if self.pending:self.add(dict(kind='lines',lines=self.pending));self.pending=[]
 def stage(self,s):
  m=re.fullmatch(r'(?:12月\d+日｜)?(\d{1,2}:\d{2})｜(.+)',s)
  if not m:return False
  self.flush();self.time=m[1]
  if '来信' in m[2] or m[2]=='猫头鹰信箱':self.channel='mail';self.place='猫头鹰信箱'
  else:
   self.channel='scene';self.place=m[2]
   # Keep the source location verbatim.
  if not self.initial:self.initial=self.stamp()
  return True
 def parse(self):
  i=0
  while i<len(self.rows):
   s,source=self.rows[i]
   if self.stage(s):i+=1;continue
   if s.startswith('#') and '魔法相册' in s:
    self.flush();end=next((j for j in range(i+1,len(self.rows)) if self.rows[j][0].startswith('#')),len(self.rows))
    content=[row for row in self.rows[i+1:end] if row[0] and not META.match(row[0]) and row[0]!='---' and not row[0].startswith(('[开发标注','Day '))]
    title=content[0][0];assert title.startswith('《') and title.endswith('》'),(self.day,title)
    body=[l for row in content[1:] if (l:=parse_line(row))]
    self.add(dict(kind='clue',clue=dict(id=f'eric-{self.day}',title=title[1:-1],body='\n\n'.join(l['body'] for l in body),unlocked=True),sources=[content[0][1]]+[l['source'] for l in body]))
    i=end;continue
   if s.startswith('## 共享互动｜《扫帚先得意》'):
    self.flush();self.add(dict(kind='wager'));i+=1;continue
   m=CHOICE.fullmatch(s)
   if m:
    assert m[1]=='A',(self.day,s)
    self.flush();b=next(j for j in range(i+1,len(self.rows)) if (v:=CHOICE.fullmatch(self.rows[j][0])) and v[1]=='B')
    end=next((j for j in range(b+1,len(self.rows)) if self.rows[j][0].startswith('#')),len(self.rows))
    # Manuscript omissions of merge headings: source text stays unchanged.
    merge={(24,247):249,(25,32):36,(25,208):214}.get((self.day,self.rows[b][1]['line']))
    if merge: end=next(j for j in range(b+1,len(self.rows)) if self.rows[j][1]['line']==merge)
    options=[]
    for a,z in [(i,b),(b,end)]:
     match=CHOICE.fullmatch(self.rows[a][0]);assert match
     assert match[3] or (self.day==25 and source['file']=='eric-day25-full.md' and self.rows[a][1]['line'] in (103,108)),('unapproved missing affinity',self.day,self.rows[a])
     options.append(dict(body=match[2],affinity=int(match[3] or (2 if match[1]=='A' else 1)),source=self.rows[a][1],lines=[l for row in self.rows[a+1:z] if (l:=parse_line(row))]))
    self.add(dict(kind='choice',options=options));i=end;continue
   if s.startswith('#'):
    if re.match(r'^## 第.+幕',s):self.flush();self.channel='scene'
    if '猫头鹰信箱' in s:self.flush();self.channel='mail';self.place='猫头鹰信箱'
    i+=1;continue
   if re.match(r'^12月\d+日｜',s):i+=1;continue
   if (line:=parse_line(self.rows[i])):self.pending.append(line)
   i+=1
  self.flush();assert self.initial,(self.day,'missing schedule')
  if self.day==12:
   index=next(i for i,b in enumerate(self.beats) if b['time']=='11:45')
   self.beats.insert(index,dict(kind='wager-result',channel='scene',time='11:30',place='魁地奇球场看台'))
  return dict(day=self.day,title=self.title,schedule=f'12月{self.day}日 · {self.initial["time"]} · {self.initial["place"]}',time=self.initial['time'],place=self.initial['place'],beats=self.beats)

days=[]
for file in ['eric-day01-02-full.md']+[f'eric-day{i:02}-full.md' for i in range(3,31)]:
 content=rows(ARCHIVE/file)
 heads=[i for i,(s,_) in enumerate(content) if re.match(r'^# (?:孙英宰 )?Day \d+《',s)]
 for k,a in enumerate(heads):
  section=content[a:heads[k+1] if k+1<len(heads) else len(content)]
  m=re.match(r'^# (?:孙英宰 )?Day (\d+)《(.+)》$',section[0][0]);assert m
  days.append(Parser(int(m[1]),m[2],section).parse())
assert [d['day'] for d in days]==list(range(1,31))
content=rows(ARCHIVE/'eric-day31-full.md')
heads=[i for i,(s,_) in enumerate(content) if re.match(r'^# 结局[一二三]｜',s)]
common=content[:heads[0]]
endings={}
for k,kind in enumerate(['together','friends','unspoken']):
 part=content[heads[k]:heads[k+1] if k+1<len(heads) else len(content)]
 endinghead=next(i for i,(s,_) in enumerate(part) if s.startswith('## ENDING '))
 finalrow=next(row for row in part[endinghead+1:] if row[0] and not row[0].startswith('#'))
 # ENDING labels and final copy belong to the common finale UI, not dialogue.
 exclusive=part[:endinghead]+[row for row in part[endinghead+1:] if row[1]['line']>finalrow[1]['line']]
 result=Parser(31,'今年的最后一天',common+exclusive).parse()
 gate=next(i for i,b in enumerate(result['beats']) if b['kind']=='lines' and any(l['source']['line']>content[heads[k]][1]['line'] for l in b['lines']))
 # Split a pending shared block at the source boundary before locking the ending.
 beat=result['beats'][gate]; split=next(i for i,l in enumerate(beat['lines']) if l['source']['line']>content[heads[k]][1]['line'])
 if split:
  result['beats'].insert(gate,{**beat,'lines':beat['lines'][:split]})
  gate+=1;beat['lines']=beat['lines'][split:]
 result['beats'][gate]['endingGate']=True
 result['ending']=dict(kind=kind,title={'together':'金色之外','friends':'下一场比赛见','unspoken':'失之毫厘'}[kind],text=finalrow[0],source=finalrow[1])
 endings[kind]=result
# Day19: the bedside-lamp premise is true only after option 1B. Preserve the authored words.
day19=days[18]; first=next(i for i,b in enumerate(day19['beats']) if b['kind']=='choice')
for beat in day19['beats']:
 for line in beat.get('lines',[]):
  if line['body']=='刚才听你说想做一个放在床边的。':line['requiresChoice']={'key':f'19:{first}','option':1}
date=rows(ARCHIVE/'eric-date-responses.md')
responses=[re.fullmatch(r'\d+\.「(.*)」',s)[1] for s,_ in date if re.fullmatch(r'\d+\.「(.*)」',s)]
assert len(responses)==8
# Full-source coverage: every non-structural row must have a source reference.
used=set()
for day in days+list(endings.values()):
 if 'ending' in day:used.add(tuple(day['ending']['source'].values()))
 for beat in day['beats']:
  for source in beat.get('sources',[]):used.add(tuple(source.values()))
  lines=beat.get('lines',[]) if beat['kind']=='lines' else [line for option in beat['options'] for line in [option]+option['lines']] if beat['kind']=='choice' else []
  for line in lines:used.add(tuple(line['source'].values()))
manifest=[]
for path in sorted(ARCHIVE.glob('eric-*.md')):
 data=path.read_bytes();content=rows(path)
 if path.name!='eric-date-responses.md':
  for text,source in content:
   if tuple(source.values()) in used or not text or text.startswith(('#','---','[开发标注','[游戏接入指示','角色','规则','使用玩家','共享世界线','玩家与 Eloise','12月','Day ')) or re.fullmatch(r'\d{1,2}:\d{2}｜.+',text) or text=='【旁白】':continue
   raise AssertionError(('unclassified source row',source,text))
 manifest.append(dict(file=path.name,sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),lines=len(content)))
assert len(manifest)==31
scores=[dict(day=day['day'],choices=sum(beat['kind']=='choice' for beat in day['beats']),minimum=sum(min(option['affinity'] for option in beat['options']) for beat in day['beats'] if beat['kind']=='choice'),maximum=sum(max(option['affinity'] for option in beat['options']) for beat in day['beats'] if beat['kind']=='choice')) for day in days+[endings['together']]]
audit=dict(files=manifest,sourceRows=len(used),scores=scores,exceptions=['Day19 bedside-lamp premise conditional on choice 1B; authored sentence unchanged','Day24 missing common merge heading: hug and card shared after option5','Day25 option4 missing affinity: A+2/B+1 follows all other scored options; manuscript unchanged','Day25 shared farewell and castle return segmented after options2/6','Day30 deleted option6 not restored'],historicalScope='Verbatim against the 31 main-branch archive files; external historical approvals cannot independently be verified')
for filename,data in [('eric.json',days),('eric-endings.json',endings),('eric-date.json',dict(accept=responses[:4],decline=responses[4:])),('eric-source-audit.json',audit)]:
 output=json.dumps(data,ensure_ascii=False,indent=2)+'\n';path=ROOT/'stories'/filename
 if '--check' in sys.argv:assert path.exists() and path.read_text()==output,f'{filename} stale; run python3 scripts/compile-eric.py'
 else:path.write_text(output)
print('Eric: verified 30 days + 3 complete independent Day 31 endings with source references')
