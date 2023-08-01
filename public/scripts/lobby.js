const url = window.location.href;
if (url.lastIndexOf('/')==(url.length-1)) url=url.substring(0,url.length-1);
const roomCode = url.substring(url.lastIndexOf('/')+1, url.length);

const lobbyStream = new EventSource(`https://adder-clean-clam.ngrok-free.app/${roomCode}/stream/lobby`);

lobbyStream.onmessage = function (ev) {
    let data = JSON.parse(ev.data)
    if (data.started) window.location.href = `${roomCode}/village`;
    if (data.players) updatePlayers(data.players);
}

lobbyStream.onerror = function () {
    console.log("Player Stream error: Closing...");
    playerStream.close();
}

const playerList = document.getElementById('players');

function updatePlayers(players) {
    removeChildNodes(playerList);
    players.forEach((p) => {
        addPlayer(p);
    })
    setPlayerCnt(players.length);
}

function addPlayer(player) {
    let playerDiv = document.createElement('div');
    playerDiv.textContent = player.name;
    let removePlayerBtn = document.createElement('button');
    removePlayerBtn.textContent = "-";
    removePlayerBtn.addEventListener('click', function() {
        removePlayer(player.id).then(() => {
            console.log("removed player");
        });
    });
    playerDiv.appendChild(removePlayerBtn);
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
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

const startGameBtn = document.getElementById('startGameBtn');
startGameBtn.addEventListener('click', function() {
    console.log('Start Game');
    startGame().then(() => {
        console.log("go to village")
        window.location.href = `${roomCode}/village`;
    })
})

async function startGame() {
    let response = await fetch(`/${roomCode}/start`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}

const currentPlayerCntr = document.getElementById('currentPlayerCnt');

function setPlayerCnt(cnt) {
    currentPlayerCntr.textContent = cnt;
    let maxPlayerCnt = parseInt(document.getElementById('maxPlayerCnt').textContent)
    if (cnt==maxPlayerCnt) startGameBtn.disabled = false;
    else true;
}