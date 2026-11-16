"""Compile only the eight approved finale documents; earlier route data stays intact."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
archive = root / 'story-archive'

def tidy(row):
    return re.sub(r'^\*\*(.*?)\*\*', r'\1', row.strip())

def lines(rows):
    result = []
    for row in rows:
        text = tidy(row)
        if not text or text.startswith(('#', '>', '【旁白】', '固定回复', '玩家固定回复', '魔法相册：', '连续性', 'END·', '触发提示')):
            continue
        match = re.fullmatch(r'(金泳勋|你)：「(.*)」', text)
        result.append(dict(speaker=match[1], body=match[2]) if match else dict(body=text.strip('*')))
    return result

def mail(rows, day):
    time = re.search(r'\d+:\d+', rows[0])[0]
    text = '\n'.join(rows[1:])
    parts = re.split(r'^(?:### 玩家回复选择\n)?\*\*(?:玩家回复)?[AB]\*\*\s*$|^(?:### 后续通信|\*\*后续通信\*\*)\s*$', text, flags=re.M)
    assert len(parts) == 4, day
    def bubbles(text):
        result = []
        pending = []
        def flush():
            if pending:
                result.append(dict(speaker='金泳勋', body='\n'.join(pending)))
                pending.clear()
        for row in text.splitlines():
            row = tidy(row)
            if not row or row == '金泳勋：':
                continue
            if row.startswith(('魔法相册：', '连续性')):
                break
            if row.startswith(('固定回复', '玩家固定回复')):
                flush()
                continue
            parsed = lines([row])
            if not parsed:
                continue
            if 'speaker' in parsed[0]:
                flush()
                result.extend(parsed)
            else:
                pending.append(parsed[0]['body'])
        flush()
        return result
    opening, a, b, tail = map(bubbles, parts)
    assert a[0]['speaker'] == b[0]['speaker'] == '你'
    return dict(kind='mail', mail=dict(day=day,time=time,opening=opening,options=[a,b],tail=tail))

def beats(rows):
    result, pending = [], []
    schedule = None
    def flush():
        parsed = lines(pending)
        if parsed:
            result.append(dict(kind='lines',lines=parsed, **(dict(schedule=schedule) if schedule else {})))
        pending.clear()
    i = 0
    while i < len(rows):
        row = tidy(rows[i])
        if re.match(r'^(?:## )?12月\d+日 · ', row):
            flush()
            schedule = row.removeprefix('## ').split('【')[0]
            i += 1
            continue
        match = re.match(r'A｜心动 \+(\d+)', row)
        if match:
            flush()
            b = next(j for j in range(i+1,len(rows)) if tidy(rows[j]).startswith('B｜心动'))
            end = next(j for j in range(b+1,len(rows)) if re.match(r'^#{2,3} 分支汇合',rows[j]))
            options = []
            for start, stop in [(i,b),(b,end)]:
                parsed = lines(rows[start+1:stop])
                reply = parsed.pop(0)
                assert reply['speaker'] == '你'
                options.append(dict(body=reply['body'],affinity=int(re.search(r'\+(\d+)', rows[start])[1]),lines=parsed))
            result.append(dict(kind='choice', options=options))
            i = end
        else:
            if not re.search(r'^12月\d+日 · ',row):
                pending.append(row)
            i += 1
    flush()
    return result

days = []
endings = {}
for day in range(25,32):
    doc = (archive / f'younghoon-day{day}-full.md').read_text()
    rows = doc.splitlines()
    title = re.search(r'Day \d+《(.*)》', rows[0])[1]
    schedule = next(tidy(r).removeprefix('## ') for r in rows if re.match(r'^(?:## )?12月\d+日 · ',r))
    _, time, place = schedule.split(' · ')
    mail_start = next(i for i,r in enumerate(rows) if r.startswith('## 猫头鹰信箱'))
    clue_start = next((i for i,r in enumerate(rows) if r.startswith('## 魔法相册')),len(rows))
    main = rows[:mail_start]
    if day == 31:
        final = next(i for i,r in enumerate(main) if r.startswith('## 最终选择'))
        ending_heads = [i for i,r in enumerate(main) if r.startswith('## END·')]
        for index, kind in enumerate(['together','friends','unspoken']):
            start = ending_heads[index]
            stop = ending_heads[index+1] if index < 2 else len(main)
            endings[kind] = dict(lines=lines(main[start+1:stop]))
        choices = [re.search(r'你：「(.*?)」',r)[1] for r in main[final:ending_heads[0]] if re.search(r'你：「',r)]
        main = main[:final]
    compiled = beats(main)
    post = mail(rows[mail_start:clue_start],day)
    if day == 31:
        # Deliver the pre-confession letter before the 23:30 observatory scene.
        split = next(i for i,r in enumerate(main) if r.startswith('## 12月31日 · 23:30'))
        compiled = beats(main[:split]) + [post] + beats(main[split:])
    else:
        compiled.append(post)
    if clue_start < len(rows):
        clue_rows = rows[clue_start+1:]
        clue_title = re.search(r'《(.*?)》','\n'.join(clue_rows))[1]
        stop = next(i for i,r in enumerate(clue_rows) if r.startswith('触发提示'))
        body = '\n'.join(tidy(r) for r in clue_rows[1:stop] if r.strip() and r != '【线索描述】')
        compiled.append(dict(kind='clue',clue=dict(id=f'younghoon-{day}',title=clue_title,body=body,unlocked=True)))
    if day == 31:
        compiled.append(dict(kind='ending'))
    days.append(dict(day=day,title=title,schedule=schedule,time=time,place=place,beats=compiled))
copy = (archive/'younghoon-ending-page-copy.md').read_text()
for kind, text in zip(endings, re.findall(r'^「(.*)」$',copy,re.M)):
    endings[kind]['text'] = text
    endings[kind]['reply'] = choices[list(endings).index(kind)]
(root/'stories/younghoon-25.json').write_text(json.dumps(days,ensure_ascii=False,indent=2)+'\n')
(root/'stories/younghoon-endings.json').write_text(json.dumps(endings,ensure_ascii=False,indent=2)+'\n')
