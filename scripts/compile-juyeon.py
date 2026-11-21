"""Compile only the approved Juyeon final manuscripts, retaining every authored line and source location."""
import json, re, sys
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
 if not s or s.startswith(('#','---','>')) or META.match(s):return None
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
   if self.day==12 and self.time=='10:35':self.place='魁地奇球场上空'
   if self.day==31 and '黑湖' in self.place:self.place='黑湖湖畔的大山毛榉树下'
  if not self.initial:self.initial=self.stamp()
  return True
 def parse(self):
  i=0
  while i<len(self.rows):
   s,source=self.rows[i]
   if self.stage(s):i+=1;continue
   if s.startswith('#') and '魔法相册' in s:
    self.flush();end=next((j for j in range(i+1,len(self.rows)) if self.rows[j][0].startswith('#')),len(self.rows))
    content=[row for row in self.rows[i+1:end] if row[0] and not META.match(row[0]) and row[0]!='---']
    title=content[0][0];assert title.startswith('《') and title.endswith('》'),(self.day,title)
    body=[l for row in content[1:] if (l:=parse_line(row))]
    self.add(dict(kind='clue',clue=dict(id=f'juyeon-{self.day}',title=title[1:-1],body='\n\n'.join(l['body'] for l in body),unlocked=True),sources=[content[0][1]]+[l['source'] for l in body]))
    i=end;continue
   if s.startswith('## 共同事件｜魁地奇预测'):
    self.flush();self.add(dict(kind='wager'));i+=1;continue
   m=CHOICE.fullmatch(s)
   if m:
    assert m[1]=='A',(self.day,s)
    self.flush();b=next(j for j in range(i+1,len(self.rows)) if (v:=CHOICE.fullmatch(self.rows[j][0])) and v[1]=='B')
    end=next((j for j in range(b+1,len(self.rows)) if self.rows[j][0].startswith('#')),len(self.rows))
    options=[]
    for a,z in [(i,b),(b,end)]:
     match=CHOICE.fullmatch(self.rows[a][0]);assert match
     options.append(dict(body=match[2],affinity=int(match[3] or 0),source=self.rows[a][1],lines=[l for row in self.rows[a+1:z] if (l:=parse_line(row))]))
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
for file in ['juyeon-day01-02-full.md']+[f'juyeon-day{i:02}-full.md' for i in range(3,31)]:
 content=rows(ARCHIVE/file)
 heads=[i for i,(s,_) in enumerate(content) if re.match(r'^# 李柱延 Day \d+《',s)]
 for k,a in enumerate(heads):
  section=content[a:heads[k+1] if k+1<len(heads) else len(content)]
  m=re.match(r'^# 李柱延 Day (\d+)《(.+)》$',section[0][0]);assert m
  days.append(Parser(int(m[1]),m[2],section).parse())
assert [d['day'] for d in days]==list(range(1,31))
content=rows(ARCHIVE/'juyeon-day31-full.md')
heads=[i for i,(s,_) in enumerate(content) if s.startswith('# ENDING ')]
common=content[:heads[0]]
endings={}
for k,kind in enumerate(['together','friends','unspoken']):
 part=content[heads[k]:heads[k+1] if k+1<len(heads) else len(content)]
 result=Parser(31,'新年的第一颗星',common+part).parse()
 gate=next(i for i,b in enumerate(result['beats']) if b['time']=='00:08')
 result['beats'][gate]['endingGate']=True
 last=result['beats'][-1]['lines'][-1]['body']
 assert last.startswith(('新年的第一颗','有些故事','新年的钟声')),(kind,last)
 result['ending']=dict(kind=kind,title={'together':'恋人','friends':'朋友','unspoken':'未说出口'}[kind],text=last)
 endings[kind]=result
for filename,data in [('juyeon.json',days),('juyeon-endings.json',endings)]:
 output=json.dumps(data,ensure_ascii=False,indent=2)+'\n';path=ROOT/'stories'/filename
 if '--check' in sys.argv:assert path.exists() and path.read_text()==output,f'{filename} stale; run python3 scripts/compile-juyeon.py'
 else:path.write_text(output)
print('Juyeon: verified 30 days + 3 complete independent Day 31 endings with source references')
