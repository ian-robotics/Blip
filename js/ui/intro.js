import { $ } from './dom.js';
import { sprite } from './sprites.js';

export function initIntro(getColor = () => null) {
const INTRO=[
  {art:()=>sprite("pod",9,{},getColor()),t:"Meet Blip",x:"A tiny alien landed on your phone. It grows when you get things done."},
  {art:()=>`<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>`,t:"Just say it",x:"Tap the red button and say everything at once. Blip splits it into tasks for you."},
  {art:()=>sprite("baby",8,{},getColor()),t:"Finish to grow",x:"Each finished task gives XP. Level up to evolve Blip, and come back daily to keep your streak."}
];
let introI=0;
function drawIntro(){const s=INTRO[introI];$("introArt").innerHTML=s.art();$("introTitle").textContent=s.t;$("introText").textContent=s.x;
  [...$("introDots").children].forEach((d,i)=>d.classList.toggle("on",i===introI));$("introNext").textContent=introI===INTRO.length-1?"Start":"Next";}
function open(){introI=0;drawIntro();$("intro").hidden=false;}
$("introBtn").onclick=open;
$("introNext").onclick=()=>{if(introI<INTRO.length-1){introI++;drawIntro();}else $("intro").hidden=true;};
  return { open };
}
