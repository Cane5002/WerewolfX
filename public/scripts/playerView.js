const script = document.getElementById('playerViewScript');
const roomCode = script.getAttribute('roomCode');
const playerId = parseInt(script.getAttribute('playerId'));
var players_ = [];
var player_;
var gameData_;
var isMayor;

console.log(`rc: ${roomCode} | pid: ${playerId}`);

const playerStream = new EventSource(`https://adder-clean-clam.ngrok-free.app/${roomCode}/stream/game`);

playerStream.onmessage = function (ev) {
    let dayChanged = false;
    if (!player_) dayChanged = true;

    let data = JSON.parse(ev.data);
    if (data.players) {
        players_ = data.players;
        player_ = players_.find(p => p.id==playerId);
    }
    if (data.gameData) {
        if (!gameData_ || data.gameData.night!=gameData_.night) dayChanged = true;
        gameData_ = data.gameData;
        if (gameData_.mayorPID == playerId) isMayor = true;
        else isMayor = false;
    }

    updateInfo();
    if (dayChanged) updateRole();
}

playerStream.onerror = function () {
    console.log("Player Stream error: Closing...");
    playerStream.close();
}

const updateInfoDiv = document.getElementById('updateInfo');

function updateInfo() {
    removeChildNodes(updateInfoDiv);

    updateInfoDiv.appendChild(isPowerAvailableDiv());
    if (isMayor) updateInfoDiv.appendChild(isMayorPowerAvailableDiv());
    
    let mayorInfoDiv = document.createElement('div');
    if (gameData_.mayorPID==-1) mayorInfoDiv.textContent = "No mayor - Werewolves kill by player name";
    else mayorInfoDiv.textContent = "Mayor in office - Werewolves kill by codename"
    updateInfoDiv.appendChild(mayorInfoDiv);

    if (player_ && player_.role=="Werewolf") {
        let myVoteDiv = document.createElement('div');
        myVoteDiv.textContent = `My Vote: ${player_.vote}`;
        updateInfoDiv.appendChild(myVoteDiv);
    }
}

const updateRoleDiv = document.getElementById('updateRole');

function updateRole() {
    removeChildNodes(updateRoleDiv);
    if (isMayor) updateMayor();
    if (!player_) return;
    switch(player_.role) {
        case "Villager":
            updateVillager();
            break;
        case "Seer": 
            updateSeer();
            break;
        case "PI":
            updatePI();
            break;
        case "Werewolf":
            updateWerewolf();
            break;
        case "Minion":
            updateMinion();
            break;
    }
}

function updateVillager() {
    let seerDiv = document.createElement('div');
    seerDiv.textContent = "Seer (one-time):"
    updateRoleDiv.appendChild(seerDiv);

    let seerInput = document.createElement('input');
    seerInput.type = "text";
    seerInput.name = "seerCodename";
    seerInput.id = "seerCodename";
    updateRoleDiv.appendChild(seerInput);
    
    let seerBtn = document.createElement('button');
    seerBtn.textContent = "Check Codename";
    seerBtn.addEventListener('click', function() {
        seer(seerInput.value)
        .then(data => {
            if (data.alert) {
                alert(data.alert);
            }
            else if (data.werewolf) {
                alert("WEREWOLF!!!")
            }
            else {
                alert("Failed to see anything of note");
            }
        })
    })
    updateRoleDiv.appendChild(seerBtn);

    let piDiv = document.createElement('div');
        piDiv.textContent = "PI (one-time):"
    updateRoleDiv.appendChild(piDiv);

    let piInput = document.createElement('input');
    piInput.type = "text";
    piInput.name = "piCodename";
    piInput.id = "piCodename";
    updateRoleDiv.appendChild(piInput);
    
    let piBtn = document.createElement('button');
    piBtn.textContent = "Check Codename";
    piBtn.addEventListener('click', function() {
        pi(piInput.value)
        .then(data => {
            if (data.alert) {
                alert(data.alert);
            }
            else if (data.real) {
                alert("Real codename")
            }
            else {
                alert("False codename");
            }
        })
    })
    updateRoleDiv.appendChild(piBtn);
}

function updateSeer() {
    if (gameData_.night) {
        let seerDiv = document.createElement('div');
        seerDiv.textContent = "Seer:"
        updateRoleDiv.appendChild(seerDiv);

        let codenameInput = document.createElement('input');
        codenameInput.type = "text";
        codenameInput.name = "seerCodename";
        codenameInput.id = "seerCodename";
        updateRoleDiv.appendChild(codenameInput);
        
        let seerBtn = document.createElement('button');
        seerBtn.textContent = "Check Codename";
        seerBtn.addEventListener('click', function() {
            seer(codenameInput.value)
            .then(data => {
                if (data.alert) {
                    alert(data.alert);
                }
                else if (data.werewolf) {
                    alert("WEREWOLF!!!")
                }
                else {
                    alert("Not a werewolf");
                }
            })
        })
        updateRoleDiv.appendChild(seerBtn);
    }
}

