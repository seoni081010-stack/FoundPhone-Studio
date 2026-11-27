import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {qLetterOnlyInPopup,qChristmasLetterText,qChristmasLetterAnchor,qChristmasLetterReturn} from './QChristmasLetter';
import {sceneParts} from './SceneDialogue';
it('shows the latest exact Q letter only in its modal and keeps separate return narration',()=>{
 expect(qChristmasLetterText).toEqual(['圣诞快乐！','希望你每天都能遇到一些有趣的事情，吃到喜欢吃的东西，晚上也能做个好梦！','新的一年，希望你们的魔药课作业都能少一点，希望霍格沃茨的楼梯不要再让我们迟到了！假期快乐，要开开心心地度过剩下的冬天哦！','Q']);
 const children=qLetterOnlyInPopup(<div data-scene-segment="original"><p className="hogwarts-narration">{qChristmasLetterAnchor}</p><p className="hogwarts-narration">圣诞快乐！</p><p className="hogwarts-narration">旧正文只应在历史稿中保留</p><p className="hogwarts-narration">昌民</p><p className="hogwarts-narration">{qChristmasLetterReturn}</p></div>);
 const html=renderToStaticMarkup(<>{children}</>);expect(html).not.toContain('旧正文');expect(html).not.toContain('圣诞快乐！');
 expect(sceneParts(children).steps.map(step=>step.text)).toEqual([qChristmasLetterAnchor,qChristmasLetterReturn]);
});
