document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();

    // Page-specific logic
    const path = window.location.pathname;

    // Logic for the admin login page
    if (path.includes('admin.html')) {
        console.log('Initializing admin login...');
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await user.getIdToken(true);
                console.log("ID token refreshed; admin claims should be current.");

                // Optional: now safely fetch /Configs or /Keys
                const configsRef = db.ref('Configs');
                configsRef.once('value').then(snapshot => {
                    console.log('Configs snapshot after refresh:', snapshot.val());
                });
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
        console.log('Initializing admin dashboard...');
        const logoutButton = document.getElementById('logout-button');

        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'admin.html';
            } else {
                // Force refresh token so custom claims (like admin) are up-to-date
                await user.getIdToken(true);
                console.log("ID token refreshed; admin claims should be current.");

                // Optional: now safely fetch /Configs or /Keys
                const configsRef = db.ref('Configs');
                configsRef.once('value').then(snapshot => {
                    console.log('Configs snapshot after refresh:', snapshot.val());
                });
            }
        });

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                auth.signOut().then(() => {
                    // Sign-out successful, redirect to login page.
                    window.location.href = 'admin.html';
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

                    // Only show delete button for Keys, not for Configs
                    const deleteButton = pathPrefix === 'Keys' ? 
                        `<button onclick="deleteEntry('${pathPrefix}/${id}')">Delete</button>` : 
                        '';

                    row.innerHTML = `
                        <td>${id}</td>
                        <td><pre>${dataAsString}</pre></td>
                        <td>
                            <button onclick="openEditModal('${pathPrefix}/${id}', '${id}')">Edit</button>
                            ${deleteButton}
                        </td>
                    `;
                    tableBody.appendChild(row);
                }
            }
        };

        window.openEditModal = (path, id) => {
            // Improve modal title for clarity
            if (path.startsWith('Configs/')) {
                modalTitle.innerText = `Edit Configuration: ${id}`;
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
                db.ref(path).remove()
                    .then(() => {
                        console.log('Successfully deleted:', path);
                    })
                    .catch(error => {
                        console.error('Error deleting entry:', error);
                        alert('Error deleting entry: ' + error.message);
                    });
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
        const configsTableBody = document.querySelector('#configs-table tbody');
        const configsSearchInput = document.getElementById('configs-search');
        let allConfigsData = {};
        
        if (!configsTableBody) {
            console.error('Could not find configs table body element');
            return;
        }
        
        // Try to fetch configs
        const configsRef = db.ref('Configs');
        console.log('Attempting to fetch configs...');
        
        configsRef.on('value', (snapshot) => {
            console.log('Configs snapshot received:', snapshot.exists() ? 'data exists' : 'no data');
            allConfigsData = snapshot.val() || {};
            filterAndRenderConfigs();
        }, (error) => {
            console.error('Error fetching configs:', error);
            if (configsTableBody) {
                configsTableBody.innerHTML = '<tr><td colspan="3">Error loading configs: ' + error.message + '</td></tr>';
            }
        });

        // Only add event listener if the search input exists
        if (configsSearchInput) {
            configsSearchInput.addEventListener('input', filterAndRenderConfigs);
        } else {
            console.warn('Configs search input not found');
        }

        const keysTableBody = document.querySelector('#keys-table tbody');
        const keysSearchInput = document.getElementById('keys-search');
        let allKeysData = {};
        
        // Try both 'Keys' and 'keys' paths
        const keysRef = db.ref('Keys');
        console.log('Attempting to fetch keys...');
        
        keysRef.on('value', (snapshot) => {
            console.log('Keys snapshot received:', snapshot.exists() ? 'data exists' : 'no data');
            allKeysData = snapshot.val() || {};
            filterAndRenderKeys();
        }, (error) => {
            console.error('Error fetching keys:', error);
            keysTableBody.innerHTML = '<tr><td colspan="3">Error loading keys: ' + error.message + '</td></tr>';
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

        function filterAndRenderConfigs() {
            const search = configsSearchInput ? configsSearchInput.value.toLowerCase() : '';
            const filtered = {};
            for (const id in allConfigsData) {
                if (
                    id.toLowerCase().includes(search) ||
                    (typeof allConfigsData[id] === 'object' && JSON.stringify(allConfigsData[id]).toLowerCase().includes(search))
                ) {
                    filtered[id] = allConfigsData[id];
                }
            }
            if (configsTableBody) {
                renderTable('Configs', configsTableBody, filtered, 'Configs');
            }
        }
    }
});
