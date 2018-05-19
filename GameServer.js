var http = require('http');

var Entity = require('./entity');
var Vec2 = require('./modules/Vec2');
var Logger = require('./modules/Logger');

function GameServer(){this.srcFiles="../src";this.run=true;this.version="1.6.1";this.httpServer=null;this.lastNodeId=1;this.lastPlayerId=1;this.clients=[];this.socketCount=0;this.largestClient=null;this.nodes=[];this.nodesVirus=[];this.nodesFood=[];this.nodesEjected=[];this.nodesPlayer=[];this.movingNodes=[];this.leaderboard=[];this.leaderboardType=-1;var BotLoader=require("./ai/BotLoader");this.bots=new BotLoader(this);this.startTime=Date.now();this.stepDateTime=0;this.timeStamp=0;this.updateTime=
0;this.updateTimeAvg=0;this.timerLoopBind=null;this.mainLoopBind=null;this.tickCounter=0;this.disableSpawn=false;this.config={logVerbosity:4,logFileVerbosity:5,serverTimeout:300,serverWsModule:"ws",serverMaxConnections:500,serverPort:443,serverBind:"0.0.0.0",serverTracker:0,serverGamemode:0,serverBots:0,serverViewBaseX:1920,serverViewBaseY:1080,serverMinScale:.15,serverSpectatorScale:.4,serverStatsPort:88,serverStatsUpdate:60,mobilePhysics:0,badWordFilter:1,serverRestart:0,serverMaxLB:10,serverChat:1,
serverChatAscii:1,separateChatForTeams:0,serverName:"MultiOgar-Edited #1",serverWelcome1:"Welcome to MultiOgar-Edited!",serverWelcome2:"",clientBind:"",serverIpLimit:4,serverMinionIgnoreTime:30,serverMinionThreshold:10,serverMinionInterval:1E3,serverScrambleLevel:1,playerBotGrow:0,borderWidth:14142.135623730952,borderHeight:14142.135623730952,foodMinSize:10,foodMaxSize:20,foodMinAmount:1E3,foodMaxAmount:2E3,foodSpawnAmount:30,foodMassGrow:1,spawnInterval:20,virusMinSize:100,virusMaxSize:141.421356237,
virusMaxPoppedSize:60,virusEqualPopSize:0,virusMinAmount:50,virusMaxAmount:100,motherCellMaxMass:0,virusVelocity:780,virusMaxCells:16,ejectSize:36.06,ejectSizeLoss:42.43,ejectCooldown:3,ejectSpawnPercent:.5,ejectVirus:0,ejectVelocity:780,playerMinSize:31.6227766017,playerMaxSize:1500,playerMinSplitSize:59.16079783,playerMinEjectSize:59.16079783,playerStartSize:31.6227766017,playerMaxCells:16,playerSpeed:1,playerDecayRate:.998,playerDecayCap:0,playerRecombineTime:30,playerDisconnectTime:-1,playerMaxNickLength:15,
splitVelocity:780,minionStartSize:31.6227766017,minionMaxStartSize:31.6227766017,minionCollideTeam:0,disableERTP:1,disableQ:0,serverMinions:0,collectPellets:0,defaultName:"minion",minionsOnLeaderboard:0,tourneyMaxPlayers:12,tourneyPrepTime:10,tourneyEndTime:30,tourneyTimeLimit:20,tourneyAutoFill:0,tourneyAutoFillPlayers:1,tourneyLeaderboardToggleTime:10};this.ipBanList=[];this.minionTest=[];this.userList=[];this.badWords=[];this.loadFiles();var QuadNode=require("./modules/QuadNode.js");this.setBorder(this.config.borderWidth,
this.config.borderHeight);this.quadTree=new QuadNode(this.border)}module.exports=GameServer;
GameServer.prototype.start=function(){this.timerLoopBind=this.timerLoop.bind(this);this.mainLoopBind=this.mainLoop.bind(this);var Gamemode=require("./gamemodes");this.gameMode=Gamemode.get(this.config.serverGamemode);this.gameMode.onServerInit(this);var bind=this.config.clientBind+"";this.clientBind=bind.split(" - ");this.httpServer=http.createServer();var wsOptions={server:this.httpServer,perMessageDeflate:false,maxPayload:4096};Logger.info("WebSocket: "+this.config.serverWsModule);this.WebSocket=
require(this.config.serverWsModule);this.wsServer=new this.WebSocket.Server(wsOptions);this.wsServer.on("error",this.onServerSocketError.bind(this));this.wsServer.on("connection",this.onClientSocketOpen.bind(this));this.httpServer.listen(this.config.serverPort,this.config.serverBind,this.onHttpServerOpen.bind(this));if(this.config.serverStatsPort>0)this.startStatsServer(this.config.serverStatsPort)};
GameServer.prototype.onHttpServerOpen=function(){setTimeout(this.timerLoopBind,1);Logger.info("Listening on port "+this.config.serverPort);Logger.info("Current game mode is "+this.gameMode.name);if(this.config.serverBots){for(var i=0;i<this.config.serverBots;i++)this.bots.addBot();Logger.info("Added "+this.config.serverBots+" player bots")}};
GameServer.prototype.addNode=function(node){var x=node.position.x;var y=node.position.y;var s=node._size;node.quadItem={cell:node,bound:{minx:x-s,miny:y-s,maxx:x+s,maxy:y+s}};this.quadTree.insert(node.quadItem);this.nodes.push(node);node.onAdd(this)};
GameServer.prototype.onServerSocketError=function(error){Logger.error("WebSocket: "+error.code+" - "+error.message);switch(error.code){case "EADDRINUSE":Logger.error("Server could not bind to port "+this.config.serverPort+"!");Logger.error("adad.");break;case "EACCES":Logger.error("Please make sure you are running MultiOgar-Edited with root privileges.");break}process.exit(1)};
GameServer.prototype.onClientSocketOpen=function(ws,req){var req=req||ws.upgradeReq;var logip=ws._socket.remoteAddress+":"+ws._socket.remotePort;ws.on("error",function(err){});if(this.config.serverMaxConnections&&this.socketCount>=this.config.serverMaxConnections){ws.close(1E3);return}if(this.checkIpBan(ws._socket.remoteAddress)){ws.close(1E3);return}if(this.config.serverIpLimit){var ipConnections=0;for(var i=0;i<this.clients.length;i++){var socket=this.clients[i];if(!socket.isConnected||socket.remoteAddress!=
ws._socket.remoteAddress)continue;ipConnections++}if(ipConnections>=this.config.serverIpLimit){ws.close(1E3);return}}if(this.config.clientBind.length&&req.headers.origin.indexOf(this.clientBind)<0){ws.close(1E3);return}ws.isConnected=true;ws.remoteAddress=ws._socket.remoteAddress;ws.remotePort=ws._socket.remotePort;ws.lastAliveTime=Date.now();var PlayerTracker=require("./PlayerTracker");ws.playerTracker=new PlayerTracker(this,ws);var PacketHandler=require("./PacketHandler");ws.packetHandler=new PacketHandler(this,
ws);var PlayerCommand=require("./modules/PlayerCommand");ws.playerCommand=new PlayerCommand(this,ws.playerTracker);var self=this;ws.on("message",function(message){if(self.config.serverWsModule==="uws")message=parseInt(process.version[1])<6?new Buffer(message):Buffer.from(message);if(!message.length)return;if(message.length>256){ws.close(1009);return}ws.packetHandler.handleMessage(message)});ws.on("error",function(error){ws.packetHandler.sendPacket=function(data){}});ws.on("close",function(reason){if(ws._socket&&
ws._socket.destroy!=null&&typeof ws._socket.destroy=="function")ws._socket.destroy();self.socketCount--;ws.isConnected=false;ws.packetHandler.sendPacket=function(data){};ws.closeReason={reason:ws._closeCode,message:ws._closeMessage};ws.closeTime=Date.now()});this.socketCount++;this.clients.push(ws);this.checkMinion(ws,req)};
GameServer.prototype.checkMinion=function(ws,req){if(!req.headers["user-agent"]||!req.headers["cache-control"]||req.headers["user-agent"].length<50)ws.playerTracker.isMinion=true;if(this.config.serverMinionThreshold)if((ws.lastAliveTime-this.startTime)/1E3>=this.config.serverMinionIgnoreTime){if(this.minionTest.length>=this.config.serverMinionThreshold){ws.playerTracker.isMinion=true;for(var i=0;i<this.minionTest.length;i++){var playerTracker=this.minionTest[i];if(!playerTracker.socket.isConnected)continue;
playerTracker.isMinion=true}if(this.minionTest.length)this.minionTest.splice(0,1)}this.minionTest.push(ws.playerTracker)}if(this.config.serverMinions&&!ws.playerTracker.isMinion)for(var i=0;i<this.config.serverMinions;i++){this.bots.addMinion(ws.playerTracker);ws.playerTracker.minionControl=true}};
GameServer.prototype.checkIpBan=function(ipAddress){if(!this.ipBanList||!this.ipBanList.length||ipAddress=="127.0.0.1")return false;if(this.ipBanList.indexOf(ipAddress)>=0)return true;var ipBin=ipAddress.split(".");if(ipBin.length!=4)return false;var subNet2=ipBin[0]+"."+ipBin[1]+".*.*";if(this.ipBanList.indexOf(subNet2)>=0)return true;var subNet1=ipBin[0]+"."+ipBin[1]+"."+ipBin[2]+".*";if(this.ipBanList.indexOf(subNet1)>=0)return true;return false};
GameServer.prototype.setBorder=function(width,height){var hw=width/2;var hh=height/2;this.border={minx:-hw,miny:-hh,maxx:hw,maxy:hh,width:width,height:height}};GameServer.prototype.getRandomColor=function(){var colorRGB=[255,7,Math.random()*256>>0];colorRGB.sort(function(){return.5-Math.random()});return{r:colorRGB[0],g:colorRGB[1],b:colorRGB[2]}};
GameServer.prototype.removeNode=function(node){node.isRemoved=true;this.quadTree.remove(node.quadItem);node.quadItem=null;var i=this.nodes.indexOf(node);if(i>-1)this.nodes.splice(i,1);i=this.movingNodes.indexOf(node);if(i>-1)this.movingNodes.splice(i,1);node.onRemove(this)};
GameServer.prototype.updateClients=function(){var len=this.clients.length;for(var i=0;i<len;){if(!this.clients[i]){i++;continue}this.clients[i].playerTracker.checkConnection();if(this.clients[i].playerTracker.isRemoved)this.clients.splice(i,1);else i++}for(var i=0;i<len;i++){if(!this.clients[i])continue;this.clients[i].playerTracker.updateTick()}for(var i=0;i<len;i++){if(!this.clients[i])continue;this.clients[i].playerTracker.sendUpdate()}for(var i=0,test=this.minionTest.length;i<test;){if(!this.minionTest[i]){i++;
continue}var date=new Date-this.minionTest[i].connectedTime;if(date>this.config.serverMinionInterval)this.minionTest.splice(i,1);else i++}};
GameServer.prototype.updateLeaderboard=function(){this.leaderboard=[];this.leaderboardType=-1;this.gameMode.updateLB(this,this.leaderboard);if(!this.gameMode.specByLeaderboard){var clients=this.clients.valueOf();clients.sort(function(a,b){return b.playerTracker._score-a.playerTracker._score});this.largestClient=null;if(clients[0])this.largestClient=clients[0].playerTracker}else this.largestClient=this.gameMode.rankOne};
GameServer.prototype.onChatMessage=function(from,to,message){if(!message)return;message=message.trim();if(message==="")return;if(from&&message.length&&message[0]=="/"){message=message.slice(1,message.length);from.socket.playerCommand.executeCommandLine(message);return}if(!this.config.serverChat||from&&from.isMuted)return;if(message.length>64)message=message.slice(0,64);if(this.config.serverChatAscii)for(var i=0;i<message.length;i++)if((message.charCodeAt(i)<32||message.charCodeAt(i)>127)&&from){this.sendChatMessage(null,
from,"ad!");return}if(this.checkBadWord(message)&&from&&this.config.badWordFilter===1){this.sendChatMessage(null,from,"\uc544\ucfe0\uc544\ud30c\ud2f0 \uc11c\ubc84\uc5d0\uc11c \uc695\uc124\uc744 \uc0ac\uc6a9\ud558\uc9c0 \ub9c8\uc138\uc694 ! feat \uc9c0\ub8b0(\ubc14\uc774\ub7ec\uc2a4)!");return}this.sendChatMessage(from,to,message)};
GameServer.prototype.checkBadWord=function(value){if(!value)return false;value=value.toLowerCase().trim();if(!value)return false;for(var i=0;i<this.badWords.length;i++)if(value.indexOf(this.badWords[i])>=0)return true;return false};
GameServer.prototype.sendChatMessage=function(from,to,message){for(var i=0,len=this.clients.length;i<len;i++){if(!this.clients[i])continue;if(!to||to==this.clients[i].playerTracker){var Packet=require("./packet");if(this.config.separateChatForTeams&&this.gameMode.haveTeams){if(from==null||from.team===this.clients[i].playerTracker.team)this.clients[i].packetHandler.sendPacket(new Packet.ChatMessage(from,message))}else this.clients[i].packetHandler.sendPacket(new Packet.ChatMessage(from,message))}}};
GameServer.prototype.timerLoop=function(){var timeStep=40;var ts=Date.now();var dt=ts-this.timeStamp;if(dt<timeStep-5){setTimeout(this.timerLoopBind,timeStep-5);return}if(dt>120)this.timeStamp=ts-timeStep;this.updateTimeAvg+=.5*(this.updateTime-this.updateTimeAvg);this.timeStamp+=timeStep;setTimeout(this.mainLoopBind,0);setTimeout(this.timerLoopBind,0)};
GameServer.prototype.mainLoop=function(){var $jscomp$this=this;this.stepDateTime=Date.now();var tStart=process.hrtime();var self=this;if(this.tickCounter>this.config.serverRestart){var QuadNode=require("./modules/QuadNode.js");this.httpServer=null;this.wsServer=null;this.run=true;this.lastNodeId=1;this.lastPlayerId=1;if(this.config.serverBots){for(var i=0;i<this.config.serverBots;i++)this.bots.addBot();Logger.info("Added "+this.config.serverBots+" player bots")}for(var i=0;i<this.clients.length;i++){var client=
this.clients[i];client.close()}this.nodes=[];this.nodesVirus=[];this.nodesFood=[];this.nodesEjected=[];this.nodesPlayer=[];this.movingNodes=[];this.commands;this.tickCounter=0;this.startTime=Date.now();this.setBorder(this.config.borderWidth,this.config.borderHeight);this.quadTree=new QuadNode(this.border,64,32)}if(this.run){this.movingNodes.forEach(function(cell){if(cell.isRemoved)return;$jscomp$this.boostCell(cell);$jscomp$this.quadTree.find(cell.quadItem.bound,function(check){var m=self.checkCellCollision(cell,
check);if(cell.cellType==3&&check.cellType==3&&!self.config.mobilePhysics)self.resolveRigidCollision(m);else self.resolveCollision(m)});if(!cell.isMoving)$jscomp$this.movingNodes=null});var eatCollisions=[];this.nodesPlayer.forEach(function(cell){if(cell.isRemoved)return;$jscomp$this.quadTree.find(cell.quadItem.bound,function(check){var m=self.checkCellCollision(cell,check);if(self.checkRigidCollision(m))self.resolveRigidCollision(m);else if(check!=cell)eatCollisions.unshift(m)});$jscomp$this.movePlayer(cell,
cell.owner);$jscomp$this.boostCell(cell);$jscomp$this.autoSplit(cell,cell.owner);if(($jscomp$this.tickCounter+3)%25===0)$jscomp$this.updateSizeDecay(cell);if(cell.owner.isMinion){cell.owner.socket.close(1E3);$jscomp$this.removeNode(cell)}});eatCollisions.forEach(function(m){$jscomp$this.resolveCollision(m)});if(this.tickCounter%this.config.spawnInterval===0)this.spawnCells();this.gameMode.onTick(this);this.tickCounter++}if(!this.run&&this.gameMode.IsTournament)this.tickCounter++;this.updateClients();
if((this.tickCounter+7)%25===0)this.updateLeaderboard();if(this.config.serverTracker&&this.tickCounter%750===0)this.pingServerTracker();var tEnd=process.hrtime(tStart);this.updateTime=tEnd[0]*1E3+tEnd[1]/1E6};
GameServer.prototype.movePlayer=function(cell,client){if(client.socket.isConnected==false||client.frozen||!client.mouse)return;var d=client.mouse.clone().sub(cell.position);var move=cell.getSpeed(d.sqDist());if(!move)return;cell.position.add(d,move);var time=this.config.playerRecombineTime,base=Math.max(time,cell._size*.2)*25;if(!time||client.rec||client.mergeOverride){cell._canRemerge=cell.boostDistance<100;return}cell._canRemerge=cell.getAge()>=base};
GameServer.prototype.updateSizeDecay=function(cell){var rate=this.config.playerDecayRate,cap=this.config.playerDecayCap;if(!rate||cell._size<=this.config.playerMinSize)return;if(cap&&cell._mass>cap)rate*=10;var decay=1-rate*this.gameMode.decayMod;cell.setSize(Math.sqrt(cell.radius*decay))};
GameServer.prototype.boostCell=function(cell){if(cell.isMoving&&!cell.boostDistance||cell.isRemoved){cell.boostDistance=0;cell.isMoving=false;return}var speed=cell.boostDistance/9;cell.boostDistance-=speed;cell.position.add(cell.boostDirection,speed);cell.checkBorder(this.border);this.updateNodeQuad(cell)};
GameServer.prototype.autoSplit=function(cell,client){if(client.rec)var maxSize=1E9;else maxSize=this.config.playerMaxSize;if(client.mergeOverride||cell._size<maxSize)return;if(client.cells.length>=this.config.playerMaxCells||this.config.mobilePhysics)cell.setSize(maxSize);else{var angle=Math.random()*2*Math.PI;this.splitPlayerCell(client,cell,angle,cell._mass*.5)}};
GameServer.prototype.updateNodeQuad=function(node){var item=node.quadItem.bound;item.minx=node.position.x-node._size;item.miny=node.position.y-node._size;item.maxx=node.position.x+node._size;item.maxy=node.position.y+node._size;this.quadTree.remove(node.quadItem);this.quadTree.insert(node.quadItem)};GameServer.prototype.checkCellCollision=function(cell,check){var p=check.position.clone().sub(cell.position);return{cell:cell,check:check,d:p.sqDist(),p:p}};
GameServer.prototype.checkRigidCollision=function(m){if(!m.cell.owner||!m.check.owner)return false;if(m.cell.owner!=m.check.owner)if(this.gameMode.haveTeams&&m.check.owner.isMi||m.cell.owner.isMi&&this.config.minionCollideTeam===0)return false;else return this.gameMode.haveTeams&&m.cell.owner.team==m.check.owner.team;var r=this.config.mobilePhysics?1:13;if(m.cell.getAge()<r||m.check.getAge()<r)return false;return!m.cell._canRemerge||!m.check._canRemerge};
GameServer.prototype.resolveRigidCollision=function(m){var push=(m.cell._size+m.check._size-m.d)/m.d;if(push<=0||m.d==0)return;var rt=m.cell.radius+m.check.radius;var r1=push*m.cell.radius/rt;var r2=push*m.check.radius/rt;m.cell.position.sub2(m.p,r2);m.check.position.add(m.p,r1)};
GameServer.prototype.resolveCollision=function(m){var cell=m.cell;var check=m.check;if(cell._size>check._size){cell=m.check;check=m.cell}if(cell.isRemoved||check.isRemoved)return;check.div=this.config.mobilePhysics?20:3;if(m.d>=check._size-cell._size/check.div)return;if(cell.owner&&cell.owner==check.owner){if(cell.getAge()<13||check.getAge()<13)return}else if(check._size<cell._size*1.15||!check.canEat(cell))return;check.onEat(cell);cell.onEaten(check);cell.killedBy=check;this.removeNode(cell)};
GameServer.prototype.splitPlayerCell=function(client,parent,angle,mass){var size=Math.sqrt(mass*100);var size1=Math.sqrt(parent.radius-size*size);if(!size1||size1<this.config.playerMinSize)return;parent.setSize(size1);var newCell=new Entity.PlayerCell(this,client,parent.position,size);newCell.setBoost(this.config.splitVelocity*Math.pow(size,.0122),angle);this.addNode(newCell)};
GameServer.prototype.randomPos=function(){return new Vec2(this.border.minx+this.border.width*Math.random(),this.border.miny+this.border.height*Math.random())};
GameServer.prototype.spawnCells=function(){var maxCount=this.config.foodMinAmount-this.nodesFood.length;var spawnCount=Math.min(maxCount,this.config.foodSpawnAmount);for(var i=0;i<spawnCount;i++){var cell=new Entity.Food(this,null,this.randomPos(),this.config.foodMinSize);if(this.config.foodMassGrow){var maxGrow=this.config.foodMaxSize-cell._size;cell.setSize(cell._size+=maxGrow*Math.random())}cell.color=this.getRandomColor();this.addNode(cell)}if(this.nodesVirus.length<this.config.virusMinAmount){var virus=
new Entity.Virus(this,null,this.randomPos(),this.config.virusMinSize);if(!this.willCollide(virus))this.addNode(virus)}};
GameServer.prototype.spawnPlayer=function(player,pos){if(this.disableSpawn)return;var size=this.config.playerStartSize;if(player.spawnmass)size=player.spawnmass;var index=~~(this.nodesEjected.length*Math.random());var eject=this.nodesEjected[index];if(Math.random()<=this.config.ejectSpawnPercent&&eject&&eject.boostDistance<1){pos=eject.position.clone();player.color=eject.color;size=Math.max(size,eject._size*1.15)}var cell=new Entity.PlayerCell(this,player,pos,size);if(this.willCollide(cell)&&!player.isMi)pos=
this.randomPos();this.addNode(cell);player.mouse=new Vec2(pos.x,pos.y)};GameServer.prototype.willCollide=function(cell){var notSafe=false;var sqSize=cell.radius;var pos=this.randomPos();var d=cell.position.clone().sub(pos);if(d.dist()+sqSize<=sqSize*2)notSafe=true;this.quadTree.find({minx:cell.position.x-cell._size,miny:cell.position.y-cell._size,maxx:cell.position.x+cell._size,maxy:cell.position.y+cell._size},function(n){if(n.cellType==0)notSafe=true});return notSafe};
GameServer.prototype.splitCells=function(client){var $jscomp$this=this;var cellToSplit=[];for(var i=0;i<client.cells.length;i++)cellToSplit.push(client.cells[i]);cellToSplit.forEach(function(cell){var d=client.mouse.clone().sub(cell.position);if(d.dist()<1)d.x=1,d.y=0;if(cell._size<$jscomp$this.config.playerMinSplitSize)return;if(client.rec)var max=200;else max=$jscomp$this.config.playerMaxCells;if(client.cells.length>=max)return;$jscomp$this.splitPlayerCell(client,cell,d.angle(),cell._mass*.5)})};
GameServer.prototype.canEjectMass=function(client){if(client.lastEject===null){client.lastEject=this.tickCounter;return true}var dt=this.tickCounter-client.lastEject;if(dt<this.config.ejectCooldown)return false;client.lastEject=this.tickCounter;return true};
GameServer.prototype.ejectMass=function(client){if(!this.canEjectMass(client)||client.frozen)return;for(var i=0;i<client.cells.length;i++){var cell=client.cells[i];if(cell._size<this.config.playerMinEjectSize)continue;var d=client.mouse.clone().sub(cell.position);var sq=d.sqDist();d.x=sq>1?d.x/sq:1;d.y=sq>1?d.y/sq:0;var loss=this.config.ejectSizeLoss;loss=cell.radius-loss*loss;cell.setSize(Math.sqrt(loss));var pos=new Vec2(cell.position.x+d.x*cell._size,cell.position.y+d.y*cell._size);var angle=d.angle()+
Math.random()*.6-.3;if(!this.config.ejectVirus)var ejected=new Entity.EjectedMass(this,null,pos,this.config.ejectSize);else ejected=new Entity.Virus(this,null,pos,this.config.ejectSize);ejected.color=cell.color;ejected.setBoost(this.config.ejectVelocity,angle);this.addNode(ejected)}};GameServer.prototype.shootVirus=function(parent,angle){var pos=parent.position.clone();var newVirus=new Entity.Virus(this,null,pos,this.config.virusMinSize);newVirus.setBoost(this.config.virusVelocity,angle);this.addNode(newVirus)};
GameServer.prototype.loadFiles=function(){var fs=require("fs");var fileNameConfig=this.srcFiles+"/gameserver.ini";var ini=require(this.srcFiles+"/modules/ini.js");try{if(!fs.existsSync(fileNameConfig)){Logger.warn("Config not found... Generating new config");fs.writeFileSync(fileNameConfig,ini.stringify(this.config),"utf-8")}else{var load=ini.parse(fs.readFileSync(fileNameConfig,"utf-8"));for(var key in load)if(this.config.hasOwnProperty(key))this.config[key]=load[key];else Logger.error("Unknown gameserver.ini value: "+
key)}}catch(err){Logger.error(err.stack);Logger.error("Failed to load "+fileNameConfig+": "+err.message)}Logger.setVerbosity(this.config.logVerbosity);Logger.setFileVerbosity(this.config.logFileVerbosity);var fileNameBadWords=this.srcFiles+"/badwords.txt";try{if(!fs.existsSync(fileNameBadWords))Logger.warn(fileNameBadWords+" not found");else{var words=fs.readFileSync(fileNameBadWords,"utf-8");words=words.split(/[\r\n]+/);words=words.map(function(arg){return arg.trim().toLowerCase()});words=words.filter(function(arg){return!!arg});
this.badWords=words;Logger.info(this.badWords.length+" bad words loaded")}}catch(err$0){Logger.error(err$0.stack);Logger.error("Failed to load "+fileNameBadWords+": "+err$0.message)}var UserRoleEnum=require(this.srcFiles+"/enum/UserRoleEnum");var fileNameUsers=this.srcFiles+"/enum/userRoles.json";try{this.userList=[];if(!fs.existsSync(fileNameUsers)){Logger.warn(fileNameUsers+" is missing.");return}var usersJson=fs.readFileSync(fileNameUsers,"utf-8");var list=JSON.parse(usersJson.trim());for(var i=
0;i<list.length;){var item=list[i];if(!item.hasOwnProperty("ip")||!item.hasOwnProperty("password")||!item.hasOwnProperty("role")||!item.hasOwnProperty("name")){list.splice(i,1);continue}if(!item.password||!item.password.trim()){Logger.warn('User account "'+item.name+'" disabled');list.splice(i,1);continue}if(item.ip)item.ip=item.ip.trim();item.password=item.password.trim();if(!UserRoleEnum.hasOwnProperty(item.role)){Logger.warn("Unknown user role: "+item.role);item.role=UserRoleEnum.USER}else item.role=
UserRoleEnum[item.role];item.name=(item.name||"").trim();i++}this.userList=list;Logger.info(this.userList.length+" user records loaded.")}catch(err$1){Logger.error(err$1.stack);Logger.error("Failed to load "+fileNameUsers+": "+err$1.message)}var fileNameIpBan=this.srcFiles+"/ipbanlist.txt";try{if(fs.existsSync(fileNameIpBan)){this.ipBanList=fs.readFileSync(fileNameIpBan,"utf8").split(/[\r\n]+/).filter(function(x){return x!=""});Logger.info(this.ipBanList.length+" IP ban records loaded.")}else Logger.warn(fileNameIpBan+
" is missing.")}catch(err$2){Logger.error(err$2.stack);Logger.error("Failed to load "+fileNameIpBan+": "+err$2.message)}this.config.serverRestart=this.config.serverRestart===0?Infinity:this.config.serverRestart*1500};
GameServer.prototype.startStatsServer=function(port){this.stats="Test";this.getStats();this.httpServer=http.createServer(function(req,res){res.setHeader("Access-Control-Allow-Origin","*");res.writeHead(200);res.end(this.stats)}.bind(this));this.httpServer.on("error",function(err){Logger.error("Stats Server: "+err.message)});var getStatsBind=this.getStats.bind(this);this.httpServer.listen(port,function(){Logger.info("Started stats server on port "+port);setInterval(getStatsBind,this.config.serverStatsUpdate*
1E3)}.bind(this))};
GameServer.prototype.getStats=function(){var totalPlayers=0;var alivePlayers=0;var spectatePlayers=0;for(var i=0,len=this.clients.length;i<len;i++){var socket=this.clients[i];if(!socket||!socket.isConnected||socket.playerTracker.isMi)continue;totalPlayers++;if(socket.playerTracker.cells.length)alivePlayers++;else spectatePlayers++}var s={"server_name":this.config.serverName,"server_chat":this.config.serverChat?"true":"false","border_width":this.border.width,"border_height":this.border.height,"gamemode":this.gameMode.name,
"max_players":this.config.serverMaxConnections,"current_players":totalPlayers,"alive":alivePlayers,"spectators":spectatePlayers,"update_time":this.updateTimeAvg.toFixed(3),"uptime":Math.round((this.stepDateTime-this.startTime)/1E3/60),"start_time":this.startTime};this.stats=JSON.stringify(s)};
GameServer.prototype.pingServerTracker=function(){var os=require("os");var totalPlayers=0;var alivePlayers=0;var spectatePlayers=0;var robotPlayers=0;for(var i=0,len=this.clients.length;i<len;i++){var socket=this.clients[i];if(!socket||socket.isConnected==false)continue;if(socket.isConnected==null)robotPlayers++;else{totalPlayers++;if(socket.playerTracker.cells.length)alivePlayers++;else spectatePlayers++}}var data="current_players="+totalPlayers+"&alive="+alivePlayers+"&spectators="+spectatePlayers+
"&max_players="+this.config.serverMaxConnections+"&sport="+this.config.serverPort+"&gamemode=[**] "+this.gameMode.name+"&agario=true"+"&name=Unnamed Server"+"&opp="+os.platform()+" "+os.arch()+"&uptime="+process.uptime()+"&version=MultiOgar-Edited "+this.version+"&start_time="+this.startTime;trackerRequest({host:"ogar.mivabe.nl",port:80,path:"/master",method:"POST"},"application/x-www-form-urlencoded",data)};
function trackerRequest(options,type,body){if(options.headers==null)options.headers={};options.headers["user-agent"]="MultiOgar-Edited"+this.version;options.headers["content-type"]=type;options.headers["content-length"]=body==null?0:Buffer.byteLength(body,"utf8");var req=http.request(options,function(res){if(res.statusCode!=200){Logger.writeError("[Tracker]["+options.host+"]: statusCode = "+res.statusCode);return}res.setEncoding("utf8")});req.on("error",function(err){Logger.writeError("[Tracker]["+
options.host+"]: "+err)});req.shouldKeepAlive=false;req.on("close",function(){req.destroy()});req.write(body);req.end()};