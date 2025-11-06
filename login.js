function validateLogin(event) {
  event.preventDefault();

  const userInput = document.getElementById("username").value.trim().toLowerCase();
  const passwordInput = document.getElementById("password").value;

  const allowedUsers = ["naushad", "sarfaraz", "mazhar", "nadeem"];
  const correctPassword = "Istos@123";

  const isUserValid = allowedUsers.includes(userInput);
  const isPasswordValid = passwordInput === correctPassword;

  if (isUserValid && isPasswordValid) {
    const userMap = {
      naushad: "Naushad Khan",
      sarfaraz: "Sarfaraz Khan",
      mazhar: "Mazhar Mecci"
      nadeem: "Nadeem Khadri"
    };

    sessionStorage.setItem("istos-auth", "true");
    sessionStorage.setItem("istos-last-active", Date.now());
    sessionStorage.setItem("istos-user", userMap[userInput]); // ✅ full name stored
    window.location.href = "dashboard.html";
  } else {
    showToast("Invalid credentials. Please try again.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

