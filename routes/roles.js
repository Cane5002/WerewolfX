var express = require('express');
var router = express.Router();
var db = require('../util/db');
var modUtil = require('../util/moderatorUtils');

router.post('/seer', db.getPlayers, db.usePower, (req, res) => {
    let target = res.locals.players.find(p => p.codename.toLowerCase()==req.body.codename.toLowerCase())
    let wwBool = false;
    if (target) wwBool = (target.role=="Werewolf");
    res.status(201).json( { werewolf: wwBool, alert: res.locals.alert } );
})

router.post('/pi', db.getPlayers, db.usePower, (req, res) => {
    let target = res.locals.players.find(p => p.codename.toLowerCase()==req.body.codename.toLowerCase())
    let realBool = false;
    if (target) realBool = true;
    res.status(201).json( { real: realBool, alert: res.locals.alert } );
})

router.post('/mayor', db.getPlayers, db.useMayorPower, (req, res) => {
    let target = res.locals.players.find(p => p.name.toLowerCase()==req.body.name.toLowerCase())
    let codename = null;
    if (target) codename = target.codename;
    res.status(201).json( { codename: codename, alert: res.locals.alert } );
})

router.post('/minion', db.getPlayers, db.usePower, (req, res) => {
    let target = res.locals.players.find(p => p.name.toLowerCase()==req.body.name.toLowerCase())
    let codename = null;
    if (target) codename = target.codename;
    res.status(201).json( { codename: codename, alert: res.locals.alert } );
})

module.exports = router;