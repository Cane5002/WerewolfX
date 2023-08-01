var express = require('express');
var router = express.Router();
var db = require('../util/db');
var modUtil = require('../util/moderatorUtils');

router.get('/', (req, res) => {
    if (res.locals.gameSettings) {
        if (res.locals.gameSettings.started) {
            res.redirect('/'+res.locals.gameSettings.roomCode+'/village');
        }
        else {
            res.render('lobby', { gameSettings: res.locals.gameSettings });
        }
    }
    else res.redirect(400, '/join');
})

router.post('/start', db.getPlayers, db.startGame, (req, res) => {
    console.log("posted")
    res.status(201).send();
});

var streamRouter = require('./stream');
router.use('/stream', streamRouter);

router.get('/village', db.getPlayer, modUtil.isModerator, (req, res) => {
    let playerId = -1;
    if (res.locals.player) playerId = res.locals.player.id;
    res.render('game/village', {    playerId: playerId, 
                                    mayorId: res.locals.gameSettings.gameData.mayorId,
                                    isModerator: res.locals.isModerator,
                                    roomCode: res.locals.gameSettings.roomCode,
                                    time: (res.locals.gameSettings.gameData.night ? "Night" : "Day"),
                                    dayCnt: res.locals.gameSettings.gameData.dayCnt });
})

router.post('/gameData', db.updateGameData, (req, res) => {
    res.status(201).send();
})
router.put('/phase', db.updateGameData, db.resetPower, (req, res) => {
    res.status(201).send();
})

router.post('/vote', db.getPlayer, db.vote, (req, res) => {
    res.status(201).send();
})
router.delete('/vote', db.resetVote, (req, res) => {
    res.status(201).send();
})
router.post('/mayor', db.updateGameData, (req, res) => {
    res.status(201).send();
})
router.put('/mayor', db.updateGameData, db.resetVote, (req, res) => {
    res.status(201).send();
})

var roleRouter = require('./roles');
router.use('/role', roleRouter);

router.route('/player/:playerId')
.get(db.getPlayer, (req, res) => {
    let playerId = -1;
    if (res.locals.player) playerId = res.locals.player.id;
    if (playerId!=req.params.playerId) res.redirect('/'+res.locals.gameSettings.roomCode+'/village');
    res.render('game/playerView', { roomCode: res.locals.gameSettings.roomCode, player: res.locals.player });
})
.put((req, res) => {

})
.delete(db.removePlayer, (req, res) => {
    res.status(201).send();
})

router.delete('/endGame', db.deletePlayers, db.deleteGame, (req, res) => {
    res.status(201).send();
})

module.exports = router;