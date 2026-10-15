const VERBS=["buy","call","call back","email","text","message","reply","respond","ask","tell","remind","thank","meet","visit","see","watch","listen","read","write","draft","edit","study","review","learn","research","memorize","rehearse","practice","present","submit","send","turn in","hand in","upload","post","share","finish","complete","finalize","work on","work out","exercise","run","go","head","attend","join","sign up","register","apply","pay","transfer","order","get","grab","pick up","drop off","take","take out","throw out","recycle","make","fix","repair","replace","change","check","look","find","start","begin","do","clean","clean up","tidy","organize","sort","vacuum","wash","laundry","cook","bake","prepare","feed","walk","water","pack","bring","return","refund","cancel","renew","charge","book","reserve","schedule","plan","print","scan","sign","mail","ship","file","fill out","update","install","back up","set up","follow up","move","shower","sleep","wake up","call","grocery","shop","have"].sort((a,b)=>b.length-a.length).join("|");
// Phrases that start a new task even without a verb right after "and".
const LEAD="(?:i\\s+(?:also\\s+)?(?:need|have|gotta|got|want|should|must|will|'ll|am going)\\s+(?:to\\s+)?|i'll\\s+|i\\s+gotta\\s+|(?:also\\s+)?(?:remember|don'?t\\s+forget)\\s+to\\s+|need\\s+to\\s+|have\\s+to\\s+|gotta\\s+|maybe\\s+|please\\s+)";
const TIME=/\b(?:(?:by|at|before|on|this)\s+)?(?:today|tonight|tomorrow(?:\s+(?:morning|afternoon|night))?|morning|afternoon|evening|weekend|(?:mon|tues|wednes|thurs|fri|satur|sun)day|\d{1,2}(?::\d{2})?\s*(?:am|pm))\b(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)?/gi;
const HIGH=/\b(urgent|asap|exam|midterm|final|due|deadline|submit|turn in|interview|report)\b/i;
const LOW=/\b(maybe|sometime|if i can|eventually)\b/i;
export function parse(text){
  let s=" "+text.replace(/[。；;.!?]+/g,",")+" ";
  s=s.replace(/\s+(?:and then|then|and also|also|plus|after that|and after that|next|oh and|and finally|finally|lastly)\s+/gi,",");
  s=s.replace(/\s+(?:first(?:ly)?|second(?:ly)?|third(?:ly)?|number (?:one|two|three|four|five))\s+/gi,",");
  s=s.replace(new RegExp("\\s+and\\s+(?="+LEAD+")","gi"),",");
  s=s.replace(new RegExp("\\s+and\\s+(?="+LEAD+"?(?:"+VERBS+")\\b)","gi"),",");
  // Speech has no punctuation: a new "I need to / remember to ..." also starts a task.
  s=s.replace(new RegExp("\\s+(?=(?:i\\s+(?:also\\s+)?(?:need|have|gotta|should|must)\\s+to|remember\\s+to|don'?t\\s+forget\\s+to)\\s)","gi"),",");
  return s.split(",").map(clean).filter(Boolean);
}
function clean(p){
  p=p.trim().replace(/^(and|so|ok|okay|um|uh)\s+/i,"")
    .replace(/^(i\s+(?:also\s+)?(?:need|have|gotta|got|want|should|must|will|am going)\s+(?:to\s+)?|i'll\s+|i\s+gotta\s+|(?:also\s+)?remember\s+to\s+|don'?t\s+forget\s+to\s+|need\s+to\s+|have\s+to\s+|gotta\s+|please\s+)/i,"");
  if(p.length<2)return null;
  const prio=HIGH.test(p)?"high":LOW.test(p)?"low":"normal";
  const times=(p.match(TIME)||[]).map(x=>x.trim());
  let title=p.replace(TIME,"").replace(LOW,"").replace(/\s{2,}/g," ").replace(/\s+(by|at|on|before)$/i,"").trim();
  if(!title)return null;
  title=title[0].toUpperCase()+title.slice(1);
  const time=times.map(x=>x[0].toUpperCase()+x.slice(1)).join(" · ");
  return{title,time,prio};
}
