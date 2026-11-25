"""Compile approved Sunwoo Markdown without rewriting dialogue or narration."""
import json
import sys
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'story-archive'
CHOICE = re.compile(r'^([AB])[.．、]\s*「(.*?)」\s*[（(]\s*\+(\d+)\s*[）)]$')
SPEECH = re.compile(r'^([^：:]{1,30})[：:]\s*「(.*)」$')
META = re.compile(r'^(?:Day\s*\d+\s*(?:结束|完成|：)|关系状态：|伏笔：|魔法相册：|创作边界：|触发位置：|提示：|提示弹窗|弹窗：|相册配图要求：|仅编剧可见：|相册触发：|游戏触发：|实现要求：|插入位置：|结局[一二三]完成|这一部分是|未部署|以上是|\|)')
STOP = re.compile(r'^#{1,5} (?:实装结构检查|审核与实施要点|后续连续性|后续注意|进度与下集伏笔)')
LOCATIONS = {
    (6,'11:00'):'城堡里的茶点室', (10,'16:30'):'二楼窗边长廊',
    (12,'10:10'):'魁地奇球场看台', (12,'10:30'):'魁地奇球场看台', (12,'15:40'):'球场外的石阶',
    (17,'16:20'):'陈列室', (20,'17:30'):'霍格沃茨礼堂',
    (24,'19:20'):'霍格沃茨礼堂', (24,'20:10'):'石拱门',
    (25,'11:45'):'壁炉旁', (25,'12:15'):'圣诞树旁',
    (26,'14:50'):'霍格沃茨门厅', (28,'15:00'):'霍格沃茨空教室', (28,'15:35'):'霍格沃茨空教室',
    (29,'16:40'):'窗边的座位', (30,'16:20'):'魁地奇球场出口',
}

def tidy(row):
    return row.replace('**','').strip()

def source_rows(path):
    return [(tidy(row), {'file':path.name,'line':i+1}) for i,row in enumerate(path.read_text().splitlines())]

def line(row):
    text, origin = row
    if not text or text.startswith(('#','>','---','- ')) or META.match(text): return None
    if re.match(r'^\d{1,2}:\d{2}[｜·]',text): return None
    if re.match(r'^12月\d+日[｜ ·]',text): return None
    if text.startswith('魔法相册 · 新线索解锁') or re.match(r'^\d+｜',text): return None
    text = re.sub(r'^【(?:旁白[^】]*|修订补充[^】]*)】','',text).strip()
    if not text: return None
    match = SPEECH.fullmatch(text)
    if match:
        speaker = re.sub(r'（(?:点击|固定回复)）','',match[1])
        return {'speaker':speaker,'body':match[2],'source':origin}
    return {'body':text.removeprefix('*').removesuffix('*'),'source':origin}

