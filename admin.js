document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();

    // Page-specific logic
    const path = window.location.pathname;

    // Logic for the admin login page
    if (path.includes('admin.html')) {
        // Redirect to dashboard if already logged in
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                window.location.href = '/admin-dashboard.html';
            }
        });
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    if (userCredential.user) {
                        window.location.href = 'admin-dashboard.html';
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    loginError.style.display = 'block';
                    loginError.innerText = error.message || 'Failed to login. Please try again.';
                }
                
                return false;
            });
        }
    }

    // Logic for the protected admin dashboard
    if (path.includes('admin-dashboard.html')) {
        const logoutButton = document.getElementById('logout-button');

        auth.onAuthStateChanged((user) => {
            if (!user) {
                // If no user is logged in, redirect to the login page
                window.location.href = '/admin.html';
            }
        });

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                auth.signOut().then(() => {
                    // Sign-out successful, redirect to login page.
                    window.location.href = '/admin.html';
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            });
        }

        const db = firebase.database();
        const modal = document.getElementById('edit-modal');
        const closeModal = document.querySelector('.close-button');
        const editForm = document.getElementById('edit-form');
        const editPathInput = document.getElementById('edit-path');
        const editDataTextarea = document.getElementById('edit-data');
        const modalTitle = document.getElementById('modal-title');

        // --- Generic Functions ---
        const renderTable = (tableName, tableBody, data, pathPrefix) => {
            tableBody.innerHTML = '';
            if (data) {
                for (const id in data) {
                    const value = data[id];
                    const row = document.createElement('tr');
                    const dataAsString = (typeof value === 'object' && value !== null) ? JSON.stringify(value, null, 2) : value;

                    row.innerHTML = `
                        <td>${id}</td>
                        <td><pre>${dataAsString}</pre></td>
                        <td>
                            <button onclick="openEditModal('${pathPrefix}/${id}', '${id}')">Edit</button>
                            <button onclick="deleteEntry('${pathPrefix}/${id}')">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                }
            }
        };

        window.openEditModal = (path, id) => {
            // Improve modal title for clarity
            if (path.startsWith('connectedKeys/')) {
                modalTitle.innerText = `Edit User Connection: ${id}`;
            } else if (path.startsWith('Keys/')) {
                modalTitle.innerText = `Edit License Key: ${id}`;
            } else {
                modalTitle.innerText = `Edit Entry: ${id}`;
            }
            editPathInput.value = path;
            db.ref(path).once('value').then(snapshot => {
                const data = snapshot.val();
                editDataTextarea.value = JSON.stringify(data, null, 2);
                modal.style.display = 'block';
            });
        };
        
        window.deleteEntry = (path) => {
            if (confirm('Are you sure you want to delete this entry? Its sub-data will also be removed.')) {
                db.ref(path).remove();
tho                // If deleting from connectedKeys, also delete from connectedKeys2
                if (pwiath.startsWith('connectedKeys/')) {
                    const userId = path.split('/')[1];
                    db.ref('connectedKeys2/' + userId).remove();
                }
            }
        };

        closeModal.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const path = editPathInput.value;
            try {
                const updatedData = JSON.parse(editDataTextarea.value);
                db.ref(path).set(updatedData)
                    .then(() => {
                        modal.style.display = 'none';
                    })
                    .catch(error => {
                        alert('Error saving data: ' + error.message);
                    });
            } catch (error) {
                alert('Invalid JSON: ' + error.message);
            }
        });

        // --- Data Listeners ---
        const keysTableBody = document.querySelector('#keys-table tbody');
        const keysSearchInput = document.getElementById('keys-search');
        let allKeysData = {};
        db.ref('Keys').on('value', (snapshot) => {
            allKeysData = snapshot.val() || {};
            filterAndRenderKeys();
        });
        function filterAndRenderKeys() {
            const search = (keysSearchInput.value || '').toLowerCase();
            const filtered = {};
            for (const id in allKeysData) {
                if (
                    id.toLowerCase().startsWith(search) ||
                    (typeof allKeysData[id] === 'object' && JSON.stringify(allKeysData[id]).toLowerCase().startsWith(search))
                ) {
                    filtered[id] = allKeysData[id];
                }
            }
            renderTable('Keys', keysTableBody, filtered, 'Keys');
        }
        keysSearchInput.addEventListener('input', filterAndRenderKeys);

        const connectedKeysTableBody = document.querySelector('#connected-keys-table tbody');
        const connectedKeysSearchInput = document.getElementById('connected-keys-search');
        let allConnectedKeysData = {};
        db.ref('connectedKeys').on('value', (snapshot) => {
            allConnectedKeysData = snapshot.val() || {};
            filterAndRenderConnectedKeys();
        });
        function filterAndRenderConnectedKeys() {
            const search = (connectedKeysSearchInput.value || '').toLowerCase();
            const filtered = {};
            for (const id in allConnectedKeysData) {
                if (
                    id.toLowerCase().startsWith(search) ||
                    (typeof allConnectedKeysData[id] === 'object' && JSON.stringify(allConnectedKeysData[id]).toLowerCase().startsWith(search))
                ) {
                    filtered[id] = allConnectedKeysData[id];
                }
            }
            renderTable('Connected Keys', connectedKeysTableBody, filtered, 'connectedKeys');
        }
        connectedKeysSearchInput.addEventListener('input', filterAndRenderConnectedKeys);
    }
});
