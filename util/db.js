const sqlite3 = require('sqlite3');
const mkdirp = require('mkdirp');
const playerUtils = require('./playerUtils');

mkdirp.sync('var/db');

var db = new sqlite3.Database('var/db/werewolfx.db');

db.serialize(function() {
    // create db schema
    db.run("CREATE TABLE IF NOT EXISTS games ( \
        roomCode TEXT PRIMARY KEY, \
        moderatorSid TEXT, \
        started INTEGER, \
        playerCnt INTEGER, \
        gameData TEXT \
        )")

    db.run("CREATE TABLE IF NOT EXISTS players ( \
        id INTEGER PRIMARY KEY, \
        roomCode INTEGER NOT NULL, \
        sessionId TEXT NOT NULL, \
        name TEXT NOT NULL, \
        codename TEXT, \
        role TEXT, \
        canPower INTEGER NOT NULL, \
        vote TEXT \
        )")
    });
    
function getGame(req, res, next) {
    let roomCode;
    if (req.params.roomCode) roomCode = req.params.roomCode;
    if (req.body.roomCode) roomCode = req.body.roomCode;
    db.get("SELECT * FROM games WHERE roomCode=?", 
    roomCode, 
    (err, row) => {
        if (err) return next(err);
        
        if (!row) return next();
        
        let gameSettings = {
            roomCode: row.roomCode,
            started: (row.started==1 ? true : false),
            moderatorSid: row.moderatorSid,
            playerCnt: row.playerCnt,
            gameData: JSON.parse(row.gameData)
        }
        
        res.locals.gameSettings = gameSettings;
        next();
    })
}
    
function addGame(req, res, next) {
    db.run("INSERT INTO games (roomCode, started, moderatorSid, playerCnt, gameData) VALUES (?, ?, ?, ?, ?)",
        [req.body.roomCode, false, req.sessionID, req.body.playerCnt, JSON.stringify(req.body.gameData)],
        (err) => {
            if (err) {
                if (err.errno == 19) {
                    res.locals.success = false;
                    return next();
                }
                return next(err);
            }
            res.locals.success = true;
            next();
        });
};

function deleteGame(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    db.run("DELETE FROM games WHERE roomCode=?",
        [res.locals.gameSettings.roomCode],
        (err) => {
            if (err) return next(err);
            next();
        })
}

function startGame(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    console.log("Started? " + res.locals.gameSettings.started);
    if (res.locals.gameSettings.started) return next();
    console.log("Starting game...")
    db.run("UPDATE games SET started=? WHERE roomCode=?",
        [true, res.locals.gameSettings.roomCode],
        (err) => {
            if (err) return next(err);

            console.log("assigning codenames and roles");

            let players = playerUtils.initPlayerData(res.locals.players, res.locals.gameSettings.gameData.roles);
            console.log("Init players...")
            console.log(players);
            players.forEach(p => {
                console.log(`Assinging ${p.id}: ${p.codename} : ${p.role}`)
                db.run("UPDATE players SET codename=?, role=? WHERE id=?",
                    [p.codename, p.role, p.id],
                    (err) => {
                        if(err) {
                            console.log(err);
                            return next(err);
                        } 
                        next();
                    });
            });
        })

}

function updateGameData(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    db.run("UPDATE games SET gameData=? WHERE roomCode=?",
        [JSON.stringify(req.body.gameData), res.locals.gameSettings.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            next();
        })
}

function getPlayer(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    let roomCode = res.locals.gameSettings.roomCode;

    db.get("SELECT * FROM players WHERE roomCode=? AND sessionId=?",
        [roomCode, req.sessionID],
        (err, row) => {
            if (err) return next(err);
            
            if (row) {
                let player = {
                    id: row.id,
                    roomCode: row.roomCode,
                    sessionId: row.sessionId,
                    name: row.name,
                    codename: row.codename,
                    role: row.role,
                    canPower: (row.canPower==1 ? true : false),
                    vote: row.vote
                };
                res.locals.player = player;
            }

            next();
        });
}

