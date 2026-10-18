import { XP, BADGES, DAYS } from '../config/game.js';
import { levelOf, nextOf, todayIdx } from '../domain/progression.js';
import { $, esc } from './dom.js';
import { sprite } from './sprites.js';

export function render(S){
  const L=levelOf(S.xp),N=nextOf(L);
  $("logoSprite").innerHTML=sprite(L.form,5,{},S.color);
  const pct=N?((S.xp-L.xp)/(N.xp-L.xp))*100:100;
  $("hudPet").innerHTML=sprite(L.form,L.form==="pod"?5:4,{},S.color);
  $("hudLv").textContent="LV "+L.lv;
  $("hudName").textContent="Blip · "+L.name;
  $("hudBar").style.width=pct+"%";
  $("hudXp").textContent=N?`${S.xp} / ${N.xp} XP`:`${S.xp} XP · max level`;
  $("hudStreak").innerHTML=sprite("flame",3,{X:"var(--accent)",o:"var(--gold)"})+" "+S.streak;
  $("dayLabel").textContent="Day "+S.day+" · "+DAYS[todayIdx(S)];

  const list=$("taskList");
  if(!S.tasks.length){list.innerHTML=`<li class="empty">No tasks yet. Tap the red button and say what you need to do.</li>`;}
  else list.innerHTML=S.tasks.map(t=>`<li class="task${t.done?" done":""}" data-id="${t.id}">
    <button class="chk" data-act="done" aria-label="Complete ${esc(t.title)}"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2.5"><path d="M2 7l3.5 3.5L12 3"/></svg></button>
    <div class="t-body"><div class="t-title">${esc(t.title)}</div><div class="chips"><span class="chip ${t.prio}">${t.prio}</span>${t.time?`<span class="chip">${esc(t.time)}</span>`:""}</div></div>
    <span class="xpv">+${XP[t.prio]}</span>
    <button class="del" data-act="del" aria-label="Delete ${esc(t.title)}">×</button></li>`).join("");

  // Blip tab
  $("bigPet").innerHTML=sprite(L.form,L.form==="pod"?11:9,{},S.color);
  $("stageLv").textContent="LV "+L.lv;
  $("stageName").textContent=L.name;
  const doneToday=S.tasks.filter(t=>t.done).length;
  $("stageMood").textContent=doneToday?`Blip is happy. You finished ${doneToday} task${doneToday>1?"s":""} today.`:"Blip is waiting for you to finish something today.";
  $("stageBar").style.width=pct+"%";
  $("stageXp").textContent=N?`${N.xp-S.xp} XP until level ${N.lv}`:"Max level reached";
  $("sDone").textContent=S.doneTotal;$("sStreak").textContent=S.streak;$("sXp").textContent=S.xp;
  $("week").innerHTML=DAYS.map((d,i)=>`<div><i class="${S.week[i]?"on":""} ${i===todayIdx(S)?"today":""}"></i>${d}</div>`).join("");
  $("badges").innerHTML=BADGES.map(b=>`<div class="badge${S.badges.includes(b.id)?" got":""}"><span class="ico">${b.ico}</span><span><b>${b.name}</b><small>${b.desc}</small></span></div>`).join("");
  $("badgeCount").textContent=`${S.badges.length} of ${BADGES.length}`;

}
