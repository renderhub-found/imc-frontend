// ================================================
//   AMBASSADOR REGISTRATION — ambassador.js
// ================================================

window.addEventListener('DOMContentLoaded', function () {

  const loggedIn    = localStorage.getItem('imc_logged_in');
  const currentUser = JSON.parse(localStorage.getItem('imc_user') || 'null');

  const formBox         = document.getElementById('ambassadorFormBox');
  const alreadyBox      = document.getElementById('alreadyAmbassadorBox');
  const notLoggedInBox  = document.getElementById('notLoggedInBox');

  // ---- Not logged in ----
  if (!loggedIn || !currentUser) {
    formBox.style.display        = 'none';
    notLoggedInBox.style.display = 'flex';
    return;
  }

  // ---- Already an ambassador ----
  const ambassadors    = JSON.parse(
    localStorage.getItem('imc_ambassadors') || '[]'
  );
  const existingAmbassador = ambassadors.find(
    a => a.email === currentUser.email
  );

  if (existingAmbassador) {
    formBox.style.display   = 'none';
    alreadyBox.style.display = 'flex';
    return;
  }

  // ---- Handle form submission ----
  const submitBtn = document.getElementById('ambSubmitBtn');

  submitBtn.addEventListener('click', function () {

    const fullName   = document.getElementById('ambFullName').value.trim();
    const university = document.getElementById('ambUniversity').value.trim();
    const username   = document.getElementById('ambUsername').value.trim()
                        .replace(/\s+/g, '_').toLowerCase();
    const whatsApp   = document.getElementById('ambWhatsApp').value.trim();
    const social     = document.getElementById('ambSocial').value.trim();
    const reason     = document.getElementById('ambReason').value.trim();

    const errorBox = document.getElementById('ambError');
    const errorMsg = document.getElementById('ambErrorMsg');

    // Hide previous errors
    errorBox.style.display = 'none';

    // ---- Validate ----
    if (!fullName) {
      errorMsg.textContent = 'Please enter your full name.';
      errorBox.style.display = 'flex'; return;
    }
    if (!university) {
      errorMsg.textContent = 'Please enter your university name.';
      errorBox.style.display = 'flex'; return;
    }
    if (!username) {
      errorMsg.textContent = 'Please enter a username.';
      errorBox.style.display = 'flex'; return;
    }
    if (username.length < 3) {
      errorMsg.textContent = 'Username must be at least 3 characters.';
      errorBox.style.display = 'flex'; return;
    }
    if (!whatsApp) {
      errorMsg.textContent = 'Please enter your WhatsApp number.';
      errorBox.style.display = 'flex'; return;
    }
    if (!social) {
      errorMsg.textContent = 'Please enter your social media handle.';
      errorBox.style.display = 'flex'; return;
    }
    if (!reason) {
      errorMsg.textContent = 'Please tell us why you want to be an ambassador.';
      errorBox.style.display = 'flex'; return;
    }

    // ---- Check username is unique ----
    const allAmbassadors = JSON.parse(
      localStorage.getItem('imc_ambassadors') || '[]'
    );
    const usernameTaken = allAmbassadors.find(
      a => a.username === username
    );
    if (usernameTaken) {
      errorMsg.textContent =
        'That username is already taken. Please choose another.';
      errorBox.style.display = 'flex'; return;
    }

    // ---- Show spinner ----
    document.getElementById('ambBtnText').style.display  = 'none';
    document.getElementById('ambSpinner').style.display  = 'inline';
    submitBtn.disabled = true;

    // ---- Build ambassador object ----
    // Generate unique referral code: AMB-username
    const refCode = 'AMB-' + username.toUpperCase();

    const newAmbassador = {
      id:          'AMB-' + Date.now(),
      email:       currentUser.email,
      fullName:    fullName,
      university:  university,
      username:    username,
      whatsApp:    whatsApp,
      social:      social,
      reason:      reason,
      refCode:     refCode,
      referrals:   [],        // vendors referred
      earnings:    0,         // commission earned
      tasksDone:   [],        // completed task IDs
      newsCount:   0,         // news submitted
      status:      'active',
      joinedDate:  new Date().toLocaleDateString()
    };

    // ---- Save ambassador ----
    allAmbassadors.push(newAmbassador);
    localStorage.setItem(
      'imc_ambassadors', JSON.stringify(allAmbassadors)
    );

    // ---- Update current user role ----
    currentUser.role        = 'ambassador';
    currentUser.ambassadorId = newAmbassador.id;
    currentUser.refCode      = refCode;
    localStorage.setItem('imc_user', JSON.stringify(currentUser));

    // ---- Update in users array ----
    const users = JSON.parse(localStorage.getItem('imc_users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
      users[userIndex].role        = 'ambassador';
      users[userIndex].ambassadorId = newAmbassador.id;
      users[userIndex].refCode      = refCode;
      localStorage.setItem('imc_users', JSON.stringify(users));
    }

    // ---- Redirect after short delay ----
    setTimeout(function () {
      window.location.href = 'ambassador-dashboard.html';
    }, 1200);

  });

});