class Parser:
    def __init__(self, day, title, rows):
        self.day, self.title, self.rows = day,title,rows
        self.time, self.place = ('13:30','魁地奇球场看台') if day==12 else ('23:35','霍格沃茨塔楼露台') if day==31 else ('','')
        self.channel='scene'
        self.beats=[]
        self.pending=[]
        self.initial=None
    def stamp(self): return dict(channel=self.channel,time=self.time,place=self.place)
    def add(self,beat): self.beats.append({**beat,**self.stamp()})
    def flush(self):
        if self.pending:
            self.add(dict(kind='lines',lines=self.pending)); self.pending=[]
    def find(self,start,pattern):
        return next((i for i in range(start,len(self.rows)) if re.search(pattern,self.rows[i][0])),len(self.rows))
    def stage(self,text):
        full = re.search(r'12月\d+日[｜ ·]*(\d{1,2}:\d{2})[｜ ·]*(.*)',text)
        if full:
            self.time,self.place=full.groups()
            self.place=self.place.split('｜')[0].strip()
        else:
            match = re.search(r'(\d{1,2}:\d{2})(?:[｜ ·]+(.*))?',text)
            if match:
                self.time=match[1]
                location=(match[2] or '').split('（')[0]
                if location and not location.startswith(('离开','新年','五分钟','终于','第一支','看台上的风')) and re.search(r'(室|廊|厅|堂|台|口|外|旁|下|街|街头|路|阶|摊位|角落|前|边|工作台|座位|楼梯|石拱门)$',location):
                    self.place=location
        self.place=LOCATIONS.get((self.day,self.time),self.place)
        if self.time and self.place and not self.initial:self.initial=self.stamp()
    def parse(self):
        i=0
        while i<len(self.rows):
            text,origin=self.rows[i]
            if STOP.match(text):break
            # The approved supplemental match glance belongs in the first act,
            # not after the evening letter. It is spliced in before parsing.
            if text.startswith('## 重要：赛前目光'):break
            if text.startswith('#') and '魔法相册' in text:
                self.flush()
                end=self.find(i+1,r'^#{1,5} ')
                part=self.rows[i+1:end]
                title=re.search(r'《(.*?)》',text)
                if not title:
                    title=next((re.search(r'^\d+｜(.+)',t) for t,_ in part if re.search(r'^\d+｜',t)),None)
                assert title, (self.day,text)
                body=[l for row in part if (l:=line(row))]
                self.add(dict(kind='clue',clue=dict(id=f'sunwoo-{self.day}',title=title[1],body='\n\n'.join(l['body'] for l in body),unlocked=True),sources=[l['source'] for l in body]))
                i=end;continue
            if text.startswith('#') and '韦斯莱魔法把戏坊' in text:
                self.flush();self.add(dict(kind='wager'))
                i+=1;continue
            if text.startswith('#### 竞猜分支 A'):
                self.flush()
                b=self.find(i+1,r'^#### 竞猜分支 B')
                end=self.find(b+1,r'^#{1,5} 公共')
                self.add(dict(kind='team',options=[[l for row in self.rows[a:z] if (l:=line(row))] for a,z in [(i+1,b),(b+1,end)]]))
                i=end;continue
            choice=CHOICE.fullmatch(text)
            if choice and choice[1]=='A':
                self.flush()
                b=self.find(i+1,r'^B[.．、]')
                assert b<len(self.rows),(self.day,'missing B')
                end=self.find(b+1,r'^#{1,5} ')
                options=[]
                for start,stop in [(i,b),(b,end)]:
                    match=CHOICE.fullmatch(self.rows[start][0]);assert match,(self.day,self.rows[start])
                    options.append(dict(body=match[2],affinity=int(match[3]),source=self.rows[start][1],lines=[l for row in self.rows[start+1:stop] if (l:=line(row))]))
                self.add(dict(kind='choice',options=options))
                i=end;continue
            if (text.startswith('#') or not text.startswith(('>','-'))) and ('猫头鹰信箱' in text and (text.startswith('#') or text.startswith('弹窗'))):
                self.flush();self.channel='mail'
                self.stage(text)
                i+=1;continue
            if re.search(r'^12月\d+日[｜ ·]|^#{1,4} (?:Day|第[一二三四五]幕).*\d{1,2}:\d{2}|^\d{1,2}:\d{2}[｜·]',text):
                self.flush();self.stage(text)
                i+=1;continue
            if text.startswith('#'):
                self.stage(text)
                i+=1;continue
            if (parsed:=line(self.rows[i])):self.pending.append(parsed)
            i+=1
        self.flush()
        assert self.initial,(self.day,'missing initial schedule')
        return dict(day=self.day,title=self.title,schedule=f'12月{self.day}日 · {self.initial["time"]} · {self.initial["place"]}',time=self.initial['time'],place=self.initial['place'],beats=self.beats)

