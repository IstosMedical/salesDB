function validateLogin(event) {
  event.preventDefault();

  const userInput = document.getElementById("username").value.trim().toLowerCase();
  const passwordInput = document.getElementById("password").value;

  const allowedUsers = ["naushad", "sarfaraz", "mazhar"];
  const correctPassword = "Istos@123";

  const isUserValid = allowedUsers.includes(userInput);
  const isPasswordValid = passwordInput === correctPassword;

  if (isUserValid && isPasswordValid) {
    sessionStorage.setItem("istos-auth", "true");
    sessionStorage.setItem("istos-last-active", Date.now());
    window.location.href = "dashboard.html";
  } else {
    const errorMsg = document.getElementById("error");
    errorMsg.textContent = "Invalid credentials. Please try again.";
    errorMsg.style.color = "red";
  }
}

sessionStorage.setItem("istos-user", userInput);

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}