async function seer(codename) {
    let response = await fetch(`/${roomCode}/role/seer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ codename: codename })
    });
    return response.json();
}


function updatePI() {
    if (gameData_.night) {
        let piDiv = document.createElement('div');
        piDiv.textContent = "PI:"
        updateRoleDiv.appendChild(piDiv);

        let codenameInput = document.createElement('input');
        codenameInput.type = "text";
        codenameInput.name = "piCodename";
        codenameInput.id = "piCodename";
        updateRoleDiv.appendChild(codenameInput);
        
        let piBtn = document.createElement('button');
        piBtn.textContent = "Check Codename";
        piBtn.addEventListener('click', function() {
            pi(codenameInput.value)
            .then(data => {
                if (data.alert) {
                    alert(data.alert);
                }
                else if (data.real) {
                    alert("Real codename")
                }
                else {
                    alert("False codename");
                }
            })
        })
        updateRoleDiv.appendChild(piBtn);
    }
}

async function pi(codename) {
    let response = await fetch(`/${roomCode}/role/pi`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ codename: codename })
    });
    return response.json();
}

function updateMayor() {
    if (gameData_.night) {
        let mayorDiv = document.createElement('div');
        mayorDiv.textContent = "Mayor:"
        updateRoleDiv.appendChild(mayorDiv);

        let targetInput = document.createElement('input');
        targetInput.type = "text";
        targetInput.name = "targetName";
        targetInput.id = "targetName";
        updateRoleDiv.appendChild(targetInput);

        let mayorBtn = document.createElement('button');
        mayorBtn.textContent ="Investigate Target";
        mayorBtn.addEventListener('click', function() {
            mayor(targetInput.value)
            .then(data => {
                if (data.alert) {
                    alert(data.alert);
                }
                else if (data.codename) {
                    alert(`Codename is : ${data.codename}`);
                }
                else {
                    alert("Check Failed");
                }
            })
        })
        updateRoleDiv.appendChild(mayorBtn);
    }
}

async function mayor(name) {
    let response = await fetch(`/${roomCode}/role/mayor`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name })
    });
    return response.json();
}

function updateWerewolf() {
    console.log("update ww");

    let wwCodenamesDiv = document.createElement('div');
    wwCodenames = ""
    players_.forEach(p => {
        if (p.role=="Werewolf") wwCodenames+=`${p.codename} `;
    });
    wwCodenamesDiv.textContent = `Werewolf codenames: ${wwCodenames}`;
    updateRoleDiv.appendChild(wwCodenamesDiv);


    if (gameData_.night) {
        let werewolfDiv = document.createElement('div');
        werewolfDiv.textContent = "Werewolf:"
        updateRoleDiv.appendChild(werewolfDiv);

        let targetInput = document.createElement('input');
        targetInput.type = "text";
        targetInput.name = "targetName";
        targetInput.id = "targetName";
        updateRoleDiv.appendChild(targetInput);

        let wwBtn = document.createElement('button');
        wwBtn.textContent ="Kill Target";
        wwBtn.addEventListener('click', function() {
            vote(targetInput.value)
            .then(() => {
                console.log("target submitted");
            })
        })
        updateRoleDiv.appendChild(wwBtn);
    }
}

async function vote(vote) {
    response = fetch(`/${roomCode}/vote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vote: vote })
    });
    return response;
}

function isPowerAvailableDiv() {
    let powerDiv = document.createElement('div');
    if (player_) powerDiv.textContent = (player_.canPower ? "Power Available" : "Power Unavailable" );
    return powerDiv;
}

function isMayorPowerAvailableDiv() {
    let powerDiv = document.createElement('div');
    if (gameData_) powerDiv.textContent = (gameData_.canMayorPower ? "Mayor Power Available" : "Mayor Power Unavailable" );
    return powerDiv;
}

function removeChildNodes(parent) {
    if(!parent.firstChild) return;
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function updateMinion() {
    if (gameData_.night) {
        let minionDiv = document.createElement('div');
        minionDiv.textContent = "Minion:"
        updateRoleDiv.appendChild(minionDiv);

        let targetInput = document.createElement('input');
        targetInput.type = "text";
        targetInput.name = "targetName";
        targetInput.id = "targetName";
        updateRoleDiv.appendChild(targetInput);

        let minionBtn = document.createElement('button');
        minionBtn.textContent ="Steal codename";
        minionBtn.addEventListener('click', function() {
            minion(targetInput.value)
            .then(data => {
                if (data.alert) {
                    alert(data.alert);
                }
                else if (data.codename) {
                    alert(`Codename is : ${data.codename}`);
                }
                else {
                    alert("Check Failed");
                }
            })
        })
        updateRoleDiv.appendChild(minionBtn);
    }
}

async function minion(name) {
    let response = await fetch(`/${roomCode}/role/minion`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: name })
    });
    return response.json();
}