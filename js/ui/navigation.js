import { $ } from './dom.js';

export function showView(v){
  $("vToday").hidden=v!=="today";$("vBlip").hidden=v!=="blip";
  $("tabToday").setAttribute("aria-current",v==="today");$("tabBlip").setAttribute("aria-current",v==="blip");
}

export function initNavigation() {
$("tabToday").onclick=()=>showView("today");
$("tabBlip").onclick=()=>showView("blip");
}
