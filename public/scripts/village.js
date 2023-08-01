const script = document.getElementById('villageScript');
const roomCode = script.getAttribute('roomCode');
const isModerator = (script.getAttribute('isModerator')=='true' ? true : false);
const playerId = parseInt(script.getAttribute('playerId'));
var players_ = [];
var gameData_;

console.log(`RC:${roomCode} | IM:${isModerator} | PID:${playerId}`)

const villageStream = new EventSource(`https://adder-clean-clam.ngrok-free.app/${roomCode}/stream/game`);

villageStream.onmessage = function (ev) {
    let data = JSON.parse(ev.data);
    if (data.players) updatePlayers(data.players);
    if (data.gameData) updateGameData(data.gameData);
}

villageStream.onerror = function () {
    console.log("Village Stream error: Closing...");
    villageStream.close();
}

const playerList = document.getElementById('players');

function updatePlayers(players) {
    removeChildNodes(playerList);
    players_ = players;
    players.forEach((p) => {
        addPlayer(p);
    })

    if (playerId!=-1 && gameData_.event=="lynch") {
        let voteSleepButton = document.createElement('button');
        voteSleepButton.textContent = "Go to sleep"
        voteSleepButton.addEventListener('click', function() {
            vote("Go to sleep")
            .then(() => {
                console.log("voted");
            });
        })
        playerList.appendChild(voteSleepButton);

        let resetVoteButton = document.createElement('button');
        resetVoteButton.textContent = "Cancel vote"
        resetVoteButton.addEventListener('click', function() {
            vote(null)
            .then(() => {
                console.log("voted");
            });
        })
        playerList.appendChild(resetVoteButton);
    }
    
}

function addPlayer(player) {
    let playerDiv = document.createElement('div');
    if(isModerator) {
        playerDiv.textContent = `${player.name}: codename ${player.codename} | ${player.role}` 
        
        let boldText = document.createElement('b');
        boldText.textContent = (player.vote ? ` - vote: ${player.vote}` : "");
        playerDiv.appendChild(boldText);

        let electBtn = document.createElement('button');
        electBtn.textContent = "elect mayor";
        electBtn.addEventListener('click', function() {
            setMayor(player.id).then(() => {
                console.log("mayor set " + player.id);
            });
        })
        playerDiv.appendChild(electBtn);

        let removePlayerBtn = document.createElement('button');
        removePlayerBtn.textContent = "kill player";
        removePlayerBtn.addEventListener('click', function() {
            removePlayer(player.id).then(() => {
                console.log("removed player");
            })
        });
        playerDiv.appendChild(removePlayerBtn);
    } 
    else {
        playerDiv.textContent = player.name;
    }
    if (playerId!=-1 && gameData_.event=="lynch") {
        let voteBtn = document.createElement('button');
        voteBtn.textContent = "Vote";
        voteBtn.addEventListener('click', function() {
            vote(player.name)
            .then(() => {
                console.log("voted");
            });
        });
        playerDiv.appendChild(voteBtn);
    }
    playerList.appendChild(playerDiv);
}

async function removePlayer(playerId) {
    let response = await fetch(`/${roomCode}/player/${playerId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}

function removeChildNodes(parent) {
    if(!parent.firstChild) return;
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function updateGameData(gameData) {
    gameData_ = gameData;
    updateDayCnt(gameData.night, gameData.dayCnt);
    updateMayor(gameData);
    updateHeaderInfo(gameData);
}

function updateDayCnt(time, dayCnt) {
    //console.log(`Update date: ${(time ? "Night" : "Day")} ${dayCnt}`);
    document.getElementById('time').textContent = (time ? "Night" : "Day");
    document.getElementById('cnt').textContent = dayCnt;
}

const mayorDiv = document.getElementById('mayor');

async function setMayor(mayorPID) {
    gameData_.mayorPID = mayorPID;
    gameData_.candidates = [];
    gameData_.event = 'na';
    let response = fetch(`/${roomCode}/mayor`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ gameData: gameData_ })
    });
    return response;
}

function updateMayor(gameData) {
    removeChildNodes(mayorDiv);
    if (gameData.mayorPID!=-1) {
        let mayorNameDiv = document.createElement('div');
        let mayor = players_.find(p => p.id==gameData.mayorPID);
        if (!mayor) return;
        mayorNameDiv.textContent = `Mayor: ${mayor.name}`
        mayorDiv.appendChild(mayorNameDiv);

        if(isModerator) {
            let removeMayorBtn = document.createElement('button');
            removeMayorBtn.textContent = "Remove Mayor"
            removeMayorBtn.addEventListener('click', function() {
                setMayor(-1)
                .then(() => {
                    console.log("removed mayor");
                })
            });
            mayorNameDiv.appendChild(removeMayorBtn);
        }
        if (playerId!=-1) {
            let challengeMayorBtn = document.createElement('button');
            challengeMayorBtn.textContent = "Challenge Mayor!"
            challengeMayorBtn.addEventListener('click', function() {
                let player = players_.find(p => p.id==playerId);
                addCandidates([
                        {
                            name: mayor.name,
                            codename: mayor.codename
                        },
                        {
                            name: player.name,
                            codename: player.codename
                        }
                ]).then(() => {
                    console.log("added Candidates");
                })
            });
            mayorNameDiv.appendChild(challengeMayorBtn);
        }
    }
    if (isModerator || gameData.event=='vote') {
        let candidateList = document.createElement('div');
        let header = document.createElement('div');
        header.textContent = "Candidates:";
        header.style = "font-weight: 900"
        candidateList.appendChild(header);

        gameData.candidates.forEach(c => {
            let candidateDiv = document.createElement('div');
            candidateDiv.textContent = `${c.name} - codename : ${c.codename}`
            candidateDiv.style = "padding-left: 10px"
            candidateList.appendChild(candidateDiv);

            if (playerId!=-1) {
                let voteBtn = document.createElement('button');
                voteBtn.textContent = "Vote";
                voteBtn.addEventListener('click', function() {
                    vote(c.name)
                    .then(() => {
                        console.log("voted");
                    });
                });
                candidateDiv.appendChild(voteBtn);
            }
        })
        mayorDiv.appendChild(candidateList);
    }
    if (playerId!=-1 && gameData.event=='run') {
        let runMayorBtn = document.createElement('button');
        runMayorBtn.textContent = "Run For Mayor!"
        runMayorBtn.addEventListener('click', function() {
            let player = players_.find(p => p.id==playerId);
            addCandidates([
                    {
                        pid: player.pid,
                        name: player.name,
                        codename: player.codename
                    }
            ]).then(() => {
                console.log("added Candidates");
            })
        });
        mayorDiv.appendChild(runMayorBtn);
    }
}

async function addCandidates(candidateData) {
    candidateData.forEach( c => {
        gameData_.candidates.push(c);
    })
    response = fetch(`/${roomCode}/gameData`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ gameData: gameData_ })
    });
    return response;
}

async function vote(name) {
    response = fetch(`/${roomCode}/vote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vote: name })
    });
    return response;
}

