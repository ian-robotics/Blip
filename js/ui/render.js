import { fullnessOf, DAILY_FULLNESS_GOAL } from '../domain/fullness.js';
import { taskReward } from '../domain/rewards.js';
import { BADGES, DAYS } from '../config/game.js?v=daily-demo-1';
import { levelOf, nextOf, petName, todayIdx } from '../domain/progression.js?v=daily-demo-1';
import { $, esc } from './dom.js';
import { sprite } from './sprites.js';

export function render(S, { readOnly = false, currentState = S } = {}){
  const L=levelOf(S.xp),N=nextOf(L);
  const fullness=fullnessOf(S);
  // Snapshots do not store the name, so always read it from the live state.
  const name=petName(currentState);
  $("logoSprite").innerHTML=sprite(L.form,5,{},S.color);
  const pct=N?((S.xp-L.xp)/(N.xp-L.xp))*100:100;
  $("hudPet").innerHTML=energyPet(L.form, S.color, fullness, readOnly);
  $("hudLv").textContent="LV "+L.lv;
  $("hudName").textContent=name+" · "+L.name;
  $("hudBar").style.width=pct+"%";
  $("hudXp").textContent=N?`${S.xp} / ${N.xp} XP`:`${S.xp} XP · max level`;
  $("hudStreak").innerHTML=sprite("flame",3,{X:"var(--accent)",o:"var(--gold)"})+" "+S.streak;
  $("dayLabel").textContent="Day "+S.day+" · "+DAYS[todayIdx(S)];

  const list=$("taskList");
  if(!S.tasks.length){list.innerHTML=`<li class="empty">${readOnly ? "No tasks saved for this day." : "No tasks yet. Tap the red button and say what you need to do."}</li>`;}
  else list.innerHTML=S.tasks.map(t=>`<li class="task${t.done?" done":""}" data-id="${t.id}">
    <button class="chk" data-act="done" ${readOnly ? 'disabled' : ''} aria-label="${t.done ? "Undo" : "Complete"} ${esc(t.title)}"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" stroke-width="2.5"><path d="M2 7l3.5 3.5L12 3"/></svg></button>
    <div class="t-body"><div class="t-title">${esc(t.title)}</div><div class="chips"><span class="chip ${t.prio}">Urgency: ${t.prio}</span>${t.rewardVersion === 2 ? `<span class="chip">Difficulty: ${esc(t.difficulty)}</span>` : ""}${t.time?`<span class="chip">${esc(t.time)}</span>`:""}</div></div>
    ${t.rewardVersion === 'dev'
      ? `<button type="button" class="xpv debug-xp" data-act="xp" ${readOnly ? 'disabled' : ''} aria-label="Edit debug task XP">+${taskReward(t)} ✎</button>`
      : `<span class="xpv">+${taskReward(t)}</span>`}
    <button class="del" data-act="del" ${readOnly ? 'disabled' : ''} aria-label="Delete ${esc(t.title)}">×</button></li>`).join("");

  // Blip tab
  $("bigPet").innerHTML=energyPet(L.form, S.color, fullness, readOnly);
  $('foodCount').textContent=`🍗 ${S.food ?? 0} drumstick${(S.food ?? 0) === 1 ? '' : 's'}`;
  $('feedPet').disabled=readOnly || !(S.food > 0);
  $('feedPet').textContent=readOnly ? 'History · read only' : S.food > 0 ? 'Feed 🍗' : 'Complete a task for 🍗';
  $("fullnessCount").textContent=`${fullness.count} / ${DAILY_FULLNESS_GOAL}`;
  $("fullnessFill").style.width=`${fullness.progress}%`;
  $("fullnessNote").textContent=fullness.count >= DAILY_FULLNESS_GOAL
    ? (fullness.count >= 12 ? 'Royal Blip! Crown, throne & royal banners.' : fullness.count >= 8 ? 'Throne unlocked! Next: royal banners at 12.' : 'Crown unlocked! Next: throne at 8.')
    : (fullness.count >= 3 ? 'Scepter unlocked! Next: crown at 5.' : 'Feed 3 drumsticks to unlock a scepter. Independent of XP.');
  $("stageLv").textContent="LV "+L.lv;
  $("stageName").textContent=name+" · "+L.name;
  $("renameBtn").hidden=readOnly;
  if(readOnly)$("renameForm").hidden=true;
  const doneToday=S.tasks.filter(t=>t.done).length;
  $("stageMood").textContent=doneToday?`${name} is happy. You finished ${doneToday} task${doneToday>1?"s":""} today.`:`${name} is waiting for you to finish something today.`;
  $("stageBar").style.width=pct+"%";
  $("stageXp").textContent=N?`${N.xp-S.xp} XP until level ${N.lv}`:"Max level reached";
  $("sDone").textContent=S.doneTotal;$("sStreak").textContent=S.streak;$("sXp").textContent=S.xp;
  // Keep the whole unlocked week navigable while displaying an older snapshot.
  $("week").innerHTML=DAYS.map((label,index)=>{
    const day=index+1;
    const current=day===currentState.day;
    const available=current || currentState.history?.some(snapshot=>snapshot.day===day);
    const description=current ? "current progress" : available ? "saved snapshot" : "not available";
    return `<button type="button" class="week-day" data-day="${day}"
      ${available ? "" : "disabled"} aria-label="Day ${day}, ${label}, ${description}"
      aria-pressed="${day===S.day}"><span class="week-square ${currentState.week[index]?"on":""} ${current?"today":""}" aria-hidden="true"></span>${label}</button>`;
  }).join("");
  $("badges").innerHTML=BADGES.map(b=>`<div class="badge${S.badges.includes(b.id)?" got":""}"><span class="ico">${b.ico}</span><span><b>${b.name}</b><small>${b.desc}</small></span></div>`).join("");
  $("badgeCount").textContent=`${S.badges.length} of ${BADGES.length}`;

}

function energyPet(form, color, fullness, readOnly) {
  return `<div class="energy-pet fullness-${fullness.tier}${fullness.count >= 12 ? ' energy-royal' : ''}${readOnly ? ' energy-static' : ''}">
    <span class="royal-rays" aria-hidden="true"></span>
    <span class="royal-banner banner-left" aria-hidden="true"></span>
    <span class="royal-banner banner-right" aria-hidden="true"></span>
    <span class="royal-throne" aria-hidden="true"><i class="throne-back"></i><i class="throne-seat"></i><i class="throne-arm arm-left"></i><i class="throne-arm arm-right"></i><i class="throne-base"></i></span>
    <span class="energy-aura" aria-hidden="true"></span>
    <span class="energy-ring ring-one" aria-hidden="true"></span>
    <span class="energy-ring ring-two" aria-hidden="true"></span>
    <span class="energy-particles" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--i:${i};--y:${20 + (i % 3)*24}%"></i>`).join('')}</span>
    <span class="energy-wave" aria-hidden="true"></span>
    <span class="energy-body"><span class="royal-scepter" aria-hidden="true"><i></i></span><span class="royal-crown" aria-hidden="true"><i></i></span>${sprite(form,form==="pod"?11:9,{},color)}</span>
    <span class="energy-gain" aria-hidden="true">🍗 +1</span>
  </div>`;
}
