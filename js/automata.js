import{backgroundColor,cellSize,changePaused,fillRadius,paused,setFillRadius}from"./inputs/config.js";import{fillCircle,getConsoleText,setConsoleText,midpointCircle,mooreNeighborhood,padArray,downloadObjectAsJSON,unique2DArr,reshape2DArray,gaussianRandom,packRGB,unpackRGB,shiftHue,hsvToRgb,fadeRGB}from"./utils.js";import{mouseX,mouseY,outlinePoints,registerCanvasCallbacks}from"./inputs/userInput.js";import{editor}from"./inputs/settings.js";
//! Intialize Canvas
const canvas=document.getElementById("cellGrid");canvas.width=window.innerWidth,canvas.height=window.innerHeight;export const ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=!1;
//! Initialize Overlay Canvas
const overlayCanvas=document.getElementById("overlayCanvas");overlayCanvas.width=window.innerWidth,overlayCanvas.height=window.innerHeight;const overlayCtx=overlayCanvas.getContext("2d");
//! Handle Canvas Resizing
function resizeCanvas(){canvas.width=window.innerWidth,canvas.height=window.innerHeight,overlayCanvas.width=window.innerWidth,overlayCanvas.height=window.innerHeight;let t=Math.floor(window.innerHeight/cellSize),e=Math.floor(window.innerWidth/cellSize);automata.grid=reshape2DArray(automata.grid,t,e,automata.baseState?automata.baseState:0),automata.rows=t,automata.cols=e,automata.drawGrid()}registerCanvasCallbacks(overlayCtx),window.addEventListener("resize",resizeCanvas);
//! General Automata Class
export class Automata{constructor(){const t=Math.floor(ctx.canvas.height/cellSize),e=Math.floor(ctx.canvas.width/cellSize);this.grid=new Array(t).fill(null).map((t=>new Array(e).fill(0))),this.rows=t,this.cols=e,this.neighborhood=mooreNeighborhood(),this.penState=1,this.lastDraw=Date.now(),this.drawTimes=[],this.fps=0,this.drawRequestIds=[],this.updateRequestIds=[],this.gpu=function(){try{return new window.GPU.GPU({mode:"dev"})}catch(t){return new GPU({mode:"dev"})}}()}drawGrid(){const t=ctx.createImageData(ctx.canvas.width,ctx.canvas.height),e=t.data;for(let t=0;t<this.rows;t++)for(let s=0;s<this.cols;s++){const i=s*cellSize,a=t*cellSize,o=this.stateColor(this.grid[t][s]),r=4*(a*ctx.canvas.width+i);for(let t=0;t<cellSize;t++)for(let s=0;s<cellSize;s++){const i=r+4*(t*ctx.canvas.width+s);e[i]=o[0],e[i+1]=o[1],e[i+2]=o[2],e[i+3]=255}}this.gridImageData=t,ctx.putImageData(this.gridImageData,0,0),this.drawTimes.push(Date.now()-this.lastDraw),this.lastDraw=Date.now(),this.drawTimes=this.drawTimes.slice(-50);const s=this.drawTimes.reduce(((t,e)=>t+e))/this.drawTimes.length;this.fps=Math.round(1e3/s),document.getElementById("fps-span").innerHTML=this.fps}drawCursor(){let t=Math.floor(mouseX/cellSize),e=Math.floor(mouseY/cellSize);overlayCtx.clearRect(0,0,canvas.width,canvas.height);for(const[s,i]of midpointCircle(t,e,fillRadius+1))overlayCtx.fillStyle=this.getPenColor(),overlayCtx.fillRect(s*cellSize,i*cellSize,cellSize,cellSize)}stateColor(t){return t?[255,255,255]:backgroundColor}updateGrid(t=!1,e=!0){if(e)if(paused||t)this.drawRequestIds.push(window.requestAnimationFrame((()=>this.drawGrid())));else{let t=this.getNextState();this.grid=t,this.drawRequestIds.push(window.requestAnimationFrame((()=>this.drawGrid()))),this.updateRequestIds.push(window.requestAnimationFrame((()=>this.updateGrid())))}else this.grid=this.getNextState()}getNextState(){return this.grid}randomize(){this.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((()=>Math.floor(2*Math.random()))))),window.requestAnimationFrame((()=>this.drawGrid()))}draw(){let t=Math.floor(mouseX/cellSize),e=Math.floor(mouseY/cellSize),s=fillCircle(t,e,fillRadius);for(const[t,e]of s)t>=0&&t<this.grid[0].length&&e>=0&&e<this.grid.length&&(this.grid[e][t]=this.penState);paused&&window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){this.penState=(this.penState+1)%2,setConsoleText(`Updated pen to draw ${{0:"Dead",1:"Alive"}[this.penState]} [${this.penState}]`),window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(){return{0:"rgba(255, 255, 255, 0.8)",1:"rgba(255, 0, 0, 0.8)"}[this.penState]}saveData(){const t={name:"Automata",args:[],grid:this.grid};downloadObjectAsJSON(t,"automata.json")}clearDrawRequests(){this.drawRequestIds.forEach((t=>window.cancelAnimationFrame(t))),this.drawRequestIds=[]}clearUpdateRequests(){this.updateRequestIds.forEach((t=>window.cancelAnimationFrame(t))),this.updateRequestIds=[]}resetAnimationRequests(){this.clearDrawRequests(),this.clearUpdateRequests(),automata.updateGrid()}}
//! Discrete Automata
export class LifeLikeAutomata extends Automata{constructor(t="B3/S23",e=mooreNeighborhood()){super(),this.ruleString=t,this.setRules(t),this.neighborhood=e,this.gridUpdateKernel=this.gpu.createKernel((function(t,e,s,i){const a=this.thread.x,o=this.thread.y,r=t[o][a];let n=0;for(let s=0;s<this.constants.neighborhoodSize;s++){const i=e[s][0];n+=t[(o+e[s][1]+this.constants.rows)%this.constants.rows][(a+i+this.constants.cols)%this.constants.cols]}let h=0;for(let t=0;t<this.constants.rulesSize;t++)s[t]===n&&(h=1);let l=0;for(let t=0;t<this.constants.rulesSize;t++)i[t]===n&&(l=1);return 0===r&&1===h||1===r&&1===l?1:0}),{output:[this.cols,this.rows]}).setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,rulesSize:Math.max(this.birthRules.length,this.surviveRules.length)})}setRules(t){if(t=t.replaceAll(" ",""),document.getElementById("life-rule-input").value=t,t.match(/^B((\d*(\(\d+\))?)\/S)((\d*(\(\d+\))?)+)$/)){"Invalid Rulestring!"==getConsoleText()&&setConsoleText("Valid Rulestring!");let e=t.slice(1).split("/S");function s(t){t=t.match(/(\d+|\(\d+\))/g)||[];let e=[];return t.forEach((t=>{t.startsWith("(")&&t.endsWith(")")?e.push(parseInt(t.slice(1,-1),10)):(t=t.split("").map((t=>parseInt(t,10))),e=e.concat(t))})),e}this.birthRules=[...new Set(s(e[0]))],this.surviveRules=[...new Set(s(e[1]))],this.ruleString=t}else setConsoleText("Invalid Rulestring!");this.gridUpdateKernel&&this.gridUpdateKernel.setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,rulesSize:Math.max(this.birthRules.length,this.surviveRules.length)})}getNextState(){this.gridUpdateKernel.setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,rulesSize:Math.max(this.birthRules.length,this.surviveRules.length)}).setOutput([this.cols,this.rows]);const t=Math.max(this.birthRules.length,this.surviveRules.length);return this.gridUpdateKernel(this.grid,this.neighborhood,padArray(this.birthRules,t,-1),padArray(this.surviveRules,t,-1))}saveData(){const t={name:"Life",args:[this.ruleString,this.neighborhood],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"life.json")}}export class LangtonsAnt extends Automata{constructor(t=null){super(),this.penState=2,this.ants=t||[[Math.floor(this.cols/2),Math.floor(this.rows/2),0]]}drawGrid(){super.drawGrid();for(const[t,e]of this.ants)ctx.fillStyle=this.getPenColor(2),ctx.fillRect(t*cellSize,e*cellSize,cellSize,cellSize)}stateColor(t){return{0:backgroundColor,1:[255,255,255]}[t]}getNextState(){let t=this.ants.map((t=>t.slice())),e=this.grid.map((t=>t.slice()));for(let s=0;s<this.ants.length;s++){let i=this.ants[s],a=e[i[1]][i[0]];switch(e[i[1]][i[0]]=(a+1)%2,t[s][2]=0==a?(i[2]+3)%4:(i[2]+1)%4,t[s][2]){case 0:t[s][1]=(t[s][1]-1+this.rows)%this.rows;break;case 1:t[s][0]=(t[s][0]+1)%this.cols;break;case 2:t[s][1]=(t[s][1]+1)%this.rows;break;case 3:t[s][0]=(t[s][0]-1+this.cols)%this.cols}}return this.ants=t,e}randomize(){this.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((()=>Math.random()<.1?1:0)))),window.requestAnimationFrame((()=>this.drawGrid()))}draw(){let t=Math.floor(mouseX/cellSize),e=Math.floor(mouseY/cellSize),s=fillCircle(t,e,fillRadius);for(const[t,e]of s)t>=0&&t<this.grid[0].length&&e>=0&&e<this.grid.length&&(0==this.penState||1==this.penState?this.grid[e][t]=this.penState:2==this.penState&&this.ants.push(new Float32Array([t,e,0])));0==this.penState&&(this.ants=this.ants.filter((t=>!s.some((e=>e[0]===t[0]&&e[1]===t[1]))))),this.ants=unique2DArr(this.ants),window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){this.penState=(this.penState+1)%3,setConsoleText(`Updated pen to draw ${{0:"Empty",1:"Filled",2:"Ant"}[this.penState]} [${this.penState}]`),window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(t=null){let e={0:"rgba(255, 255, 255, 0.8)",1:"rgba(255, 0, 0, 0.8)",2:"rgba(0, 255, 0, 0.8)"};return t?e[t]:e[this.penState]}saveData(){const t={name:"Langton's Ant",args:[this.ants.map((t=>Array.from(t)))],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"langton_ants.json")}}export class ElementaryCA extends Automata{constructor(t=90){super(),this.baseState=2,this.grid=new Array(this.rows).fill(null).map((t=>new Array(this.cols).fill(this.baseState))),this.ruleNumber=t<0?0:t>255?255:t,this.ruleMap=this.parseEcaRule(t)}parseEcaRule(t){const e=t.toString(2).padStart(8,"0"),s=["111","110","101","100","011","010","001","000"];let i={};for(let t=0;t<s.length;t++)i[s[t]]=parseInt(e[t],10);return i}getNextState(){let t=this.grid.map((t=>t.slice()));for(let e=0;e<this.rows;e++){let s=(e-1+this.rows)%this.rows;for(let i=0;i<this.cols;i++){const a=[this.grid[s][(i-1+this.cols)%this.cols],this.grid[s][i],this.grid[s][(i+1)%this.cols]];if(a.every((t=>t===this.baseState)));else{const s=a.map((t=>t===this.baseState?0:t)).join("");t[e][i]=this.ruleMap[s]}}}return t}stateColor(t){let e={0:backgroundColor,1:[255,255,255]};return e[this.baseState]=backgroundColor,e[t]}randomize(){this.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((()=>Math.random()<5e-5?1:this.baseState)))),window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){this.penState=(this.penState+1)%2,setConsoleText(`Updated pen to draw ${{0:"Black",1:"White"}[this.penState]} [${this.penState}]`),0===this.penState&&(this.penState=2),window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(){return{2:"rgba(255, 255, 255, 0.8)",1:"rgba(255, 0, 0, 0.8)"}[this.penState]}saveData(){const t={name:"Elementary",args:[this.ruleNumber],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"elementary.json")}}export class BriansBrain extends Automata{constructor(t="2",e=mooreNeighborhood()){super(),this.ruleString=t,this.setRules(t),this.neighborhood=e,this.gridUpdateKernel=this.gpu.createKernel((function(t,e,s){const i=this.thread.x,a=this.thread.y,o=t[a][i];if(0==o){let o=0;for(let s=0;s<this.constants.neighborhoodSize;s++){const r=e[s][0];1==t[(a+e[s][1]+this.constants.rows)%this.constants.rows][(i+r+this.constants.cols)%this.constants.cols]&&o++}for(let t=0;t<this.constants.ruleSize;t++)if(s[t]===o)return 1;return 0}return 1==o?2:0}),{output:[this.cols,this.rows]}).setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,ruleSize:this.birthRules.length})}setRules(t){if(t.match(/\d+(\/\d+)*$/)){"Invalid Rulestring!"==getConsoleText()&&setConsoleText("Valid Rulestring!"),document.getElementById("brain-rule-input").value=t;let e=t.split("/").map(Number);this.birthRules=[...new Set(e)],this.ruleString=t}else""==t?(this.birthRules=[0],this.ruleString=t):setConsoleText("Invalid Rulestring!")}getNextState(){return this.gridUpdateKernel.setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,ruleSize:this.birthRules.length}).setOutput([this.cols,this.rows]),this.gridUpdateKernel(this.grid,this.neighborhood,this.birthRules)}stateColor(t){return{0:backgroundColor,1:[255,255,255],2:[0,0,255]}[t]}randomize(){this.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((()=>Math.random()<.2?Math.random()<.5?1:2:0)))),window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){this.penState=(this.penState+1)%3,setConsoleText(`Updated pen to draw ${{0:"Ready",1:"Firing",2:"Refactory"}[this.penState]} [${this.penState}]`),window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(){return{0:"rgba(255, 255, 255, 0.8)",1:"rgba(255, 0, 0, 0.8)",2:"rgba(0, 0, 255, 0.8)"}[this.penState]}saveData(){const t={name:"Brian's Brain",args:[this.ruleString,this.neighborhood],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"brianbrain.json")}}export class WireWorld extends Automata{constructor(){super(),this.neighborhood=mooreNeighborhood(),this.gridUpdateKernel=this.gpu.createKernel((function(t,e){const s=this.thread.x,i=this.thread.y,a=t[i][s];if(0==a)return 0;if(2==a)return 3;if(3==a)return 1;{let a=0;for(let o=0;o<this.constants.neighborhoodSize;o++){const r=e[o][0];2==t[(i+e[o][1]+this.constants.rows)%this.constants.rows][(s+r+this.constants.cols)%this.constants.cols]&&a++}return 1===a||2===a?2:1}}),{output:[this.cols,this.rows]}).setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length})}getNextState(){return this.gridUpdateKernel(this.grid,this.neighborhood)}stateColor(t){return{0:backgroundColor,1:[255,255,0],2:[0,0,255],3:[255,0,0]}[t]}randomize(){let t=new LifeLikeAutomata("B1/S123456");t.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((()=>Math.random()<.001?1:0))));for(let e=0;e<=20;e++)t.updateGrid(!1,!1);this.grid=t.grid,window.requestAnimationFrame((()=>this.drawGrid()))}draw(){let t=Math.floor(mouseX/cellSize),e=Math.floor(mouseY/cellSize),s=fillCircle(t,e,fillRadius);for(const[t,e]of s)t>=0&&t<this.grid[0].length&&e>=0&&e<this.grid.length&&(2==this.penState||3==this.penState?0!=this.grid[e][t]&&(this.grid[e][t]=this.penState):4==this.penState?2!=this.grid[e][t]&&3!=this.grid[e][t]||(this.grid[e][t]=1):this.grid[e][t]=this.penState);window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){this.penState=(this.penState+1)%5,setConsoleText(`Updated pen to draw ${{0:"Empty",1:"Conductor",2:"Electron Head",3:"Electron Tail",4:"Signal Eraser"}[this.penState]}`),window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(){return{0:"rgba(255, 255, 255, 0.8)",1:"rgba(255, 255, 0, 0.8)",2:"rgba(0, 0, 255, 0.8)",3:"rgba(255, 0, 0, 0.8)",4:"rgba(0, 255, 0, 0.8)"}[this.penState]}saveData(){const t={name:"Wireworld",args:[],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"wireworld.json")}}export class RPSGame extends Automata{constructor(t=3,e=3,s=mooreNeighborhood()){super(),this.neighborhood=s,this.winCondition=t,this.stateCount=[3,4,5].includes(e)?e:3,this.gridUpdateKernel=this.gpu.createKernel((function(t,e,s,i){const a=this.thread.x,o=this.thread.y,r=t[o][a];let n=0,h=0,l=0,d=0,c=0;for(let s=0;s<this.constants.neighborhoodSize;s++){const i=e[s][0],r=t[(o+e[s][1]+this.constants.rows)%this.constants.rows][(a+i+this.constants.cols)%this.constants.cols];0==r?n+=1:1==r?h+=1:2==r?l+=1:3==r?d+=1:4==r&&(c+=1)}return 0==r?h>=s?1:c>=s?4:r:1==r?l>=s?2:d>=s?3:r:2==r?
//! SPECIAL CASE: Scissors beaten by Lizard (3) if stateCount is 4 (unbalanced rules)
4==i?n>=s?0:d>=s?3:r:n>=s?0:c>=s?4:r:3==r?
//! SPECIAL CASE: Lizard not defeated by Scissors when stateCount = 4
4==i?n>=s?0:r:n>=s?0:l>=s?2:r:4==r?h>=s?1:d>=s?3:r:void 0}),{output:[this.cols,this.rows]}).setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length})}stateColor(t){return{0:[127,0,0],1:[0,127,0],2:[0,0,127],3:[0,255,127],4:[0,127,255]}[t]}getNextState(){return this.gridUpdateKernel.setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length}).setOutput([this.cols,this.rows]),this.gridUpdateKernel(this.grid,this.neighborhood,this.winCondition,this.stateCount)}randomize(){this.grid=new Array(this.rows).fill(null).map((t=>new Array(this.cols).fill(null).map((()=>Math.floor(Math.random()*this.stateCount))))),window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){this.penState=(this.penState+1)%this.stateCount,setConsoleText(`Updated pen to draw ${{0:"Rock",1:"Paper",2:"Scissors",3:"Lizard",4:"Spock"}[this.penState]} [${this.penState}]`),window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(){return{0:"rgba(255, 0, 0, 0.8)",1:"rgba(0, 255, 0, 0.8)",2:"rgba(0, 0, 255, 0.8)",3:"rgba(0, 255, 127, 0.8)",4:"rgba(0, 127, 255, 0.8)"}[this.penState]}saveData(){const t={name:"Rock, Paper, Scissors",args:[this.winCondition,this.stateCount,this.neighborhood],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"rock-paper-scissor.json")}}
//! Continuous Automata
export class NeuralCA extends Automata{constructor(neighborhood=mooreNeighborhood(1,!0),weights=[[.68,-.9,.68],[-.9,-.66,-.9],[.68,-.9,.68]],activationString="function activation(x) {\n\treturn -(1 / Math.pow(2, 0.6 * Math.pow(x, 2))) + 1;\n}"){super(),this.skipFrames=!0,document.getElementById("neural-skip-input").checked=!0,this.neighborhood=neighborhood,this.weights=weights.flat().length==neighborhood.flat().length/2?weights:reshape2DArray(weights,neighborhood.length,neighborhood[0].length),this.activationString=activationString,editor.setValue(activationString),this.activation=eval(`(${activationString})`),this.maskOptions=[[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1]],this.fillMap=this.maskOptions[Math.floor(Math.random()*this.maskOptions.length)],this.gridUpdateKernel=this.gpu.createKernel((function(t,e,s,i){const a=this.thread.x,o=this.thread.y;let r=0;for(let i=0;i<this.constants.neighborhoodSize;i++){const n=e[i][0];r+=t[(o+e[i][1]+this.constants.rows)%this.constants.rows][(a+n+this.constants.cols)%this.constants.cols]*s[i]}return r=i(r),r>1?r=1:r<0&&(r=0),r}),{output:[this.cols,this.rows]}).setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length})}getNextState(){this.gridUpdateKernel.setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length}).setOutput([this.cols,this.rows]);const t=this.skipFrames?this.gridUpdateKernel(this.grid,this.neighborhood,this.weights.flat(),this.activation):this.grid;return this.gridUpdateKernel(t,this.neighborhood,this.weights.flat(),this.activation)}stateColor(t){let e=Math.floor(255*t);return this.fillMap.map((t=>1==t?e:0))}randomize(){this.fillMap=this.maskOptions[Math.floor(Math.random()*this.maskOptions.length)],this.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((t=>Math.max(0,Math.min(1,gaussianRandom(.5,.3))))))),this.drawCursor(),window.requestAnimationFrame((()=>this.drawGrid()))}getPenColor(){let t=this.fillMap.map((t=>255*t));return{0:"rgba(255, 255, 255, 0.8)",1:`rgba(${t[0]}, ${t[1]}, ${t[2]}, 0.8)`}[this.penState]}saveData(){const t={name:"Neural",args:[this.neighborhood,this.weights,this.activationString],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"neural.json")}}export class Huegene extends Automata{constructor(t=40,e=!1,s=!1,i=mooreNeighborhood()){super(),this.neighborhood=i,this.grid=new Array(this.rows).fill(null).map((t=>new Array(this.cols).fill(null).map((t=>packRGB([0,0,0]))))),this.penState=this.genRandomPenColor(),this.randomFactor=t,document.getElementById("huegene-random-input").value=this.randomFactor,this.updateOffset(),this.fade=e,this.psychedelic=s,this.fadeKeepRate=.99,this.psychedelicRate=4,document.getElementById("huegene-psychedelic-input").checked=!1,document.getElementById("huegene-fade-input").checked=!1,this.gridUpdateKernel=this.gpu.createKernel((function(t,e,s,i,a){const o=this.thread.x,r=this.thread.y,n=unpackRGB(t[r][o]),h=[];for(let s=0;s<this.constants.neighborhoodSize;s++){const i=e[s][0],a=e[s][1],n=unpackRGB(t[(r+a+this.constants.rows)%this.constants.rows][(o+i+this.constants.cols)%this.constants.cols]);0==n[0]&&0==n[1]&&0==n[2]||h.push(s)}if(0===h.length||0!=n[0]||0!=n[1]||0!=n[2]){let t=n;return a&&(t=shiftHue(t,this.constants.psychedelicRate)),i&&(t=fadeRGB(t,this.constants.fadeKeepRate)),packRGB(t)}const l=e[h[Math.floor(Math.random()*h.length)]],d=l[0],c=l[1];let u=unpackRGB(t[(r+c+this.constants.rows)%this.constants.rows][(o+d+this.constants.cols)%this.constants.cols]);return a&&(u=shiftHue(u,this.constants.psychedelicRate)),i&&(u=fadeRGB(u,this.constants.fadeKeepRate)),packRGB(shiftHue(u,s[r][o]))}),{output:[this.cols,this.rows]}).setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,backgroundColor:packRGB(backgroundColor),fadeKeepRate:this.fadeKeepRate,psychedelicRate:this.psychedelicRate,randomFactor:this.randomFactor}).setFunctions([packRGB,unpackRGB,shiftHue,fadeRGB])}updateOffset(t=!1){this.offset&&!t?this.offsetGrid=reshape2DArray(this.offsetGrid,this.rows,this.cols,null,(()=>{const t=Math.floor(Math.random()*(this.randomFactor+1));return Math.random()<.5?t:-t})):this.offsetGrid=new Array(this.rows).fill(null).map((t=>new Array(this.cols).fill(null).map((t=>{const e=Math.floor(Math.random()*(this.randomFactor+1));return Math.random()<.5?e:-e}))))}getNextState(){this.gridUpdateKernel.setConstants({rows:this.rows,cols:this.cols,neighborhoodSize:this.neighborhood.length,backgroundColor:packRGB(backgroundColor),fadeKeepRate:this.fadeKeepRate,psychedelicRate:this.psychedelicRate}).setOutput([this.cols,this.rows]),this.rows==this.offsetGrid.length&&this.cols==this.offsetGrid[0].length||this.updateOffset();return this.gridUpdateKernel(this.grid,this.neighborhood,this.offsetGrid,this.fade,this.psychedelic)}stateColor(t){return unpackRGB(t)}randomize(){this.penState!=packRGB([0,0,0])&&this.cycleDraw(),this.cycleDraw(),this.grid=new Array(this.rows).fill(null).map((()=>new Array(this.cols).fill(null).map((()=>Math.random()<3e-4?this.penState:packRGB([0,0,0]))))),window.requestAnimationFrame((()=>this.drawGrid()))}cycleDraw(){if(this.penState==packRGB([0,0,0])){this.penState=this.genRandomPenColor();const t=unpackRGB(this.penState);setConsoleText(`Updated pen to draw RGB(${t[0]},${t[1]},${t[2]})`)}else this.penState=packRGB([0,0,0]),setConsoleText("Updated pen to draw Erase (Black fill)");window.requestAnimationFrame((()=>this.drawCursor()))}getPenColor(){const t=unpackRGB(this.penState);return`rgba(${t[0]},${t[1]},${t[2]}, 0.8)`}genRandomPenColor(){return packRGB(hsvToRgb([Math.floor(360*Math.random()),.6,.8]))}saveData(){const t={name:"Huegene",args:[this.randomFactor,this.fade,this.psychedelic,this.neighborhood],grid:this.grid.map((t=>Array.from(t)))};downloadObjectAsJSON(t,"huegene.json")}}
//! Intialize and trigger automata class
export let automata=new LifeLikeAutomata;export function setAutomata(t,e=[],s=null){let i;switch(automata.clearDrawRequests(),automata.clearUpdateRequests(),automata instanceof ElementaryCA&&(automata.grid=automata.grid.map((t=>t.map((t=>2===t?0:t)))),setFillRadius(3)),i=s||automata.grid,t){case"Life":automata=new LifeLikeAutomata(...e),automata.grid=i.map((t=>t.map((t=>[0,1].includes(Math.round(t))?Math.round(t):1)))),setConsoleText("Changed automata to life-like");break;case"Langton's Ant":automata=new LangtonsAnt(...e),automata.grid=i.map((t=>t.map((t=>[0,1].includes(Math.round(t))?Math.round(t):1)))),setConsoleText("Changed automata to Langton's Ant");break;case"Elementary":automata=new ElementaryCA(...e),automata.grid=i.map((t=>t.map((t=>1==Math.round(t)?Math.round(t):2)))),setFillRadius(0),setConsoleText("Changed automata to Elementary CA");break;case"Brian's Brain":automata=new BriansBrain(...e),automata.grid=i.map((t=>t.map((t=>[0,1,2].includes(Math.round(t))?Math.round(t):1)))),setConsoleText("Changed automata to Brian's Brain");break;case"Wireworld":automata=new WireWorld(...e),automata.grid=i.map((t=>t.map((t=>[0,1,2,3].includes(Math.round(t))?Math.round(t):0)))),setConsoleText("Changed automata to Wireworld");break;case"Rock, Paper, Scissors":automata=new RPSGame(...e),automata.grid=i.map((t=>t.map((t=>[0,1,2,3,4].includes(Math.round(t))?Math.round(t):0)))),setConsoleText("Changed automata to Rock, Paper, Scissors");break;case"Neural":automata=new NeuralCA(...e),automata.grid=i.map((t=>t.map((t=>[0,1].includes(Math.round(t))?t:1)))),setConsoleText("Changed automata to Neural CA");break;case"Huegene":automata=new Huegene(...e),automata.grid=s?i.slice():i.map((t=>t.map((t=>1==Math.round(t)?automata.penState:packRGB([0,0,0]))))),setConsoleText("Changed automata to Huegene")}automata.drawGrid(),automata.drawCursor(),automata.updateGrid()}automata.updateGrid();