async function resetVote() {
    response = fetch(`/${roomCode}/vote`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}

const infoHeader = document.getElementById('info');

function updateHeaderInfo(gameData) {
    removeChildNodes(infoHeader);
    let player = players_.find(p => p.id==playerId);

    if (player) {
        if (gameData.candidates.find(c => c.codename==player.codename)) {
            console.log('you are running for mayor');
            let runningNotifDiv = document.createElement('div');
            runningNotifDiv.textContent = "You are running for mayor";
            infoHeader.appendChild(runningNotifDiv);
        }
        
        let myVoteDiv = document.createElement('div');
        myVoteDiv.textContent = `My Vote: ${player.vote}`;
        infoHeader.appendChild(myVoteDiv);
    }

}

const myPageDiv = document.getElementById("myPage");

if(playerId!=-1) {
    let link = document.createElement('a');
    link.textContent = "My Page";
    link.href = `player/${playerId}`;
    myPageDiv.appendChild(link);
}

const footer = document.getElementById("footer");

if(isModerator) {
    let modDiv = document.createElement('div');
    footer.appendChild(modDiv);

    let nextPhaseBtn = document.createElement('button');
    nextPhaseBtn.textContent = "Next phase";
    nextPhaseBtn.addEventListener('click', function () {
        nextDay()
        .then(() => {
            console.log("Day++");
        })
    });
    modDiv.appendChild(nextPhaseBtn);

    let endEventBtn = document.createElement('button');
    endEventBtn.textContent = "Reset vote";
    endEventBtn.addEventListener('click', function () {
        setEvent("na")
        .then(() => {
            console.log("Ending events");
            resetVote()
            .then(() => {
                console.log("Votes reset");
            })
        })
    });
    modDiv.appendChild(endEventBtn);

    let startMayorRunBtn = document.createElement('button');
    startMayorRunBtn.textContent = "Start Mayor Signup";
    startMayorRunBtn.addEventListener('click', function () {
        setEvent("run")
        .then(() => {
            console.log("Allow players to run for mayor");
        })
    });
    modDiv.appendChild(startMayorRunBtn);

    let startElectionBtn = document.createElement('button');
    startElectionBtn.textContent = "Start Election";
    startElectionBtn.addEventListener('click', function () {
        setEvent("vote")
        .then(() => {
            console.log("Start election");
        })
    });
    modDiv.appendChild(startElectionBtn);
    
    let startLynchBtn = document.createElement('button');
    startLynchBtn.textContent = "Start Lynching";
    startLynchBtn.addEventListener('click', function () {
        setEvent("lynch")
        .then(() => {
            console.log("Start Lynching");
        })
    });
    modDiv.appendChild(startLynchBtn);

    let breakElem = document.createElement('br');
    modDiv.appendChild(breakElem);
    let endGameBtn = document.createElement('button');
    endGameBtn.textContent = "End game";
    endGameBtn.addEventListener('click', function () {
        endGame()
        .then(() => {
            console.log("Ended game");
        })
    });
    modDiv.appendChild(endGameBtn);
}

async function nextDay() {
    if (gameData_.night) ++gameData_.dayCnt;
    else gameData_.canMayorPower = true;
    gameData_.night = !gameData_.night;

    let response = fetch(`/${roomCode}/phase`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ gameData: gameData_ })
    });
    return response;
}

async function setEvent(event) {
    gameData_.event = event;
    let response = fetch(`/${roomCode}/gameData`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ gameData: gameData_ })
    });
    return response;
}

async function endGame() {
    let response = fetch(`/${roomCode}/endGame`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}