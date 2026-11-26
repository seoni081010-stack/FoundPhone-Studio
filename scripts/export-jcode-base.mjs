import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
const names=['01-03','04-06','07-10','11-13','14-16','17-18','19-20','21-31-complete'].map(x=>`story-archive/jcode-day${x}.md`);
const sources=Object.fromEntries(names.map(p=>[p,readFileSync(p,'utf8')]));
let code=readFileSync('src/runtime/jcodeStory.ts','utf8');code=code.replace(/const sources = import\.meta\.glob[^\n]+;/,`const sources = ${JSON.stringify(sources)};`);
const out=await build({stdin:{contents:code,resolveDir:process.cwd()+'/src/runtime',loader:'ts'},bundle:true,format:'esm',write:false,platform:'node'});
const {jcodeDays,jcodeEndings}=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
process.stdout.write(JSON.stringify({days:jcodeDays,endings:jcodeEndings}));
