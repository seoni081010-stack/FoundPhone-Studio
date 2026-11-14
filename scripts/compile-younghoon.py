"""Compile the approved Younghoon archive into the game's story data."""
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1])
speech = re.compile(r'^([\w ]{1,20})[：:]「(.*)」$')
score = re.compile(r'^([AB])｜(?:心动|好感度)\s*\+(\d+)$')
fixed = re.compile(r'^(?:【)?(?:玩家)?(?:唯一可点击)?固定回复[一二三四五①②③④⑤]?(?:】)?')

def clean(line):
    return re.sub(r'^\*\*(.*?)\*\*', r'\1', line.strip())

def dialogue(rows):
    result = []
    for row in rows:
        line = clean(row)
        if not line or line.startswith(('【旁白】','---','> ','#')) or fixed.fullmatch(line):
            continue
        line = fixed.sub('', line)
        match = speech.fullmatch(line)
        result.append(dict(speaker=match[1], body=match[2]) if match else dict(body=line.strip('*')))
    return result

def bubbles(rows):
    result = []
    buffer = []
    speaker = '金泳勋'
    def flush():
        if buffer:
            result.append(dict(speaker=speaker, body='\n'.join(buffer).removeprefix('「').removesuffix('」')))
            buffer.clear()
    for row in rows:
        line = clean(row)
        if not line or line == '---' or line.startswith('魔法相册：无更新'):
            continue
        line = re.sub(r'^(?:【)?玩家(?:唯一可点击|固定)回复[①②③④⑤]?(?:】|：)?\s*', '', line)
        match = re.match(r'^(金泳勋|你)：\s*(.*)',line)
        if match:
            flush()
            speaker = match[1]
            if match[2]:
                buffer.append(match[2])
                if match[2].endswith('」') or not match[2].startswith('「'):
                    flush()
        elif line.startswith(('附件｜','延续纸条','可选延续','次日可显示')):
            flush()
        else:
            buffer.append(line)
    flush()
    return result

def full_mail(rows, day, time):
    joined = '\n'.join(rows)
    pieces = re.split(r'^\*\*玩家(?:回复|选项)[AB]\*\*|^\*\*后续通信.*?\*\*$',joined,flags=re.M)
    assert len(pieces)==4, (day,time)
    opening,a,b,tail = [bubbles(x.splitlines()) for x in pieces]
    for branch in [a,b]:
        branch[0]['speaker']='你'
    return dict(day=day,time=time,opening=opening,options=[a,b],tail=tail)

def addon_mail():
    doc=(source/'younghoon-owl-mail-day01-20.md').read_text()
    for m in re.finditer(r'^## 12月(\d+)日｜([^\n]+)\n(.*?)(?=^## |\Z)',doc,re.M|re.S):
        day,title,body=m.groups()
        time=re.search(r'收到时间：(\d+:\d+)',body)[1]
        start, picks, a,b=re.split(r'^\*\*(?:回复选项|若 [AB]，金泳勋回信)\*\*$',body,flags=re.M)
        start=start.split('**金泳勋 → 你**',1)[1]
        b, *tail=re.split(r'^\*\*(?:次日可显示|可选延续|延续纸条).*?\*\*$',b,flags=re.M)
        replies=re.findall(r'^[AB]\. 你：「(.*)」$',picks,re.M)
        assert len(replies)==2, day
        yield dict(day=int(day),time=time,title=title,opening=bubbles(start.splitlines()),options=[[dict(speaker='你',body=reply),*bubbles(lines.splitlines())] for reply,lines in zip(replies,[a,b])],tail=bubbles(tail[0].splitlines()) if tail else [],nextDay=int(day)==7)

