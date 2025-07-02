const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('loginScreen');
const characterSelect = document.getElementById('characterSelect');
const characterList = document.getElementById('characterList');
const mainPanel = document.getElementById('mainPanel');
const characterNameDisplay = document.getElementById('characterNameDisplay');
const characterRankDisplay = document.getElementById('characterRankDisplay');
const characterAvatar = document.getElementById('characterAvatar');

const addMemberBtn = document.getElementById('addMemberBtn');

let loggedUserRole = null; // tu zapiszemy rolę użytkownika

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('https://tablet-organizacyjny-vrp.onrender.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('loggedInUser', data.username);
            localStorage.setItem('userRole', data.role); // zapisujemy rolę
            loggedUserRole = data.role;

            loadCharacters({ character: data.character });

            loginScreen.classList.add('hidden');
            characterSelect.classList.remove('hidden');
        } else {
            alert('Niepoprawna nazwa użytkownika lub hasło.');
        }
    } catch (error) {
        alert('Błąd połączenia z serwerem.');
        console.error(error);
    }
});

function loadCharacters(user) {
    characterList.innerHTML = '';
    const char = user.character;
    if (char) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-type">${char.type}</div>
            <h3>${char.name}</h3>
            <p>Ranga: ${char.type}</p>
            <p>Status: Active</p>
        `;
        card.addEventListener('click', () => selectCharacter(char));
        characterList.appendChild(card);
    }
}

function selectCharacter(character) {
    characterSelect.classList.add('hidden');
    mainPanel.classList.remove('hidden');
    characterNameDisplay.textContent = character.name;
    characterRankDisplay.textContent = character.type;
    characterAvatar.src = `https://placehold.co/100x100?text=${character.type}`;

    // Po załadowaniu panelu ustaw widoczność przycisku na podstawie roli:
    updateUIByRole();
}

function updateUIByRole() {
    const role = loggedUserRole || localStorage.getItem('userRole');

    if (role === 'admin') {
        addMemberBtn.style.display = 'inline-block'; // pokaż przycisk
    } else {
        addMemberBtn.style.display = 'none'; // ukryj przycisk
    }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    loggedUserRole = null;

    mainPanel.classList.add('hidden');
    characterSelect.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});
