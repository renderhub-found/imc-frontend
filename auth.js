// ================================================
//   FRONTEND AUTH — auth.js
//   Now connects to real backend API
// ================================================

// ================================================
//   LOGIN LOGIC
// ================================================

var loginBtn = document.getElementById('loginBtn');

if (loginBtn) {

  loginBtn.addEventListener('click', async function () {

    var email    = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value.trim();

    var errorBox = document.getElementById('loginError');
    var errorMsg = document.getElementById('loginErrorMsg');
    var successBox = document.getElementById('loginSuccess');
    var btnText  = document.getElementById('loginBtnText');
    var spinner  = document.getElementById('loginSpinner');

    // Hide previous messages
    if (errorBox)   errorBox.style.display   = 'none';
    if (successBox) successBox.style.display = 'none';

    // Validate
    if (!email) {
      if (errorMsg) errorMsg.textContent = 'Please enter your email.';
      if (errorBox) errorBox.style.display = 'flex';
      return;
    }

    if (!password) {
      if (errorMsg) errorMsg.textContent = 'Please enter your password.';
      if (errorBox) errorBox.style.display = 'flex';
      return;
    }

    // Show spinner
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline';
    loginBtn.disabled = true;

    // ---- Call real backend API ----
    var result = await IMC_API.login(email, password);

    if (result.success) {

      // Show success message
      if (successBox) successBox.style.display = 'flex';

      // Redirect after 1.5 seconds
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1500);

    } else {

      // Show error message
      if (errorMsg) {
        errorMsg.textContent = result.message ||
          'Login failed. Please try again.';
      }
      if (errorBox) errorBox.style.display = 'flex';

      // Reset button
      if (btnText) btnText.style.display = 'inline';
      if (spinner) spinner.style.display = 'none';
      loginBtn.disabled = false;

      // Special message if backend is not running
      if (result.networkError) {
        if (errorMsg) {
          errorMsg.textContent =
            'Server is offline. Please make sure the ' +
            'backend is running on port 5000.';
        }
      }
    }
  });

  // Allow Enter key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && document.getElementById('loginBtn')) {
      loginBtn.click();
    }
  });
}

// ---- Toggle password visibility ----
var toggleLoginPassword = document.getElementById('toggleLoginPassword');
var loginPasswordInput  = document.getElementById('loginPassword');
var toggleLoginIcon     = document.getElementById('toggleLoginIcon');

