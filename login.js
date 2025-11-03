function validateLogin(event) {
  event.preventDefault();

  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;

  const allowedUsers = ["Naushad", "Sarfaraz", "Mazhar"];
  const correctPassword = "Istos@123";

  if (allowedUsers.includes(user) && pass === correctPassword) {
    sessionStorage.setItem("istos-auth", "true");
    sessionStorage.setItem("istos-last-active", Date.now());
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("error").textContent = "Invalid credentials. Please try again.";
  }
}
