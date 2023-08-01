var express = require('express');
var router = express.Router();
var db = require('../util/db');

router.get('/lobby', (req, res) => {
    console.log('Player Stream connection opened');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.body = { roomCode: res.locals.gameSettings.roomCode };

    const playerInterval = setInterval(() => {
        db.getGame(req, res, ()=>{return});
        db.getPlayers(req, res, ()=> {return});
        res.write('data: ' + JSON.stringify({ players: res.locals.players,
                                              started: res.locals.gameSettings.started }) + '\n\n');
    }, 1000);

    res.on('close', () => {
        console.log('Player Stream connection closed');
        clearInterval(playerInterval);
        res.end();
    });
})

router.get('/game', (req, res) => {
    console.log('Start Stream connection opened');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.body = { roomCode: res.locals.gameSettings.roomCode };

    const playerInterval = setInterval(() => {
        db.getGame(req, res, ()=> {return});
        db.getPlayers(req, res, ()=> {return});
        res.write('data: ' + JSON.stringify({ players: res.locals.players,
                                              gameData: res.locals.gameSettings.gameData }) + '\n\n');
    }, 1000);

    res.on('close', () => {
        console.log('Start Stream connection closed');
        clearInterval(playerInterval);
        res.end();
    });
})

module.exports = router;