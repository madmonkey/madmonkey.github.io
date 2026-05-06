const html = require('fs').readFileSync('dist/social/index.html','utf8');
const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let m, idx=0, errors=0;
while((m=scriptRe.exec(html))!==null){
  idx++;
  const code=m[1].trim();
  if(!code) continue;
  try { new Function(code); } catch(e) {
    errors++;
    console.log('Script', idx, 'ERROR:', e.message);
  }
}
if (errors === 0) console.log('All', idx, 'scripts OK');
else console.log(errors, 'script(s) with errors');
const fs = require('fs');
const html = fs.readFileSync('dist/social/index.html','utf8');
const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let m, idx=0;
let errors = 0;
while((m=scriptRe.exec(html))!==null){
  idx++;
  const code=m[1].trim();
  if(!code) continue;
  try { new Function(code); } catch(e) {
    errors++;
    console.log('Script', idx, 'ERROR:', e.message);
  }
}
if (errors === 0) console.log('All', idx, 'scripts OK');
else console.log(errors, 'script(s) with errors');

