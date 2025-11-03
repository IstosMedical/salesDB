function validateLogin() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;

  const allowedUsers = ["Naushad", "Sarfaraz", "Mazhar"];
  const correctPassword = "Istos@123";

  if (allowedUsers.includes(user) && pass === correctPassword) {
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("error").textContent = "Invalid credentials. Please try again.";
  }
}
