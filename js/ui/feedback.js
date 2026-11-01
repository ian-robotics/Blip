import { $ } from './dom.js';
import { sprite } from './sprites.js';

let toastT;
export function toast(html){const t=$("toast");t.innerHTML=html;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600);}

export function levelUp(from,to,color=null,name="Blip"){
  $("evoFrom").innerHTML=sprite(from.form,from.form==="pod"?7:6,{},color);
  $("evoTo").innerHTML=sprite(to.form,to.form==="pod"?8:7,{},color);
  $("lvlTitle").textContent="Level "+to.lv;
  $("lvlText").textContent=from.form!==to.form?`${name} evolved into ${to.name}!`:`${name} is getting stronger.`;
  $("lvlUnlock").textContent="Unlocked: "+to.unlock;
  const c=$("confetti");c.innerHTML="";
  const cols=["var(--blip)","var(--gold)","var(--accent)"];
  for(let i=0;i<40;i++){const p=document.createElement("i");p.style.left=Math.random()*100+"%";p.style.background=cols[i%3];p.style.animationDelay=Math.random()*.6+"s";c.appendChild(p);}
  $("lvlUp").hidden=false;
}

export function showDayPenalty(event, color, name) {
  const { missedDays, requested, deducted } = event.penalty;

  $('penaltyPet').innerHTML = sprite(
    event.currentLevel.form,
    7,
    {},
    color
  );

  $('penaltyXp').textContent = `−${deducted} XP`;

  const balanceNote = deducted < requested
    ? ` The scheduled penalty was ${requested} XP; your balance cannot go below zero.`
    : '';

  const levelNote = event.currentLevel.lv < event.previousLevel.lv
    ? ` ${name} is now level ${event.currentLevel.lv}.`
    : '';

  $('penaltyText').textContent =
    `No tasks were completed for ${missedDays} consecutive day${missedDays === 1 ? '' : 's'}.`
    + balanceNote
    + levelNote
    + ' Complete a task today to restart your streak.';

  $('dayPenalty').hidden = false;
  $('penaltyOk').focus();
}

export function showLevelDown(event, color, name) {
  $('downFrom').innerHTML = sprite(event.from.form, 6, {}, color);
  $('downTo').innerHTML = sprite(event.to.form, 7, {}, color);
  $('levelDownTitle').textContent = `Level ${event.from.lv} → ${event.to.lv}`;
  $('levelDownXp').textContent = `−${event.xp} XP`;
  $('levelDownText').textContent =
    `Undoing this task returned its XP. ${name} is now level ${event.to.lv}. ` +
    'Your earned badges are kept. Complete tasks to regain XP.';
  $('toast').hidden = true;
  $('levelDown').hidden = false;
  $('levelDownOk').focus();
}
