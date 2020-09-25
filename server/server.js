'use strict';

const http = require('http');
const WSServer = require('socket.io');
const WSAuth = require('socketio-auth');
const mysql = require('mysql');
const config = require('./config');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'movies'
})
const httpServer = http.createServer( errorOnView );
const io = new WSServer( httpServer );

const auth = new WSAuth( io, {
  authenticate: onAuthenticate,
  postAuthenticate: onAuthenticated,
  disconnect: onDisconnected,
  timeout: 1000000  // TODO for some reason it fails to connect without this. need to investigate further
} );
db.connect(function(err){
    if (err) console.log(err)
})
const sockets = {};

// TODO dummy initial data
const items = [];
var users=[];
// Log any errors connected to the db
db.connect(function(err){
    if (err) console.log(err)
})

httpServer.listen( config.port, function onListenStarted() {
  console.log("Server started");
} );

io.on( 'connection', (socket) => {
  console.log("Connected");

  socket.on( 'disconnecting', (reason) => {
    console.log("Disconnecting: " + reason);
    cleanupClientSocketData( socket );
  } );
  socket.on( 'disconnect', (reason) => {
    console.log("Disconnect: " + reason);
  } );
  socket.on( 'error', (err) => {
    console.log("Error: " + err);
  } );

  socket.on( 'cmd', cmd => onCommand( socket, cmd ) );
} );

function cleanupClientSocketData( socket ) {
  if( sockets[socket.id] ) {
    clearInterval( sockets[socket.id].timerID );
    delete sockets[socket.id];
  }
}

function errorOnView( req, res ) {
  res.writeHead(500);
  res.end("Not viewable");
}

function onAuthenticate( socket, data, cb ) {
   console.log("On auth");
  const loginInfo = JSON.parse(data);
  // TODO proper verify logic from db etc
   var username = loginInfo.userName;
   var password = loginInfo.password ;
   db.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
 
 console.log("results"+results);
 console.log("fields"+fields);
 if(results.length > 0){const authPassed =true;
 cb( null, authPassed );} else {const authPassed =false; cb( null, authPassed );}
 //const authPassed = loginInfo.userName === config.userName && loginInfo.password === config.password;
 
  //cb( null, authPassed );
   });
  
}

function onAuthenticated( socket, data ) {
  console.log("Authenticated");

  // for test purpose, send some heartbeat events to client
  const timerID = setInterval( () => socket.emit('event', { type: 'hb', data: Date.now() } ), config.heartbeatMS );

  sockets[socket.id] = { timerID: timerID };
}

function onDisconnected( socket ) {
  console.log("Disconnected");
}

function onCommand( socket, cmd ) {
  console.log( 'cmd:' + cmd.type );

  switch( cmd.type ) {
   
    case 'snap':
	var queryStatement = "SELECT * FROM movies ORDER BY id";
	db.query(queryStatement, function (err, rows, fields) {
				if (err) { throw err; }
				console.log("rows"+rows);
				rows.forEach( i =>
        socket.emit( 'event', { type: 'itemadded', data: i } )
      );
			});
	
	 break;
   


  
    case 'additem':
   // items.push( cmd.data );
	
   var insertStatement = "INSERT INTO movies SET ?";
   var domainArr = {
			//ColumnName: domain...
			id:cmd.data.id,
			value: cmd.data.value,
			rating:cmd.data.rating
		};
     console.log(domainArr);
	 db.query(insertStatement, domainArr, function (err, result) {
				
	});
     io.emit( 'event', { type: 'itemadded', data: cmd.data } );
	  
      break;
	  
	  
	  
    case 'updateitem':
      const item = items.find( i => i.id === cmd.data.id );
     // item.value = cmd.data.value;
	  var queryStatement = "UPDATE movies SET value = ?  where id=?";

	  db.query(queryStatement, [cmd.data.value,cmd.data.id], function (err, rows, fields) {
				if (err) { throw err; }
				console.log(rows);
				
			});
	   	  io.emit( 'event', { type: 'itemupdated', data: cmd.data.id } );
      
      break;
	  
	  
	  
    case 'delitem':
      const idx = items.findIndex( i => i.id === cmd.data.id );
    items.splice( idx, 1 );
	  
	  var queryStatement = "DELETE FROM movies WHERE id = ?";
      db.query(queryStatement, [cmd.data.id], function (err, rows, fields) {
				if (err) { throw err; }
				console.log(rows);
				
				});
      io.emit( 'event', { type: 'itemdeleted', data: cmd.data.id} );
      break;
	  
	   case 'ratingpdated':
	   console.log("rating rating *****");
      const itemr = items.find( i => i.id === cmd.data.id );
      //itemr.value = cmd.data.value;
	  var queryStatement = "UPDATE movies SET rating = ? where id=?";

	  db.query(queryStatement, [cmd.data.rating,cmd.data.id], function (err, rows, fields) {
				if (err) { throw err; }
				console.log(rows);
				
			});
	   	  io.emit( 'event', { type: 'ratingpdated', data: cmd.data.id } );
      
      break;
	  
  }
}


