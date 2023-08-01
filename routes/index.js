var express = require('express');
var router = express.Router();
var db = require('../util/db');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/create', (req, res) => {
    res.render('create-game');
});
router.post('/create', db.addGame, (req, res) => {
    res.status(201).json({ success: res.locals.success, roomCode: req.body.roomCode });
});

router.get('/join', (req, res) => {
    res.render('join-game');
});
router.post('/join', db.getGame, db.getPlayers, db.addPlayer, (req, res) => {
    res.status(201).json( { alert: res.locals.alert } );
})

var gameRouter = require('./game');
router.use('/:roomCode', db.getGame, gameRouter);

module.exports = router;