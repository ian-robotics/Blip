export function fresh(){return{
  xp:40,streak:4,day:5,doneTotal:11,sample:0,badges:[],
  week:[true,true,true,true,false,false,false], // Mon..Sun, today = index 4 (Fri)
  tasks:[
    {id:1,title:"Finish 151 playtest report",time:"Tonight",prio:"high",done:false},
    {id:2,title:"Buy groceries",time:"After class",prio:"normal",done:false},
    {id:3,title:"Reply to group chat",time:"",prio:"low",done:false}
  ],nextId:4};}
