document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  if (userRole === 'admin') {
    window.location.href = '/admin.html';
    return;
  }

  const folioUploadForm = document.getElementById('folioUploadForm');
  const uploadMessageElement = document.getElementById('uploadMessage');
  const folioListElement = document.getElementById('folioList');
  const logoutButton = document.getElementById('logoutButton');

  // Handle folio upload
  folioUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const folioType = document.getElementById('folioType').value;
    const folioPdf = document.getElementById('folioPdf').files[0];

    if (!folioPdf) {
      uploadMessageElement.style.color = 'red';
      uploadMessageElement.textContent = 'Please select a PDF file.';
      return;
    }

    const formData = new FormData();
    formData.append('folioType', folioType);
    formData.append('folioPdf', folioPdf);

    try {
      const res = await fetch('/api/folios/upload', {
        method: 'POST',
        headers: {
          'x-auth-token': token,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        uploadMessageElement.style.color = 'green';
        uploadMessageElement.textContent = data.msg;
        folioUploadForm.reset();
        fetchFolios(); // Refresh folio list
      } else {
        uploadMessageElement.style.color = 'red';
        uploadMessageElement.textContent = data.msg || 'Upload failed';
      }
    } catch (err) {
      console.error(err);
      uploadMessageElement.style.color = 'red';
      uploadMessageElement.textContent = 'An error occurred during upload. Please try again.';
    }
  });

  // Fetch and display user folios
  async function fetchFolios() {
    try {
      const res = await fetch('/api/folios/my-folios', {
        headers: {
          'x-auth-token': token,
        },
      });

      const folios = await res.json();

      if (res.ok) {
        folioListElement.innerHTML = ''; // Clear existing list
        if (folios.length === 0) {
          folioListElement.innerHTML = '<li>No folios uploaded yet.</li>';
          return;
        }
        folios.forEach((folio) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${folio.folioType}: ${folio.fileName}</span>
            <a href="/uploads/${folio.fileName}" target="_blank">View PDF</a>
          `;
          folioListElement.appendChild(li);
        });
      } else {
        folioListElement.innerHTML = `<li>Error fetching folios: ${folios.msg || 'Unknown error'}</li>`;
      }
    } catch (err) {
      console.error(err);
      folioListElement.innerHTML = '<li>An error occurred while fetching folios.</li>';
    }
  }

  // Logout functionality
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  });

  fetchFolios();
});
