
/* =====================================
   ANIMENOONA — PROFESSIONAL AUTH SYSTEM
===================================== */

async function account(mode) {
  const email = el.email?.value.trim();
  const password = el.password?.value || "";

  if (!email || !password) {
    say(el.accountMessage, "Please enter email and password.", true);
    return;
  }

  if (password.length < 6) {
    say(el.accountMessage, "Password must be at least 6 characters.", true);
    return;
  }

  const loginBtn = first("loginBtn");
  const signupBtn = first("signupBtn");

  if (loginBtn) loginBtn.disabled = true;
  if (signupBtn) signupBtn.disabled = true;

  say(el.accountMessage, "Connecting securely...");

  try {
    let result;

    if (mode === "signup") {
      result = await db.auth.signUp({
        email,
        password
      });
    } else {
      result = await db.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (mode === "signup" && !result.data.session) {
      say(
        el.accountMessage,
        "Account created! Please verify your email before login."
      );
      return;
    }

    say(
      el.accountMessage,
      mode === "signup"
        ? "Account created successfully!"
        : "Login successful! Welcome to AnimeNoona ♡"
    );

    await checkAdmin();
    await loadAnime();

  } catch (error) {
    console.error("AnimeNoona Auth Error:", error);

    say(
      el.accountMessage,
      error.message || "Something went wrong. Please try again.",
      true
    );

  } finally {
    if (loginBtn) loginBtn.disabled = false;
    if (signupBtn) signupBtn.disabled = false;
  }
}

/* BUTTON EVENTS */

first("loginBtn")?.addEventListener("click", () => {
  account("login");
});

first("signupBtn")?.addEventListener("click", () => {
  account("signup");
});

/* ENTER KEY LOGIN */

el.password?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    account("login");
  }
});
