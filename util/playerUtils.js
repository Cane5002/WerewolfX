const fs = require('fs');

exports.isPlayer = function isPlayer(sid, players) {
    if (players.find(p => p.sessionId == sid)) return true;
    return false;
}

exports.getPlayerByName = function getPlayerByName(name, players) {
    return players.find(p => p.nickname == name);
}

exports.getPlayerByCodeName = function getPlayerByCodeName(codename, players) {
    return players.find(p => p.codename == codename);
}

exports.initPlayerData = function initPlayerData(players, roles) {
    let shuffledRoles = shuffle(roles)
    let codenames = getCodenames(players.length)

    players.forEach((p, i) => {
        p.codename = codenames[i];
        p.role = shuffledRoles[i];
    })

    return players;
}

function getCodenames(cnt) {
    const contents = fs.readFileSync("codenames.json", {encoding: 'utf8', flag: 'r'})
    let allNames = JSON.parse(contents).codenames

    let names = []
    for (let i = 0; i < cnt; i++) {
        let index = randomNumber(allNames.length)
        names.push(allNames[index])
        allNames.splice(index, 1)
    }

    return names;
}

function shuffle(array) {
    let shuffled = []
    for (let i = (array.length-1); i >= 0; i--) {
        let index = randomNumber(i)
        shuffled.push(array[index])
        array.splice(index, 1)
    }

    return shuffled;
}

function randomNumber(max) {
    return Math.floor(Math.random() * max)
}