def preprocess_match(rows):
    a=next(i for i,(t,_) in enumerate(rows) if t.startswith('## 重要：赛前目光'))
    b=next(i for i,(t,_) in enumerate(rows) if t.startswith('## Day 12｜魔法相册'))
    supplement=[row for row in rows[a+1:b] if not row[0].startswith(('插入位置：','实现要求：'))]
    pos=next(i for i,(t,_) in enumerate(rows) if t=='Morag：'+'「善旴看起来还挺有信心的。」')
    rows=rows[:pos]+supplement+rows[pos:a]+rows[b:]
    # The shared result card follows the authored, fixed Slytherin victory.
    pos=next(i for i,(t,_) in enumerate(rows) if t.startswith('## 第四幕'))
    return rows,pos

days=[]
for path in sorted(ARCHIVE.glob('sunwoo-day*-full.md')):
    if 'day31' in path.name:continue
    rows=source_rows(path)
    heads=[i for i,(t,_) in enumerate(rows) if re.match(r'^## Day \d+《',t)]
    sections=[rows[a:heads[j+1] if j+1<len(heads) else len(rows)] for j,a in enumerate(heads)] if heads else [rows]
    for section in sections:
        heading=section[0][0]
        match=re.search(r'Day (\d+)《(.*?)》',heading);assert match,(path,heading)
        day,title=int(match[1]),match[2]
        if day==12:section,_=preprocess_match(section)
        if day==8:
            # This common waiting paragraph follows both branches in the authored
            # text, without its own merge heading. Keep it outside option B.
            pos=next(i for i,(t,_) in enumerate(section) if t.startswith('【旁白】接下来的将近一个小时'))
            section=section[:pos]+[('### 公共信箱剧情',section[pos][1])]+section[pos:]
        result=Parser(day,title,section).parse()
        if day in [12,24]:
            clues=[beat for beat in result['beats'] if beat['kind']=='clue']
            result['beats']=[beat for beat in result['beats'] if beat['kind']!='clue']
            first_mail=next(i for i,beat in enumerate(result['beats']) if beat['channel']=='mail')
            for clue in clues:clue.update(channel='scene',time=result['beats'][first_mail-1]['time'],place=result['beats'][first_mail-1]['place'])
            result['beats'][first_mail:first_mail]=clues
        if day==12:
            index=next(i for i,beat in enumerate(result['beats']) if beat['time']=='15:40')
            result['beats'].insert(index,dict(kind='wager-result',channel='scene',time='15:30',place='魁地奇球场看台'))
        days.append(result)
assert sorted(d['day'] for d in days)==list(range(1,31)),[d['day'] for d in days]

variants={}
for kind,file,title in [('together','sunwoo-day31-lover-full.md','等你走过来'),('friends','sunwoo-day31-friends-full.md','还会一起看雪'),('unspoken','sunwoo-day31-unspoken-full.md','好像差一点')]:
    rows=source_rows(ARCHIVE/file)
    if kind!='together':rows=source_rows(ARCHIVE/'sunwoo-day31-common-full.md')+rows
    result=Parser(31,title,rows).parse()
    last=result['beats'][-1]['lines'][-1]['body']
    assert last.endswith('。') and last.startswith(('风曾','往后','那场雪')),(kind,last)
    result['beats'].append(dict(kind='clue',channel='scene',time='00:05',place='霍格沃茨塔楼露台',clue=dict(id=f'sunwoo-31-{kind}',title=title,body=last,unlocked=True)))
    result['ending']=dict(kind=kind,title=title,text=last)
    variants[kind]=result

for file, data in [('sunwoo.json', sorted(days,key=lambda d:d['day'])), ('sunwoo-endings.json',variants)]:
    output=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    target=ROOT/'stories'/file
    if '--check' in sys.argv:
        assert target.exists() and target.read_text()==output, f'{file} is stale; run python3 scripts/compile-sunwoo.py'
    else:
        target.write_text(output)
print('Sunwoo: verified 30 days + 3 complete Day 31 variants, authored branches/mail and album sources')
