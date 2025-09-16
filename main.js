document.oncontextmenu = function (e) {
	e.preventDefault();
	return false;
};
/* document.onkeydown = function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
        return false;
    }
    if (e.key === "F12") {
        return false;
    }
};
 */
(function () {
	const headerDiv = document.getElementById("header");
	function initHamburgerMenu() {
		const hamburger = document.querySelector(".hamburger-menu");
		const nav = document.querySelector(".header-nav");
		if (!hamburger || !nav) return;
		hamburger.addEventListener("click", () => {
			hamburger.classList.toggle("active");
			nav.classList.toggle("active");
		});
		document.addEventListener("click", (e) => {
			if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
				hamburger.classList.remove("active");
				nav.classList.remove("active");
			}
		});
	}
	if (headerDiv) {
		fetch("header.html")
			.then((res) => res.text())
			.then((html) => {
				headerDiv.innerHTML = html;
				initHamburgerMenu();
			});
	} else {
		initHamburgerMenu();
	}
})();

particlesJS("particles-js", {
  "particles": {
    "number": {
      "value": 120,
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": "#ffffff"
    },
    "shape": {
      "type": "circle",
      "stroke": {
        "width": 0,
        "color": "#000000"
      },
      "polygon": {
        "nb_sides": 5
      },
      "image": {
        "src": "img/github.svg",
        "width": 100,
        "height": 100
      }
    },
    "opacity": {
      "value": 1,
      "random": true,
      "anim": {
        "enable": true,
        "speed": 1,
        "opacity_min": 0,
        "sync": false
      }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": {
        "enable": false,
        "speed": 4,
        "size_min": 0.3,
        "sync": false
      }
    },
    "line_linked": {
      "enable": false,
      "distance": 150,
      "color": "#ffffff",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 1,
      "direction": "none",
      "random": true,
      "straight": false,
      "out_mode": "out",
      "bounce": false,
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 600
      }
    }
  },
  "interactivity": {
    "detect_on": "window",
    "events": {
      "onhover": {
        "enable": true,
        "mode": "grab"
      },
      "onclick": {
        "enable": true,
        "mode": "push"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 150,
        "line_linked": {
          "opacity": 1
        }
      },
      "push": {
        "particles_nb": 8
      },
    }
  }
});
