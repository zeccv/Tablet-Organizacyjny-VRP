// Przykładowa lista użytkowników
const users = [
    { email: 'user1@example.com', password: 'password123' },
    { email: 'user2@example.com', password: 'mypassword' }
];

// Login Form
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Sprawdzenie, czy e-mail i hasło są poprawne
    const user = users.find(user => user.email === email && user.password === password);
    
    if (user) {
        // Zaloguj użytkownika
        localStorage.setItem('loggedInUser ', email);
        loginScreen.classList.add('hidden');
        loadCharacters();
        characterSelect.classList.remove('hidden');
    } else {
        alert('Niepoprawny e-mail lub hasło. Spróbuj ponownie.');
    }
});
