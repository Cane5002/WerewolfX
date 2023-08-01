var address = "localhost:3000";

const roleList = ["Villager",
 "Seer",
  "Apprentice Seer",
  "PI",
  "Werewolf",
  "Minion",
  "Sorcerer"];

var playerCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    
    //Setup
    setPlayerCount(playerCount);
    
    const allRolesDiv = document.getElementById('allRoles');
    roleList.forEach((r) => {
        let div = document.createElement('div');
            div.class = "role";
            div.id = r;
            div.textContent = r + " ";
            let addRoleBtn = document.createElement('button');
                addRoleBtn.textContent = "+"
                addRoleBtn.addEventListener('click', function() {
                    addRole(r);
                })
                div.appendChild(addRoleBtn);
        allRolesDiv.appendChild(div);
    });

    const submitBtn = document.getElementById('submit');
    submitBtn.addEventListener('click', function() {
        // Build Game
        let roomCode = document.getElementById('roomCode').value;
        let roles = getRoles();
        let playerCnt = roles.length;
        let wwCnt = roles.filter(s => s == "Werewolf").length;
        let gameSettings = {
            roomCode: roomCode,
            playerCnt: playerCnt,
            gameData: {
                dayCnt: 0,
                night: false,
                roles: roles,
                candidates: [],
                event: 'na',
                mayorPID: -1,
                canMayorPower: false,
            }
        };
        
        postGameSettings(gameSettings)
        .then(data => {
            console.log(data);
            if (data.success) {
                window.location.href = data.roomCode;
            }
            else {
                let warning = document.createElement('sub');
                warning.style = "color:red";
                warning.textContent = "this code is already in use";
                document.getElementById('roomCodeSection').appendChild(warning);
            }
        });
    })

});

async function postGameSettings(gameSettings) {
    let response = await fetch("/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(gameSettings)
    });
    return response.json();
}

function setPlayerCount(count) {
    var playerCounter = document.getElementById('playerCnt');
    playerCounter.textContent = "Player Count: " + count;
}

function getRoles() {
    var rolesArray = [];
    var currentRoles = document.getElementById('currentRoles');
    var roleDivs = currentRoles.children;
    for (let i = 0; i < roleDivs.length; i++) {
        let roleDiv = roleDivs.item(i);
        let cnt = getChild(roleDiv, "roleCount");
        let role = getChild(roleDiv, "roleName");
        for (let j = 0; j < getCount(cnt); j++) {
            rolesArray.push(role.textContent);
        }
    }
    return rolesArray;
}

function addRole(role) {
    setPlayerCount(++playerCount);

    var roleDiv = document.getElementById(role + "Added");
    if (roleDiv==null) {
        console.log("not added yet");
        let currentRoles = document.getElementById('currentRoles');
            roleDiv = document.createElement('div');
            roleDiv.class = "role";
            roleDiv.id = role + "Added";
            let count = document.createElement('div');
                count.class = "roleCount";
                count.style = "float: left; padding: 5px";
                count.textContent = "1x";
                roleDiv.appendChild(count);
            let roleName = document.createElement('div');
                roleName.class = "roleName";
                roleName.style = "float: left; padding: 5px";
                roleName.textContent = role;
                roleDiv.appendChild(roleName);
            let removeRoleBtn = document.createElement('button');
                removeRoleBtn.textContent = "-";
                removeRoleBtn.type = "button";
                removeRoleBtn.addEventListener('click', function() {
                    removeRole(role);
                });
                roleDiv.appendChild(removeRoleBtn);
            let clearDiv = document.createElement('div');
                clearDiv.style = "clear:both";
                roleDiv.appendChild(clearDiv);
        currentRoles.appendChild(roleDiv);
    }
    else {
        let cntDiv = getChild(roleDiv, "roleCount");
        let cnt = getCount(cntDiv)
        ++cnt;
        cntDiv.textContent = cnt + "x";
    }
}

function removeRole(role) {
    setPlayerCount(--playerCount);
    
    var roleDiv = document.getElementById(role + "Added");
    var cntDiv = getChild(roleDiv, "roleCount");
    var cnt = getCount(cntDiv);
    
    if (cnt==1) {
        roleDiv.remove()
    }
    else {
        --cnt;
        cntDiv.textContent = cnt + "x";
    }
}

function getChild(parent, name) {
    var children = parent.children;
    for (let i = 0; i < children.length; i++) {
        let child = children.item(i);
        if (child.class == name) {
            return child;
        };
    }
}

function getCount(cntDiv) {
    return parseInt(cntDiv.textContent.substring(0, cntDiv.textContent.length-1))
}