if (toggleLoginPassword) {
  toggleLoginPassword.addEventListener('click', function () {
    if (loginPasswordInput.type === 'password') {
      loginPasswordInput.type = 'text';
      if (toggleLoginIcon) {
        toggleLoginIcon.classList.replace('fa-eye', 'fa-eye-slash');
      }
    } else {
      loginPasswordInput.type = 'password';
      if (toggleLoginIcon) {
        toggleLoginIcon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }
  });
}


// ================================================
//   FORGOT PASSWORD
// ================================================

var forgotBtn = document.getElementById('forgotPasswordBtn');

if (forgotBtn) {
  forgotBtn.addEventListener('click', async function () {
    var email    = getVal('forgotEmail');
    var errBox   = document.getElementById('forgotError');
    var errMsg   = document.getElementById('forgotErrorMsg');
    var okBox    = document.getElementById('forgotSuccess');
    var btnText  = document.getElementById('forgotBtnText');
    var spinner  = document.getElementById('forgotSpinner');

    if (errBox) errBox.style.display = 'none';
    if (okBox)  okBox.style.display  = 'none';

    if (!email) {
      if (errMsg) errMsg.textContent   = 'Please enter your email address.';
      if (errBox) errBox.style.display = 'flex';
      return;
    }

    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline';
    forgotBtn.disabled = true;

    var result = await IMC_API.forgotPassword(email);

    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.style.display = 'inline';
    forgotBtn.disabled = false;

    if (okBox) {
      okBox.style.display = 'flex';
    }
  });
}

// ================================================
//   SIGNUP LOGIC
// ================================================

var signupBtn = document.getElementById('signupBtn');

if (signupBtn) {

  signupBtn.addEventListener('click', async function () {

    var firstName   = document.getElementById('signupFirstName').value.trim();
    var lastName    = document.getElementById('signupLastName').value.trim();
    var email       = document.getElementById('signupEmail').value.trim();
    var university  = document.getElementById('signupUniversity').value.trim();
    var password    = document.getElementById('signupPassword').value.trim();
    var confirmPass = document.getElementById('signupConfirmPassword').value.trim();
    var agreeCheck  = document.getElementById('agreeTerms').checked;

    var errorBox   = document.getElementById('signupError');
    var errorMsg   = document.getElementById('signupErrorMsg');
    var successBox = document.getElementById('signupSuccess');
    var btnText    = document.getElementById('signupBtnText');
    var spinner    = document.getElementById('signupSpinner');

    // Hide previous messages
    if (errorBox)   errorBox.style.display   = 'none';
    if (successBox) successBox.style.display = 'none';

    function showError(msg) {
      if (errorMsg) errorMsg.textContent = msg;
      if (errorBox) errorBox.style.display = 'flex';
    }

    // Validate
    if (!firstName)  { showError('Please enter your first name.'); return; }
    if (!lastName)   { showError('Please enter your last name.'); return; }
    if (!email)      { showError('Please enter your email.'); return; }
    if (!university) { showError('Please enter your university.'); return; }
    if (!password)   { showError('Please create a password.'); return; }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPass) {
      showError('Passwords do not match. Please check again.');
      return;
    }

    if (!agreeCheck) {
      showError('Please agree to the Terms & Conditions.');
      return;
    }

    // Show spinner
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline';
    signupBtn.disabled = true;

    // ---- Call real backend API ----
    var result = await IMC_API.register({
      firstName:  firstName,
      lastName:   lastName,
      email:      email,
      university: university,
      password:   password
    });

    if (result.success) {

      // Show success
      if (successBox) successBox.style.display = 'flex';

      // Before redirecting after successful signup, preserve referral code
if (result.success) {
  // Referral code survives signup
  var refCode = localStorage.getItem('imc_ref_code');
  // saveAuthData already called inside IMC_API.register
  // Just redirect — ref code stays in localStorage
  setTimeout(function () {
    // If came from a referral link, go back to vendor page
    if (refCode) {
      window.location.href = 'vendor.html';
    } else {
      window.location.href = 'index.html';
    }
  }, 1500);
}

      // Redirect after 1.5 seconds
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1500);

    } else {

      // Show error
      showError(result.message || 'Registration failed. Please try again.');

      // Reset button
      if (btnText) btnText.style.display = 'inline';
      if (spinner) spinner.style.display = 'none';
      signupBtn.disabled = false;

      if (result.networkError) {
        showError(
          'Server is offline. Make sure the ' +
          'backend is running on port 5000.'
        );
      }
    }
  });

  // Allow Enter key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && document.getElementById('signupBtn')) {
      signupBtn.click();
    }
  });
}

// ---- Toggle password visibility (signup) ----
var toggleSignupPassword = document.getElementById('toggleSignupPassword');
var signupPasswordInput  = document.getElementById('signupPassword');
var toggleSignupIcon     = document.getElementById('toggleSignupIcon');

if (toggleSignupPassword) {
  toggleSignupPassword.addEventListener('click', function () {
    if (signupPasswordInput.type === 'password') {
      signupPasswordInput.type = 'text';
      if (toggleSignupIcon) {
        toggleSignupIcon.classList.replace('fa-eye', 'fa-eye-slash');
      }
    } else {
      signupPasswordInput.type = 'password';
      if (toggleSignupIcon) {
        toggleSignupIcon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }
  });
}