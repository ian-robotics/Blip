const SPR={
  pod:["...XXX...","..XXXXX..",".XXoXXXX.",".XXXXXoX.","XXXXXXXXX","XoXXXXXXX","XXXXXoXXX",".XXXXXXX.","..XXXXX.."],
  baby:["..X.....X..","...X...X...","..XXXXXXX..",".XX.XXX.XX.","XXXXXXXXXXX","X.XXXXXXX.X","X.X.....X.X","...XX.XX..."],
  hat:["....YYY....","...YYYYY...","..X.....X..","...X...X...","..XXXXXXX..",".XX.XXX.XX.","XXXXXXXXXXX","X.XXXXXXX.X","X.X.....X.X","...XX.XX..."],
  king:["...Y.YY.Y...","...YYYYYY...","....XXXX....",".XXXXXXXXXX.","XXXXXXXXXXXX","XXX..XX..XXX","XXXXXXXXXXXX","...XX..XX...","..XX.XX.XX..","XX........XX"],
  flame:["..X..",".XX..",".XXX.","XXoXX","XoooX",".XXX."]
};
const COL={X:"var(--blip)",o:"var(--gold)",Y:"var(--gold)"};
export function sprite(name,px,colors){
  const g=SPR[name],w=g[0].length,h=g.length,c=Object.assign({},COL,colors||{});
  let r="";
  g.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!==".")r+=`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c[ch]}"/>`;}));
  return `<svg viewBox="0 0 ${w} ${h}" width="${w*px}" height="${h*px}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
