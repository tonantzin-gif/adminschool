document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  // const formTitle = document.getElementById('formTitle'); // Removed, titles are now in forms

  // Toggle buttons
  const toggleLoginButton = document.getElementById('toggleLogin');
  const toggleRegisterButton = document.getElementById('toggleRegister');

  const loginUsernameInput = document.getElementById('loginUsername');
  const loginPasswordInput = document.getElementById('loginPassword');
  const loginMessageElement = document.getElementById('loginMessage');

  const registerUsernameInput = document.getElementById('registerUsername');
  const registerPasswordInput = document.getElementById('registerPassword');
  const registerRoleSelect = document.getElementById('registerRole');
  const registerMessageElement = document.getElementById('registerMessage');

  const forgotUsernameInput = document.getElementById('forgotUsername');
  const forgotMessageElement = document.getElementById('forgotMessage');

  // Function to switch active form
  function switchForm(activeFormId) {
    const forms = [loginForm, registerForm, forgotPasswordForm];
    forms.forEach(form => {
      if (form.id === activeFormId) {
        form.classList.add('active');
        form.classList.remove('hidden');
      } else {
        form.classList.remove('active');
        form.classList.add('hidden');
      }
    });
    // Clear messages when switching forms
    loginMessageElement.textContent = '';
    loginMessageElement.classList.remove('success', 'error');
    registerMessageElement.textContent = '';
    registerMessageElement.classList.remove('success', 'error');
    forgotMessageElement.textContent = '';
    forgotMessageElement.classList.remove('success', 'error');

    // Update toggle button active state
    if (toggleLoginButton) {
      if (activeFormId === 'loginForm') {
        toggleLoginButton.classList.add('active');
        toggleRegisterButton.classList.remove('active');
      } else if (activeFormId === 'registerForm') {
        toggleLoginButton.classList.remove('active');
        toggleRegisterButton.classList.add('active');
      } else {
        toggleLoginButton.classList.remove('active');
        toggleRegisterButton.classList.remove('active');
      }
    }
  }

  // Event listeners for toggle buttons (if they exist)
  if (toggleLoginButton) {
    toggleLoginButton.addEventListener('click', () => switchForm('loginForm'));
    toggleRegisterButton.addEventListener('click', () => switchForm('registerForm'));
  }

  const showForgotLink = document.getElementById('showForgot');
  if (showForgotLink) {
    showForgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchForm('forgotPasswordForm');
    });
  }

  const showLoginFromRegisterLink = document.getElementById('showLoginFromRegister');
  if (showLoginFromRegisterLink) {
    showLoginFromRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchForm('loginForm');
    });
  }

  const showLoginFromForgotLink = document.getElementById('showLoginFromForgot');
  if (showLoginFromForgotLink) {
    showLoginFromForgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchForm('loginForm');
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value;
    const password = loginPasswordInput.value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        loginMessageElement.classList.add('success'); 
        loginMessageElement.textContent = 'Login successful!';

        if (data.role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/dashboard.html';
        }
      } else {
        loginMessageElement.classList.add('error'); // Add error class
        loginMessageElement.textContent = data.msg || 'Login failed';
      }
    } catch (err) {
      console.error(err);
      loginMessageElement.classList.add('error');
      loginMessageElement.textContent = 'An error occurred. Please try again.';
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = registerUsernameInput.value;
    const password = registerPasswordInput.value;
    const role = registerRoleSelect.value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        registerMessageElement.classList.add('success');
        registerMessageElement.textContent = 'Registration successful! You can now log in.';
        registerForm.reset();
        // Optionally redirect to login form
        setTimeout(() => {
          switchForm('loginForm'); // Use switchForm
        }, 2000);
      } else {
        registerMessageElement.classList.add('error');
        registerMessageElement.textContent = data.msg || 'Registration failed';
      }
    } catch (err) {
      console.error(err);
      registerMessageElement.classList.add('error');
      registerMessageElement.textContent = 'An error occurred. Please try again.';
    }
  });

  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = forgotUsernameInput.value;
    // In a real application, you would send an email with a reset link here.
    // For now, we'll just show a success message.
    forgotMessageElement.classList.add('success');
    forgotMessageElement.textContent = `If an account with ${username} exists, a password reset link has been sent.`;
    forgotPasswordForm.reset();
  });

  // Initial form display
  switchForm('loginForm');
});