def parse(day,title,rows):
    schedule=next(re.sub(r'^#+ [^｜]+｜','',clean(r)) for r in rows if re.search(r'12月\d+日 · \d+:\d+ · ',r))
    _,time,place=schedule.split(' · ',2)
    beats=[]
    pending=[]
    def flush():
        lines=dialogue(pending)
        if lines:
            beats.append(dict(kind='lines',lines=lines))
        pending.clear()
    def find(i, pattern):
        return next((j for j in range(i,len(rows)) if re.search(pattern,clean(rows[j]))),len(rows))
    i=0
    while i<len(rows):
        line=clean(rows[i])
        if re.match(r'^## (?:互动|存档|集成|统一)',line):
            break
        if line.startswith('## 猫头鹰信箱'):
            flush()
            end=find(i+1,r'^## ')
            beats.append(dict(kind='mail',mail=full_mail(rows[i+1:end],day,re.search(r'\d+:\d+',line)[0])))
            i=end
            continue
        if re.match(r'^(?:###? )?魔法相册·线索更新',line):
            flush()
            end=find(i+1,r'^---|^## |^触发提示')
            body=[clean(r) for r in rows[i+1:end] if r.strip()]
            title_line=body.pop(0)
            clue_title=re.sub(r'^线索.｜','',title_line).strip('《》')
            beats.append(dict(kind='clue',clue=dict(id=f'younghoon-{day}',title=clue_title,body='\n'.join(x for x in body if x!='【线索描述】'),unlocked=True)))
            i=end
            continue
        if line.startswith('### 特殊互动'):
            flush()
            a=find(i+1,r'^如果玩家选择格兰芬多')
            b=find(a+1,r'^如果玩家选择斯莱特林')
            end=find(b+1,r'^### 共同剧情')
            beats.extend([dict(kind='wager'),dict(kind='team',options=[dialogue(rows[a+1:b]),dialogue(rows[b+1:end])])])
            i=end
            continue
        if line.startswith('#### 若玩家赛前选择斯莱特林'):
            flush()
            b=find(i+1,r'^#### 若玩家赛前选择格兰芬多')
            end=find(b+1,r'^### 共同结尾')
            beats.append(dict(kind='team',options=[dialogue(rows[b+1:end]),dialogue(rows[i+1:b])]))
            i=end
            continue
        if (a_score:=score.fullmatch(line)) and a_score[1]=='A':
            flush()
            b=find(i+1,r'^B｜(?:心动|好感度)')
            end=find(b+1,r'^#{2,4} |^(?:玩家)?固定回复')
            options=[]
            for start,stop in [(i,b),(b,end)]:
                choice_score=score.fullmatch(clean(rows[start]))
                lines=dialogue(rows[start+1:stop])
                reply=lines.pop(0)
                if reply['body']=='你在纸条上写：':
                    reply=dict(speaker='你',body=lines.pop(0)['body'].strip('「」'))
                    lines.insert(0,dict(body='你在纸条上写：'))
                assert reply.get('speaker')=='你',(day,reply)
                options.append(dict(body=reply['body'],affinity=int(choice_score[2]),lines=lines))
            beats.append(dict(kind='choice',options=options))
            i=end
            continue
        if line and not line.startswith(('#','>','魔法相册：无更新','触发提示')) and line!=schedule:
            pending.append(rows[i])
        i+=1
    flush()
    return dict(day=day,title=title,schedule=schedule,time=time,place=place,beats=beats)

days=[]
for path in sorted(source.glob('younghoon-day*.md')):
    doc=path.read_text()
    if '-full' in path.name:
        m=re.match(r'^# .*Day (\d+)《(.*)》\n',doc)
        days.append(parse(int(m[1]),m[2],doc[m.end():].splitlines()))
    else:
        for m in re.finditer(r'^## Day (\d+)｜([^\n]+)\n(.*?)(?=^## Day |\Z)',doc,re.M|re.S):
            days.append(parse(int(m[1]),m[2],m[3].splitlines()))
assert [d['day'] for d in days]==list(range(1,25))
for mail in addon_mail():
    days[mail['day']-1]['beats'].append(dict(kind='mail',mail=mail))
print(json.dumps(days,ensure_ascii=False,separators=(',',':')))
