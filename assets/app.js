/* Money & Tenses Test — app logic. No external requests: everything is served from this folder. */

/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const attr=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)");
function rng(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0}}
function shuffle(arr,seed){const r=rng(seed),a=arr.slice();for(let i=a.length-1;i>0;i--){const j=r()%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(s){
  s=String(s).toLowerCase().replace(/[’‘`´]/g,"'").replace(/[“”".,!?;:()]/g," ");
  s=s.replace(/\bwon't\b/g,"will not").replace(/\bcan't\b/g,"cannot").replace(/n't\b/g," not")
     .replace(/'ve\b/g," have").replace(/'re\b/g," are").replace(/'m\b/g," am").replace(/'ll\b/g," will");
  return s.replace(/\s+/g," ").trim();
}
const store={get(k){try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const chip=k=>`<span class="chip" style="--tc:var(${TOPICS[k].c})">${TOPICS[k].label}</span>`;
const mmss=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
let audioCtx=null;
function beep(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=880;g.gain.setValueAtTime(.18,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.6);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.6)}catch(e){}}

/* photo frame: shows img/<name>.jpg; if the file is missing, a tinted card with an icon stays visible */
const photo=(name,emoji,cls="")=>`<span class="ph ${cls}" data-emoji="${emoji||""}"><img src="img/${name}.jpg" alt="" loading="lazy" decoding="async"></span>`;
document.addEventListener("error",e=>{if(e.target.tagName==="IMG"&&e.target.closest(".ph"))e.target.closest(".ph").classList.add("noimg")},true);
document.addEventListener("load",e=>{if(e.target.tagName==="IMG"&&e.target.closest(".ph"))e.target.closest(".ph").classList.add("loaded")},true);

/* ---------- rendering ---------- */
let CURRENT=null;
const timers={};

function makeCtx(test,ti){return{n:0,auto:[],teacher:[],id(){return `${test.id}-t${ti}-${this.n++}`},reg(r){this.auto.push(r)}}}
function gapHTML(id,ans,wide){
  const L=Math.max(...ans.map(a=>a.length)), w=L<=4?7:L<=12?14:24;
  return `<span class="gw${wide?" wide-w":""}" id="${id}-w"><input class="gap${wide?" wide":""}" id="${id}" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="width:${w}ch" aria-label="Answer"><span class="fix"></span><span class="key">${attr(ans[0])}</span></span>`;
}
function inline(text,ctx,bank){
  return text.replace(/\[\[(.+?)\]\]/g,(m,inner)=>{
    const ans=inner.split("|"), id=ctx.id();
    if(bank){
      ctx.reg({id,kind:"select",ans:ans[0]});
      const o=bank.slice().sort((a,b)=>a.localeCompare(b,"en",{sensitivity:"base"}));
      return `<span class="gw" id="${id}-w"><select class="gsel" id="${id}" aria-label="Choose a phrase"><option value="">— choose —</option>${o.map(x=>`<option value="${attr(x)}">${x}</option>`).join("")}</select><span class="fix"></span><span class="key">${attr(ans[0])}</span></span>`;
    }
    ctx.reg({id,kind:"text",ans});
    return gapHTML(id,ans,false);
  }).replace(/\{\{(.+?)\}\}/g,(m,inner)=>{
    const parts=inner.split("/"), id=ctx.id();
    const correct=parts.find(p=>p.endsWith("*")).slice(0,-1);
    const opts=shuffle(parts.map(p=>p.replace(/\*$/,"")),id);
    ctx.reg({id,kind:"select",ans:correct});
    return `<span class="gw" id="${id}-w"><select class="gsel" id="${id}" aria-label="Choose"><option value="">…</option>${opts.map(o=>`<option value="${attr(o)}">${o}</option>`).join("")}</select><span class="fix"></span><span class="key">${attr(correct)}</span></span>`;
  });
}
const blank=q=>q.replace("___",'<span class="blank" aria-label="gap">&nbsp;</span>');
const ringSVG=`<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" cx="60" cy="60" r="52"/></svg>`;

function body(t,ctx,test,ti){
  switch(t.type){
    case "gap": case "choice":
      return `<ol class="items">${t.items.map(i=>`<li>${inline(i,ctx)}</li>`).join("")}</ol>`;
    case "photogap":
      return `<ol class="pgrid">${t.cards.map((c,k)=>`<li class="pcard">${photo(c.img,c.emoji)}<div class="pcap"><span class="pn">${k+1}</span><span>${inline(c.text,ctx)}</span></div></li>`).join("")}</ol>`+
        (t.after?`<ol class="items" start="${t.cards.length+1}">${t.after.map(i=>`<li>${inline(i,ctx)}</li>`).join("")}</ol>`:"");
    case "bank":
      return `<div class="box"><span class="bl">Box</span>${t.bank.map(b=>`<span>${b}</span>`).join("")}</div>`+
        (t.dialogue
          ? `<div class="letter">${t.items.map(i=>`<p>${inline(i,ctx,t.bank)}</p>`).join("")}</div>`
          : `<ol class="items">${t.items.map(i=>`<li>${inline(i,ctx,t.bank)}</li>`).join("")}</ol>`);
    case "story":
      return `<p class="sentence">${inline(t.text,ctx)}</p>`;
    case "letter":
      return `<div class="letter"><span class="from">${t.from}</span>${t.items.map(i=>`<p>${inline(i,ctx)}</p>`).join("")}</div>`;
    case "mc":
      return `<ol class="items mc">${t.items.map(it=>{
        const id=ctx.id(), opts=shuffle(it.o,id+"x"); ctx.reg({id,kind:"radio",ans:it.o[0]});
        return `<li id="${id}-w"><span class="q">${blank(it.q)}</span><div class="opts" role="radiogroup">${opts.map((o,j)=>`<label class="opt${o===it.o[0]?" is-key":""}"><input type="radio" name="${id}" value="${attr(o)}"><span>${"abc"[j]}) ${o}</span></label>`).join("")}</div></li>`}).join("")}</ol>`;
    case "match":{
      const letters="ABCDEFGHIJ", rights=shuffle(t.pairs.map(p=>p[1]),`${test.id}-${ti}-m`);
      const left=t.pairs.map(([l,r])=>{const id=ctx.id(), L=letters[rights.indexOf(r)]; ctx.reg({id,kind:"select",ans:L});
        return `<li><div class="row"><span>${l}</span><span class="gw" id="${id}-w"><select class="gsel sm" id="${id}" aria-label="Letter"><option value="">–</option>${rights.map((_,j)=>`<option>${letters[j]}</option>`).join("")}</select><span class="fix"></span><span class="key">${L}</span></span></div></li>`}).join("");
      return `<div class="match"><ol class="items mleft">${left}</ol><ul class="mright">${rights.map((r,j)=>`<li><span class="let">${letters[j]}</span><span>${r}</span></li>`).join("")}</ul></div>`;}
    case "transform":
      return `<ol class="items tf">${t.items.map(it=>`<li><span class="orig">${it.q}</span><span class="kw">${it.key}</span><span class="stem">${inline(it.stem,ctx)}</span></li>`).join("")}</ol>`;
    case "error":
      return `<ol class="items tf err">${t.items.map(it=>{const id=ctx.id(), ans=it.full?it.a.concat([it.full]):it.a; ctx.reg({id,kind:"text",ans});
        return `<li><span class="orig">${it.q}</span><span class="stem">Correction: ${gapHTML(id,it.a.length>6?["CORRECT"]:it.a,false)}</span></li>`}).join("")}</ol>`;
    case "order":
      return `<ol class="items tf">${t.items.map(it=>{const id=ctx.id(); ctx.reg({id,kind:"text",ans:it.a});
        return `<li><div class="words">${it.w.split("/").map(w=>`<span>${w.trim()}</span>`).join("")}</div>${gapHTML(id,it.a,true)}</li>`}).join("")}</ol>`;
    case "speaking":{
      const tid=`${test.id}-t${ti}`; ctx.teacher.push({id:`${tid}-score`,max:t.max});
      const pics=t.photos?`<div class="spics n${t.photos.length}">${t.photos.map(p=>`<figure class="spic">${photo(p.img,p.emoji,"big")}<figcaption>${p.cap}</figcaption></figure>`).join("")}</div>`:"";
      return pics+(t.cards?`<div class="rcards">${t.cards.map(c=>`<div class="rcard"><b>${c.t}</b><span>${c.d}</span></div>`).join("")}</div>`:"")+
        `<ol class="prompts">${t.prompts.map(p=>`<li>${p}</li>`).join("")}</ol>
        <div class="help"><span class="bl">Useful language</span><div class="phr">${t.phrases.map(p=>`<span>${p}</span>`).join("")}</div></div>
        <div class="timers" data-timer="${tid}">
          <span class="tclock">${ringSVG}<span class="clock">${mmss(t.prep||t.talk)}</span></span>
          <span class="tbtns">
          ${t.prep?`<button class="btn small" type="button" data-start="${t.prep}">Подготовка ${mmss(t.prep)}</button>`:""}
          <button class="btn small" type="button" data-start="${t.talk}">Ответ ${mmss(t.talk)}</button>
          <button class="btn small ghost" type="button" data-stop>Стоп</button></span>
        </div>
        ${teacherMark(tid,t.max,SPEAK_RUBRIC)}`;}
    case "writing":{
      const tid=`${test.id}-t${ti}`; ctx.teacher.push({id:`${tid}-score`,max:t.max});
      return `<div class="help"><span class="bl">Include</span><ul class="prompts">${t.checklist.map(c=>`<li>${c}</li>`).join("")}</ul></div>
        <textarea class="wr" id="${tid}-text" data-min="${t.min}" data-max="${t.maxw}" placeholder="Start writing here…" aria-label="Your blog post"></textarea>
        <div class="wstat" id="${tid}-stat"></div>
        ${teacherMark(tid,t.max,t.rubric)}`;}
  }
  return "";
}
function teacherMark(tid,max,rub){
  return `<div class="tmark"><label for="${tid}-score">Оценка учителя <select id="${tid}-score"><option value="">—</option>${Array.from({length:max+1},(_,i)=>`<option value="${i}">${i}</option>`).join("")}</select> / ${max}</label><span class="rub">${rub}</span></div>`;
}
function renderTask(test,t,ti){
  const ctx=makeCtx(test,ti), inner=body(t,ctx,test,ti);
  const autoN=ctx.auto.length, tMax=ctx.teacher.reduce((s,x)=>s+x.max,0);
  CURRENT.regs[ti]={auto:ctx.auto,teacher:ctx.teacher,topics:t.topics};
  const box=t.box?`<div class="box"><span class="bl">Verbs</span>${t.box.map(b=>`<span>${b}</span>`).join("")}</div>`:"";
  return `<section class="task rv" id="${test.id}-task-${ti+1}">
    <div class="task-h"><span class="tno">${String(ti+1).padStart(2,"0")}</span>
      <div class="hd"><h3 class="task-title">${t.title}</h3><div class="chips">${t.topics.map(chip).join("")}</div></div>
      <span class="pts" id="${test.id}-pts-${ti}">${autoN?`${autoN} pts`:`${tMax} pts · учитель`}</span></div>
    <p class="instr">${t.instr}</p>
    ${t.table||""}${box}${inner}
  </section>`;
}
function totals(test){
  let a=0,tm=0;
  test.tasks.forEach((t,ti)=>{const c=makeCtx(test,ti);body(t,c,test,ti);a+=c.auto.length;tm+=c.teacher.reduce((s,x)=>s+x.max,0)});
  return {auto:a,teacher:tm};
}
function renderTabs(active){
  $("#tabs").innerHTML=TESTS.map(t=>`<a class="tab" href="#${t.hash}"${active===t.id?' aria-current="page"':""}>${t.name.replace("Variant ","V")}<span> · ${t.level}</span></a>`).join("");
}

function renderHome(){
  CURRENT=null; renderTabs(null);
  const order=["money","comp","adjprep","verbprep","simple","cont","perf","perfcont","mixed","speak","write"];
  const tot=TESTS.map(totals);
  const pills=MARQUEE.map(p=>`<span>${p}</span>`).join("");
  $("#main").innerHTML=`
  <section class="hero">
    <div class="wrap hero-in">
      <div class="hero-text">
        <p class="kicker">Проверочная работа · English B1 / B1+</p>
        <h1 class="h-anim"><span class="w">Money,</span> <span class="w"><span class="hl">comparisons</span></span> <span class="w">&amp; tenses</span></h1>
        <p class="lead">Три варианта: два для уровня B1 и один для B1+. В каждом 12–13 заданий: пропуски, выбор ответа, сопоставление, трансформации, поиск ошибок, задания по фотографиям, говорение и письмо.</p>
        <div class="hero-cta"><a class="btn primary big" href="#${TESTS[0].hash}">Начать с варианта 1</a><a class="btn big ghost" href="#topics">Темы по заданиям</a></div>
      </div>
      <div class="collage" aria-hidden="true">
        ${photo("hero-shopping","🛍️","c1")}${photo("hero-coins","🪙","c2")}${photo("hero-study","📚","c3")}
        <span class="sticker s1">worth every penny</span><span class="sticker s2">the more, the better</span>
      </div>
    </div>
    <div class="marquee" aria-hidden="true"><div class="track">${pills}${pills}</div></div>
  </section>
  <div class="wrap">
    <div class="cards">
      ${TESTS.map((t,i)=>`<a class="vcard rv" href="#${t.hash}" style="--d:${i*90}ms">
        <div class="lv"><span class="big">${t.level}</span><span class="vn">${t.name}</span></div>
        <p class="note">${t.sub}</p>
        <div class="meta"><span>${t.tasks.length} заданий</span><span>${tot[i].auto+tot[i].teacher} баллов</span><span>${t.minutes} мин</span></div>
        <span class="go">Открыть вариант <span class="arr">→</span></span></a>`).join("")}
    </div>
    <section class="section rv" id="topics">
      <h2>Какие задания проверяют каждую тему</h2>
      <div class="tablewrap"><table class="cov">
        <thead><tr><th>Тема</th>${TESTS.map(t=>`<th>${t.name} · ${t.level}</th>`).join("")}</tr></thead>
        <tbody>${order.map(k=>`<tr><td>${chip(k)}</td>${TESTS.map(t=>{const n=t.tasks.map((x,i)=>x.topics.includes(k)?i+1:0).filter(Boolean);return `<td class="n">${n.length?"№ "+n.join(", "):"—"}</td>`}).join("")}</tr>`).join("")}</tbody>
      </table></div>
    </section>
    <section class="section rv">
      <h2>Как проводить</h2>
      <ul class="how">
        <li><b>Ученик</b><span>Открывает свой вариант, пишет имя и выполняет задания. Ответы сохраняются в этом браузере, даже если закрыть вкладку.</span></li>
        <li><b>Автопроверка</b><span>Кнопка «Проверить» внизу отмечает ответы зелёным и красным, показывает правильный вариант и считает баллы по темам.</span></li>
        <li><b>Устная часть</b><span>Говорение и письмо оценивает учитель по критериям под заданием. Есть таймеры на подготовку и ответ.</span></li>
        <li><b>Режим учителя</b><span>Переключатель вверху показывает ключи прямо в заданиях. Удобно для разбора работы на уроке.</span></li>
      </ul>
    </section>
    <p class="foot">Сокращённые формы (I've, isn't, won't) засчитываются наравне с полными. Регистр и знаки препинания не важны.</p>
  </div>`;
}

function renderTest(test){
  stopAllTimers();
  CURRENT={test,regs:[]}; renderTabs(test.id);
  const tasksHTML=test.tasks.map((t,ti)=>renderTask(test,t,ti)).join("");
  const tot=CURRENT.regs.reduce((s,r)=>({a:s.a+r.auto.length,t:s.t+r.teacher.reduce((x,y)=>x+y.max,0)}),{a:0,t:0});
  $("#main").innerHTML=`
  <div class="wrap">
    <div class="vhead">
      <div class="ttl"><p class="kicker">${test.level} · ${test.name} · ${test.tasks.length} заданий · ${tot.a+tot.t} баллов</p>
        <h1 class="h-anim"><span class="w">${test.name}</span> <span class="w"><span class="hl">${test.level}</span></span></h1><p class="sub">${test.sub}</p></div>
      <div class="stud">
        <label class="field" for="${test.id}-student">Имя ученика<input id="${test.id}-student" type="text" placeholder="Name, class" autocomplete="off"></label>
        <div class="ttimer" data-timer="${test.id}-whole"><span class="tclock sm">${ringSVG}<span class="clock">${mmss(test.minutes*60)}</span></span><button class="btn small" type="button" data-start="${test.minutes*60}">Старт</button><button class="btn small ghost" type="button" data-stop>Стоп</button></div>
      </div>
    </div>
    <div class="progress" aria-hidden="true"><span id="prog"></span></div>
    <div class="layout">
      <nav class="toc" aria-label="Задания"><ol>${test.tasks.map((t,ti)=>`<li><a href="#${test.hash}" data-jump="${test.id}-task-${ti+1}"><span class="nn">${String(ti+1).padStart(2,"0")}</span><span class="tt">${t.title.replace(/^(Speaking|Writing): /,"$1 · ")}</span><span class="ns" id="${test.id}-ns-${ti}"></span></a></li>`).join("")}</ol></nav>
      <div class="tasks">${tasksHTML}<section class="result" id="result" hidden></section></div>
    </div>
  </div>
  <div class="bar"><div class="wrap">
    <button class="btn primary" type="button" id="check">Проверить ответы</button>
    <button class="btn" type="button" id="reset">Очистить</button>
    <span class="score" id="score">Автопроверка: ${tot.a} · Учитель: ${tot.t}</span>
  </div></div>`;
  restore(test); updateWriting(); updateProgress();
}

/* ---------- state ---------- */
function fields(){return $$("#main input, #main select, #main textarea")}
function save(){
  if(!CURRENT)return; const vals={};
  fields().forEach(el=>{if(el.type==="radio"){if(el.checked)vals[el.name]=el.value}else if(el.id)vals[el.id]=el.value});
  store.set("mtt-"+CURRENT.test.id,vals);
}
function restore(test){
  const vals=store.get("mtt-"+test.id)||{};
  for(const [k,v] of Object.entries(vals)){
    const el=document.getElementById(k);
    if(el&&el.type!=="radio")el.value=v; else $$("input[type=radio]").forEach(r=>{if(r.name===k&&r.value===v)r.checked=true});
  }
}
function val(r){if(r.kind==="radio"){const c=$$("input[type=radio]").find(x=>x.name===r.id&&x.checked);return c?c.value:""}const el=document.getElementById(r.id);return el?el.value:""}
function isOk(r,v){if(!String(v).trim())return false;if(r.kind==="text")return r.ans.some(a=>norm(a)===norm(v));return v===r.ans}
function updateProgress(){
  if(!CURRENT)return; let n=0,f=0;
  CURRENT.regs.forEach(r=>r.auto.forEach(x=>{n++;if(String(val(x)).trim())f++}));
  const p=$("#prog"); if(p)p.style.width=(n?f/n*100:0)+"%";
}

/* ---------- checking ---------- */
function check(){
  const {test,regs}=CURRENT; let A=0,AG=0,T=0,TG=0,TS=0,tMissing=0,k=0; const topic={};
  regs.forEach((r,ti)=>{
    let g=0;
    r.auto.forEach(x=>{
      const v=val(x), ok=isOk(x,v); if(ok)g++;
      const w=document.getElementById(x.id+"-w"); if(!w)return;
      if(x.kind==="radio"){
        $$(".opt",w).forEach(o=>{const inp=$("input",o);o.classList.toggle("right",inp.value===x.ans);o.classList.toggle("wrong",inp.checked&&inp.value!==x.ans)});
      }else{
        w.classList.remove("ok","bad"); void w.offsetWidth;
        w.style.setProperty("--d",Math.min(k++*18,900)+"ms");
        w.classList.add(ok?"ok":"bad");
        $(".fix",w).textContent=ok?"":"→ "+(x.ans[0]===OK_WORDS[0]?"CORRECT":(Array.isArray(x.ans)?x.ans[0]:x.ans));
      }
    });
    let tg=0,tm=0;
    r.teacher.forEach(x=>{tm+=x.max;const v=document.getElementById(x.id).value;if(v==="")tMissing++;else tg+=+v});
    A+=r.auto.length;AG+=g;T+=tm;TG+=tg;
    const n=r.auto.length, ns=document.getElementById(`${test.id}-ns-${ti}`), pe=document.getElementById(`${test.id}-pts-${ti}`);
    if(n){ns.textContent=`${g}/${n}`;ns.className="ns "+(g/n>=.7?"good":g/n<.5?"weak":"");pe.textContent=`${g} / ${n} pts`;pe.classList.add("got")}
    else{ns.textContent=tm&&document.getElementById(r.teacher[0].id).value!==""?`${tg}/${tm}`:"—";ns.className="ns"}
    const sm=r.teacher.filter(x=>document.getElementById(x.id).value!=="").reduce((s,x)=>s+x.max,0); TS+=sm;
    r.topics.forEach(key=>{
      const oral=key==="speak"||key==="write";
      if(n&&!oral){topic[key]=topic[key]||{g:0,m:0};topic[key].g+=g;topic[key].m+=n}
      if(!n&&oral&&sm){topic[key]=topic[key]||{g:0,m:0};topic[key].g+=tg;topic[key].m+=sm}
    });
  });
  const max=A+TS, got=AG+TG, pc=max?Math.round(got/max*100):0;
  const grade=pc>=86?"5":pc>=70?"4":pc>=50?"3":"2";
  const gradeTxt={"5":"отлично","4":"хорошо","3":"удовлетворительно","2":"нужно повторить"}[grade];
  const sc=$("#score"); sc.innerHTML=`Автопроверка: <b>${AG}/${A}</b> · Учитель: <b>${TG}/${T}</b> · Итого: <b>${pc}%</b>`;
  sc.classList.remove("bump"); void sc.offsetWidth; sc.classList.add("bump");
  const name=$(`#${test.id}-student`).value.trim();
  const res=$("#result"); res.hidden=false;
  res.innerHTML=`<div class="res-top">
      <div class="dial">${ringSVG}<div class="dial-in"><b id="pcnum">0</b><small>%</small></div></div>
      <div class="res-side">
        <small>Результат${name?" · "+attr(name):""}</small>
        <div class="grade g${grade}"><b>${grade}</b><span>${gradeTxt}</span></div>
        <div class="res-nums"><span>Автопроверка: ${AG} / ${A}</span><span>Говорение и письмо: ${TG} / ${T}</span><span>Итого: ${got} / ${max}${tMissing?` (без ${tMissing} неоценённых)`:""}</span></div>
      </div>
    </div>
    ${tMissing?`<p class="note">Устная часть и письмо ещё не оценены: процент посчитан только по оценённым заданиям. Выставьте баллы в заданиях и нажмите «Проверить» ещё раз.</p>`:""}
    <div class="bytopic"><h3 class="task-title">По темам</h3>
    <ul class="tbars">${Object.entries(topic).filter(([,v])=>v.m).map(([key,v],i)=>{const p=Math.round(v.g/v.m*100);return `<li style="--tc:var(${TOPICS[key].c})"><span>${TOPICS[key].label}</span><span class="track"><span class="fill" data-w="${p}" style="--i:${i}"></span></span><span class="v">${v.g}/${v.m} · ${p}%</span></li>`}).join("")}</ul></div>`;
  res.scrollIntoView({behavior:REDUCED.matches?"auto":"smooth",block:"start"});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const fg=$(".dial .ring-fg",res); fg.style.strokeDashoffset=String(326.73*(1-pc/100));
    $$(".fill",res).forEach(f=>f.style.width=f.dataset.w+"%");
    countUp($("#pcnum"),pc,REDUCED.matches?0:1400);
    if(pc>=70&&!REDUCED.matches)setTimeout(()=>confetti(pc>=86?220:120),700);
  }));
}
function countUp(el,to,ms){
  if(!ms){el.textContent=to;return}
  const t0=performance.now();
  const step=t=>{const p=Math.min((t-t0)/ms,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}
function confetti(n){
  const c=document.createElement("canvas"); c.className="confetti"; document.body.appendChild(c);
  const x=c.getContext("2d"), dpr=Math.min(devicePixelRatio||1,2);
  const W=c.width=innerWidth*dpr, H=c.height=innerHeight*dpr;
  const cols=["#2443C4","#FFD23F","#13A36E","#E8436A","#8FA6FF","#FF8A3D"];
  const ps=Array.from({length:n},()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.55,vx:(Math.random()-.5)*16*dpr,vy:(-Math.random()*18-8)*dpr,r:(4+Math.random()*5)*dpr,a:Math.random()*6,va:(Math.random()-.5)*.3,c:cols[n%7===0?0:Math.floor(Math.random()*cols.length)],s:Math.random()<.5}));
  const t0=performance.now();
  (function f(t){
    x.clearRect(0,0,W,H);
    ps.forEach(p=>{p.vy+=.45*dpr;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;
      if(p.s)x.fillRect(-p.r,-p.r/2,p.r*2,p.r);else{x.beginPath();x.arc(0,0,p.r*.7,0,7);x.fill()}x.restore()});
    if(t-t0<3200)requestAnimationFrame(f);else c.remove();
  })(t0);
}

let resetArmed=null;
function reset(btn){
  if(!resetArmed){btn.textContent="Точно очистить? Нажмите ещё раз";btn.classList.add("warn");resetArmed=setTimeout(()=>{resetArmed=null;btn.textContent="Очистить";btn.classList.remove("warn")},3500);return}
  clearTimeout(resetArmed);resetArmed=null;
  store.del("mtt-"+CURRENT.test.id); go(()=>{renderTest(CURRENT.test);afterRender()});
}

/* ---------- timers with a progress ring ---------- */
function stopAllTimers(){for(const k in timers){clearInterval(timers[k]);delete timers[k]}}
function startTimer(group,sec){
  const key=group.dataset.timer, clock=$(".clock",group), fg=$(".ring-fg",group);
  clearInterval(timers[key]); let left=sec;
  const paint=()=>{clock.textContent=mmss(Math.max(left,0));fg.style.strokeDashoffset=String(326.73*(1-left/sec))};
  group.classList.remove("done"); group.classList.add("running"); paint();
  timers[key]=setInterval(()=>{left--;paint();if(left<=0){clearInterval(timers[key]);delete timers[key];group.classList.remove("running");group.classList.add("done");beep()}},1000);
}

/* ---------- writing helper ---------- */
const MONEY_RE=[/worth every penny/,/impulse (purchase|buy)/,/sav(e|es|ed|ing) up/,/waste of money/,/value for money/,/second thoughts/,/treat(s|ed|ing)? (myself|yourself|himself|herself|ourselves|themselves)/,/splash(es|ed|ing)? out/];
const COMP_RE=[/\bas \w+ as\b/,/\bthe same as\b/,/\bthe (more|less|\w+er)\b[^.!?]*\bthe (more|less|\w+er)\b/];
function updateWriting(){
  $$("textarea.wr").forEach(ta=>{
    const txt=ta.value.toLowerCase(), words=(ta.value.trim().match(/\S+/g)||[]).length, mn=+ta.dataset.min, mx=+ta.dataset.max;
    const m=MONEY_RE.filter(r=>r.test(txt)).length, c=COMP_RE.some(r=>r.test(txt));
    document.getElementById(ta.id.replace("-text","-stat")).innerHTML=`<span>Слов: <b class="${words>=mn&&words<=mx?"y":""}">${words}</b> / ${mn}–${mx}</span><span>Фраз про деньги: <b class="${m>=3?"y":""}">${m}</b> / 3</span><span>Сравнение: <b class="${c?"y":""}">${c?"есть":"нет"}</b></span>`;
  });
}

/* ---------- motion: reveal on scroll, page transitions, lightbox ---------- */
let io=null;
function afterRender(){
  if(io)io.disconnect();
  const items=$$(".rv");
  if(REDUCED.matches||!("IntersectionObserver" in window)){items.forEach(e=>e.classList.add("in"));return}
  io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{rootMargin:"0px 0px -8% 0px",threshold:.04});
  items.forEach(e=>io.observe(e));
}
function go(render){
  if(document.startViewTransition&&!REDUCED.matches){document.startViewTransition(()=>{render();window.scrollTo(0,0)})}
  else{render();window.scrollTo(0,0)}
}
function openLightbox(img){
  const lb=document.createElement("div"); lb.className="lightbox";
  lb.innerHTML=`<img src="${img.currentSrc||img.src}" alt=""><button class="lb-x" type="button" aria-label="Закрыть">×</button>`;
  document.body.appendChild(lb); requestAnimationFrame(()=>lb.classList.add("open"));
  const close=()=>{lb.classList.remove("open");setTimeout(()=>lb.remove(),280);document.removeEventListener("keydown",esc)};
  const esc=e=>{if(e.key==="Escape")close()};
  lb.addEventListener("click",close); document.addEventListener("keydown",esc);
}

/* ---------- events ---------- */
document.addEventListener("input",e=>{
  const w=e.target.closest(".gw"); if(w){w.classList.remove("ok","bad");const f=$(".fix",w);if(f)f.textContent=""}
  if(e.target.matches("textarea.wr"))updateWriting();
  save(); updateProgress();
});
document.addEventListener("change",e=>{
  if(e.target.type==="radio"){const li=e.target.closest("li");if(li)$$(".opt",li).forEach(o=>o.classList.remove("right","wrong"))}
  if(e.target.id==="teacher-toggle"){document.body.classList.toggle("teacher",e.target.checked);store.set("mtt-teacher",e.target.checked);return}
  save(); updateProgress();
});
document.addEventListener("click",e=>{
  const im=e.target.closest(".ph.loaded img"); if(im){openLightbox(im);return}
  const j=e.target.closest("[data-jump]");
  if(j){e.preventDefault();document.getElementById(j.dataset.jump)?.scrollIntoView({behavior:REDUCED.matches?"auto":"smooth"});return}
  const b=e.target.closest("button"); if(!b)return;
  if(b.id==="check")return check();
  if(b.id==="reset")return reset(b);
  const g=b.closest("[data-timer]");
  if(g&&b.dataset.start){startTimer(g,+b.dataset.start);return}
  if(g&&b.hasAttribute("data-stop")){clearInterval(timers[g.dataset.timer]);delete timers[g.dataset.timer];g.classList.remove("running")}
});
addEventListener("scroll",()=>document.body.classList.toggle("scrolled",scrollY>8),{passive:true});

function route(){
  const h=location.hash.slice(1), t=TESTS.find(x=>x.hash===h);
  if(t){if(!CURRENT||CURRENT.test!==t)go(()=>{renderTest(t);afterRender()})}
  else if(h==="topics"&&$("#topics")){$("#topics").scrollIntoView({behavior:REDUCED.matches?"auto":"smooth"})}
  else{stopAllTimers();go(()=>{renderHome();afterRender()});if(h==="topics")setTimeout(()=>$("#topics")?.scrollIntoView(),60)}
}
window.addEventListener("hashchange",route);
document.documentElement.classList.add("js");
if(store.get("mtt-teacher")){$("#teacher-toggle").checked=true;document.body.classList.add("teacher")}
route();