function getPlayers(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    var players = [];
    let roomCode;
    if (res.locals.gameSettings) roomCode = res.locals.gameSettings.roomCode;
    if (req.params.roomCode) roomCode = req.params.roomCode;
    if (req.body.roomCode) roomCode = req.body.roomCode;
    db.all("SELECT * FROM players WHERE roomCode=?",
        roomCode,
        (err, rows) => {
            if (err) return next(err);

            if (rows) {
                rows.forEach((row) => {
                    let player = {
                        id: row.id,
                        roomCode: row.roomCode,
                        sessionId: row.sessionId,
                        name: row.name,
                        codename: row.codename,
                        role: row.role,
                        canPower: (row.canPower==1 ? true : false),
                        vote: row.vote
                    };
                    players.push(player);
                });
            }
            res.locals.players = players;
            next();
        });
}

function addPlayer(req, res, next) {
    if (!res.locals.gameSettings) {
        res.locals.alert = "Room \"" + req.body.roomCode + "\" doesn't exist";
        return next();
    }
    if (playerUtils.isPlayer(req.sessionID, res.locals.players)) {
        console.log("Already a player");
        return next();
    }
    console.log("current: " + res.locals.players.length + " | max: " + res.locals.gameSettings.playerCnt)
    if (res.locals.players.length==res.locals.gameSettings.playerCnt) {
        res.locals.alert = "Room full";
        return next();
    }
    db.run("INSERT INTO players (roomCode, sessionId, name, canPower) VALUES (?, ?, ?, ?)",
        [req.body.roomCode, req.sessionID, req.body.name, true],
        (err) => {
            if (err) return next(err);
            next();
        });
}

function removePlayer(req, res, next) {
    db.run("DELETE FROM players WHERE id=?",
        [req.params.playerId],
        (err) => {
            if (err) return next(err);
            next();
        });
}

function deletePlayers(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    db.run("DELETE FROM players WHERE roomCode=?",
        [res.locals.gameSettings.roomCode],
        (err) => {
            if (err) return next(err);
            next();
        });
}

const dailyPowerRoles = ["Werewolf", "Seer", "Minion", "PI"]
function resetPower(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    let roleQuery = `role="${dailyPowerRoles[0]}"`
    for (let i = 1; i < dailyPowerRoles.length; i++ ) {
        roleQuery += ` OR role="${dailyPowerRoles[i]}"`
    }

    let query = `UPDATE players SET canPower=? WHERE roomCode=? AND (${roleQuery})`

    db.run(query,
        [true, res.locals.gameSettings.roomCode],
        (err) => {
            if (err) return next(err);
            next();
        })
}

function usePower(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    let roomCode = res.locals.gameSettings.roomCode;
    let sessionId = req.sessionID;
    let player = res.locals.players.find(p => p.roomCode==roomCode && p.sessionId==sessionId)
    if (player && !player.canPower) {
        res.locals.alert = "Already used power";
        return next();
    }
    db.run("UPDATE players SET canPower=? WHERE roomCode=? AND sessionId=?",
        [false, roomCode, sessionId], 
        (err) => {
            if (err) return next(err);
            next();
        });
}

function useMayorPower(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    if (!res.locals.gameSettings.gameData.canMayorPower) {
        res.locals.alert = "Already used power";
        return next();
    }
    req.body.gameData = res.locals.gameSettings.gameData;
    req.body.gameData.canMayorPower = false;
    updateGameData(req, res, next);
}

function resetVote(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    db.run("UPDATE players SET vote=? WHERE roomCode=?",
        [null, res.locals.gameSettings.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            next();
        })
}

function vote(req, res, next) {
    if (!res.locals.gameSettings) return next(new Error("game doesn't exist"));
    db.run("UPDATE players SET vote=? WHERE id=?",
        [req.body.vote, res.locals.player.id],
        (err) => {
            if (err) return next(err);
            next();
        });
}

module.exports = { db, 
    addGame, deleteGame, getGame, startGame, 
    updateGameData,
    addPlayer, getPlayer, getPlayers, removePlayer, deletePlayers,
    resetPower, usePower, useMayorPower, 
    resetVote, vote };

