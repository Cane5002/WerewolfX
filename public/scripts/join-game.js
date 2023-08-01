var address = "localhost:3000";

document.addEventListener('DOMContentLoaded', function() {
    
    const submit = document.getElementById('submit');
    submit.addEventListener('click', function() {
        let roomCode = document.getElementById('roomCode').value;
        postPlayer({
            roomCode: roomCode,
            name: document.getElementById('name').value
        })
        .then(data => {
            if (data.alert) {
                alert(data.alert);
            }
            else {
                window.location.href = roomCode;
            }
        })
    })

})

async function postPlayer(body) {
    let response = await fetch("/join", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    return response.json();
}