export function fresh(){return{
  color: null,
  history: [],
  week: [false,false,false,false,false,false,false],
  xp:0,streak:0,day:1,doneTotal:0,sample:0,badges:[],
  
  tasks:[
    {id:1,title:"Finish 151 playtest report",time:"Tonight",prio:"high",done:false},
    {id:2,title:"Buy groceries",time:"After class",prio:"normal",done:false},
    {id:3,title:"Reply to group chat",time:"",prio:"low",done:false}
  ],nextId:4};}
