export const LEVELS=[
  {lv:1,xp:0,form:"pod",name:"Pod",unlock:"Blip arrives as a pod"},
  {lv:2,xp:60,form:"baby",name:"Hatchling",unlock:"Blip hatches"},
  {lv:3,xp:140,form:"hat",name:"Evolved Blip",unlock:"Blip grows into a new form"},
  {lv:4,xp:250,form:"king",name:"Mature Blip",unlock:"Blip reaches its mature form"},
  {lv:5,xp:400,form:"king",name:"Mature Blip",unlock:"Night-sky home screen"}
];
export const XP={high:30,normal:20,low:10};
export const BADGES=[
  {id:"hatch",ico:"2",name:"Hatched",desc:"Reach level 2"},
  {id:"chat",ico:"3+",name:"Chatterbox",desc:"Add 3+ tasks at once"},
  {id:"sweep",ico:"✓",name:"Clean Sweep",desc:"Finish every task today"},
  {id:"roll",ico:"5",name:"On a Roll",desc:"5-day streak"},
  {id:"king",ico:"4",name:"Evolved",desc:"Reach level 4"},
  {id:"fifteen",ico:"15",name:"Busy Bee",desc:"Finish 15 tasks"}
];
export const SAMPLES=[
  "Submit the 151 prototype by 11pm tonight, and buy milk and eggs, also call mom this weekend",
  "Study for the stats midterm tomorrow at 2pm and return my library books",
  "Email the TA about the group project and maybe clean my desk on Sunday"
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const STORAGE_KEY = "blip-proto-v1";

/** Three daily prompts: coursework, coordination and a small personal task. */
export const DEMO_TASKS_BY_DAY = {
  1: [
    { title: 'Finish 151 playtest report', time: 'Tonight', prio: 'high' },
    { title: 'Buy groceries', time: 'After class', prio: 'normal' },
    { title: 'Reply to group chat', time: 'Before dinner', prio: 'low' }
  ],
  2: [
    { title: 'Submit the project proposal', time: 'By 5pm', prio: 'high' },
    { title: 'Review lecture notes', time: 'After class', prio: 'normal' },
    { title: 'Water my plants', time: 'Evening', prio: 'low' }
  ],
  3: [
    { title: 'Prepare the prototype for playtesting', time: 'By 3pm', prio: 'high' },
    { title: 'Meet the team to review feedback', time: '4pm', prio: 'normal' },
    { title: 'Take a short walk', time: 'After dinner', prio: 'low' }
  ],
  4: [
    { title: 'Fix the main issue from the playtest', time: 'Tonight', prio: 'high' },
    { title: 'Study for the statistics quiz', time: 'Afternoon', prio: 'normal' },
    { title: 'Tidy my desk', time: 'Before studying', prio: 'low' }
  ],
  5: [
    { title: 'Submit the weekly project update', time: 'By 6pm', prio: 'high' },
    { title: 'Rehearse the demo with my teammates', time: 'After class', prio: 'normal' },
    { title: 'Pick a movie for tonight', time: 'Evening', prio: 'low' }
  ],
  6: [
    { title: 'Finish the presentation slides', time: 'By noon', prio: 'high' },
    { title: 'Do laundry', time: 'Afternoon', prio: 'normal' },
    { title: 'Call a friend', time: 'Evening', prio: 'low' }
  ],
  7: [
    { title: 'Practice the final project presentation', time: 'Afternoon', prio: 'high' },
    { title: 'Plan next week’s study schedule', time: 'Before dinner', prio: 'normal' },
    { title: 'Write down one win from this week', time: 'Before bed', prio: 'low' }
  ]
};
