// ===============================
// FILTER ELEMENTS
// ===============================

const city = document.getElementById("city");

const profession =
  document.getElementById("profession");

const opportunity =
  document.getElementById("opportunity");

const searchBtn =
  document.getElementById("searchBtn");

const clearBtn =
  document.getElementById("clearBtn");

const selectedFilters =
  document.getElementById("selectedFilters");


// ===============================
// RENDER SELECTED FILTERS
// ===============================

function renderSelectedFilters() {

  selectedFilters.innerHTML = "";

  const filters = [
    {
      name: "City",
      element: city
    },
    {
      name: "Profession",
      element: profession
    },
    {
      name: "Opportunity",
      element: opportunity
    }
  ];


  filters.forEach((filter) => {

    if (filter.element.value === "") {
      return;
    }


    const chip =
      document.createElement("div");

    chip.className = "filter-chip";


    chip.innerHTML = `
      <span>
        ${filter.element.value}
      </span>

      <button
        type="button"
        aria-label="Remove ${filter.name}">
        ×
      </button>
    `;


    // Remove individual filter

    const removeButton =
      chip.querySelector("button");


    removeButton.addEventListener(
      "click",
      () => {

        filter.element.value = "";

        renderSelectedFilters();

      }
    );


    selectedFilters.appendChild(chip);

  });

}


// ===============================
// DROPDOWN EVENTS
// ===============================

city.addEventListener(
  "change",
  renderSelectedFilters
);

profession.addEventListener(
  "change",
  renderSelectedFilters
);

opportunity.addEventListener(
  "change",
  renderSelectedFilters
);


// ===============================
// SEARCH BUTTON
// ===============================

searchBtn.addEventListener(
  "click",
  () => {

    renderSelectedFilters();


    const originalText =
      searchBtn.innerHTML;


    searchBtn.innerHTML =
      "✓ Filters Applied";


    setTimeout(() => {

      searchBtn.innerHTML =
        originalText;

    }, 1200);

  }
);


// ===============================
// CLEAR ALL
// ===============================

clearBtn.addEventListener(
  "click",
  () => {

    city.value = "";

    profession.value = "";

    opportunity.value = "";

    renderSelectedFilters();

  }
);


// ===============================
// MOBILE MENU
// ===============================

const menuBtn =
  document.getElementById("menuBtn");

const navlinks =
  document.getElementById("navlinks");


menuBtn.addEventListener(
  "click",
  () => {

    navlinks.classList.toggle("active");


    if (
      navlinks.classList.contains("active")
    ) {

      menuBtn.textContent = "×";

    } else {

      menuBtn.textContent = "☰";

    }

  }
);


// ===============================
// LOGIN / SIGNUP PLACEHOLDERS
// ===============================

function showAuthMessage(type) {

  if (type === "login") {

    alert(
      "Login will be connected to the authentication system later."
    );

  } else {

    alert(
      "Signup will be connected to the authentication system later."
    );

  }

}


// Desktop Login

document
  .getElementById("loginBtn")
  .addEventListener(
    "click",
    () => {
      showAuthMessage("login");
    }
  );


// Desktop Signup

document
  .getElementById("signupBtn")
  .addEventListener(
    "click",
    () => {
      showAuthMessage("signup");
    }
  );


// Mobile Login

document
  .getElementById("mobileLoginBtn")
  .addEventListener(
    "click",
    () => {
      showAuthMessage("login");
    }
  );


// Mobile Signup

document
  .getElementById("mobileSignupBtn")
  .addEventListener(
    "click",
    () => {
      showAuthMessage("signup");
    }
  );


// ===============================
// INITIAL STATE
// ===============================

renderSelectedFilters();