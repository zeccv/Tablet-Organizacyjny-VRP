
const users = [
    { username: 'admin', password: CryptoJS.SHA256('admin123').toString(), character: { id: 1, name: 'Samir Makajew', type: 'Boss' } },
    { username: 'user1', password: CryptoJS.SHA256('password1').toString(), character: { id: 2, name: 'John Doe', type: 'Lieutenant' } },
    { username: 'user2', password: CryptoJS.SHA256('password2').toString(), character: { id: 3, name: 'Jane Smith', type: 'Soldier' } }
];

const loginForm = document.getElementById('loginForm');
const loginScreen = document.getElementById('loginScreen');
const characterSelect = document.getElementById('characterSelect');
const characterList = document.getElementById('characterList');
const mainPanel = document.getElementById('mainPanel');
const characterNameDisplay = document.getElementById('characterNameDisplay');
const characterRankDisplay = document.getElementById('characterRankDisplay');
const characterAvatar = document.getElementById('characterAvatar');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const hashedPassword = CryptoJS.SHA256(password).toString();

    const user = users.find(user => user.username === username && user.password === hashedPassword);
    if (user) {
        localStorage.setItem('loggedInUser', username);
        loginScreen.classList.add('hidden');
        loadCharacters(user);
        characterSelect.classList.remove('hidden');
    } else {
        alert('Niepoprawna nazwa użytkownika lub hasło.');
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
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    mainPanel.classList.add('hidden');
    characterSelect.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});
