import { $ } from './dom.js';
import { sprite } from './sprites.js';

let toastT;
export function toast(html){const t=$("toast");t.innerHTML=html;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2600);}

export function levelUp(from,to){
  $("evoFrom").innerHTML=sprite(from.form,from.form==="pod"?7:6);
  $("evoTo").innerHTML=sprite(to.form,to.form==="pod"?8:7);
  $("lvlTitle").textContent="Level "+to.lv;
  $("lvlText").textContent=from.form!==to.form?`Blip evolved into ${to.name}!`:`Blip is getting stronger.`;
  $("lvlUnlock").textContent="Unlocked: "+to.unlock;
  const c=$("confetti");c.innerHTML="";
  const cols=["var(--blip)","var(--gold)","var(--accent)"];
  for(let i=0;i<40;i++){const p=document.createElement("i");p.style.left=Math.random()*100+"%";p.style.background=cols[i%3];p.style.animationDelay=Math.random()*.6+"s";c.appendChild(p);}
  $("lvlUp").hidden=false;
}
