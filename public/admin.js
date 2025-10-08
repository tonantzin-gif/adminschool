document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  if (userRole !== 'admin') {
    window.location.href = '/dashboard.html'; // Redirect non-admins to dashboard
    return;
  }

  const userListElement = document.getElementById('userList');
  const studentTableBody = document.querySelector('#studentTable tbody');
  const paymentTableBody = document.querySelector('#paymentTable tbody');
  const logoutButton = document.getElementById('logoutButton');

  // User Table elements
  const userTableBody = document.querySelector('#userTable tbody');

  // New Student Form elements
  const toggleAddStudentForm = document.getElementById('toggleAddStudentForm'); // New toggle button
  const newStudentFormContainer = document.getElementById('newStudentFormContainer');
  const newStudentForm = document.getElementById('newStudentForm');
  const cancelAddStudentButton = document.getElementById('cancelAddStudent');
  const newStudentMessage = document.getElementById('newStudentMessage');
  const saveStudentButton = document.getElementById('saveStudentButton');

  let editingStudentId = null; // Global variable to store the ID of the student being edited

  const navButtons = document.querySelectorAll('.sidebar-nav .nav-button');
  const contentSections = document.querySelectorAll('.content-section');

  // Function to toggle form visibility
  function toggleFormVisibility(show = null, isEditing = false) {
    if (show === true) {
      newStudentFormContainer.classList.add('expanded');
      toggleAddStudentForm.classList.add('active');
      toggleAddStudentForm.innerHTML = `<i class="fas fa-minus-circle"></i> ${isEditing ? 'Contraer Formulario (Editando)' : 'Contraer Formulario'}`;
    } else if (show === false) {
      newStudentFormContainer.classList.remove('expanded');
      toggleAddStudentForm.classList.remove('active');
      toggleAddStudentForm.innerHTML = '<i class="fas fa-plus-circle"></i> Añadir Nuevo Alumno';
    } else {
      // Toggle based on current state
      const isExpanded = newStudentFormContainer.classList.toggle('expanded');
      if (isExpanded) {
        toggleAddStudentForm.classList.add('active');
        toggleAddStudentForm.innerHTML = '<i class="fas fa-minus-circle"></i> Contraer Formulario';
      } else {
        toggleAddStudentForm.classList.remove('active');
        toggleAddStudentForm.innerHTML = '<i class="fas fa-plus-circle"></i> Añadir Nuevo Alumno';
      }
    }
  }

  // Function to show/hide sections with fade animation
  function showSection(sectionId, activeButton = null) {
    contentSections.forEach(section => {
      if (section.classList.contains('active')) {
        section.classList.add('hidden'); // Hide with transition
        section.classList.remove('active');
      }
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden'); // Show with transition
      targetSection.classList.add('active');
      
      // Log the active button for debugging
      console.log('showSection: Botón activo después de la asignación:', activeButton);
      
      // Call data fetch function based on section
      if (sectionId === 'users-section') {
        fetchUsers();
      } else if (sectionId === 'students-section') {
        fetchStudents();
      } else if (sectionId === 'payments-section') {
        fetchPayments();
      }
    }
  }

  // Add event listeners to navigation buttons
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      showSection(`${button.dataset.section}-section`, button); // Pass the current button
    });
  });

  // Initial display
  showSection('users-section', navButtons[0]); // Pass the initial active button

  // Fetch and display all users
  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-auth-token': token,
        },
      });

      const users = await res.json();

      if (res.ok) {
        userTableBody.innerHTML = ''; // Clear previous users
        if (users.length === 0) {
          userTableBody.innerHTML = '<tr><td colspan="2">No users found.</td></tr>';
          return;
        }
        users.forEach((user) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.role}</td>
          `;
          userTableBody.appendChild(row);
        });
      } else {
        userTableBody.innerHTML = `<tr><td colspan="2">Error fetching users: ${users.msg || 'Unknown error'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      userTableBody.innerHTML = '<tr><td colspan="2">An error occurred while fetching users.</td></tr>';
    }
  }

  // Fetch and display all payments
  async function fetchPayments() {
    console.log('Fetching payments...');
    try {
      const res = await fetch('/api/students', { // Fetch all students
        headers: {
          'x-auth-token': token,
        },
      });
      const students = await res.json();
      console.log('Students response:', students);

      if (res.ok) {
        paymentTableBody.innerHTML = '';
        let hasPayments = false;

        if (students.length === 0) {
          console.log('No students found, displaying empty payments table.');
          paymentTableBody.innerHTML = '<tr><td colspan="6">No payments found.</td></tr>';
          return;
        }

        students.forEach((student) => {
          if (student.paymentDetails && student.paymentDetails.length > 0) {
            console.log(`Student ${student.name} ${student.lastName} has payment details:`, student.paymentDetails);
            hasPayments = true;
            student.paymentDetails.forEach((payment) => {
              const row = document.createElement('tr');
              const statusIcon = payment.status === 'completed' 
                ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' 
                : '<i class="fas fa-times-circle" style="color: var(--accent-color);"></i>';
              const pdfLink = payment.pdfFile 
                ? `<a href="/uploads/students_pdfs/${payment.pdfFile}" target="_blank">Ver PDF</a>` 
                : 'N/A';

              row.innerHTML = `
                <td>${payment.folioType || 'N/A'}</td>
                <td>$${payment.amount ? payment.amount.toFixed(2) : '0.00'}</td>
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${student.name} ${student.lastName} (${student.matricula})</td>
                <td>${statusIcon} ${payment.status}</td>
                <td>${pdfLink}</td>
              `;
              paymentTableBody.appendChild(row);
            });
          }
        });

        if (!hasPayments) {
          paymentTableBody.innerHTML = '<tr><td colspan="6">No payments found.</td></tr>';
        }

      } else {
        paymentTableBody.innerHTML = `<tr><td colspan="6">Error fetching payments: ${students.msg || 'Unknown error'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      paymentTableBody.innerHTML = '<tr><td colspan="6">An error occurred while fetching payments.</td></tr>';
    }
  }

  // Logout functionality
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Also clear userRole
    window.location.href = '/index.html';
  });

  // Search elements
  const studentSearchInput = document.getElementById('studentSearchInput');
  const searchStudentButton = document.getElementById('searchStudentButton');
  const generalSearchInput = document.getElementById('generalSearchInput');
  const performGeneralSearchButton = document.getElementById('performGeneralSearchButton');
  const generalSearchResults = document.getElementById('generalSearchResults');

  // Student search functionality
  searchStudentButton.addEventListener('click', () => {
    const query = studentSearchInput.value.trim();
    fetchStudents(query); // Pass the query to fetchStudents
  });

  studentSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchStudentButton.click();
    }
  });

  // General search functionality (will require backend API)
  performGeneralSearchButton.addEventListener('click', () => {
    const query = generalSearchInput.value.trim();
    if (query) {
      // This will require a new backend API endpoint
      console.log('Performing general search for:', query);
      // Placeholder for actual general search function
      fetchGeneralSearchResults(query);
    } else {
      generalSearchResults.innerHTML = 'Please enter a search query.';
    }
  });

  generalSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performGeneralSearchButton.click();
    }
  });

  // Function to fetch and display general search results
  async function fetchGeneralSearchResults(query) {
    generalSearchResults.innerHTML = `Searching for "${query}"...`;
    try {
      const res = await fetch(`/api/admin/search?query=${query}`, {
        headers: {
          'x-auth-token': token,
        },
      });
      const results = await res.json();

      if (res.ok) {
        generalSearchResults.innerHTML = '';
        let hasResults = false;

        // Display Users
        if (results.users && results.users.length > 0) {
          hasResults = true;
          const userHtml = `
            <h4>Usuarios</h4>
            <ul>
              ${results.users.map(user => `<li>${user.username} (${user.role})</li>`).join('')}
            </ul>
          `;
          generalSearchResults.innerHTML += userHtml;
        }

        // Display Students
        if (results.students && results.students.length > 0) {
          hasResults = true;
          const studentHtml = `
            <h4>Alumnos</h4>
            <ul>
              ${results.students.map(student => {
                let paymentDetailsSummary = 'N/A';
                if (student.paymentDetails && student.paymentDetails.length > 0) {
                  paymentDetailsSummary = student.paymentDetails.map(pd => `
                    Tipo: ${pd.folioType || 'N/A'}, 
                    Monto: $${pd.amount ? pd.amount.toFixed(2) : '0.00'}, 
                    Estado: ${pd.status || 'N/A'},
                    PDF: ${pd.pdfFile ? `<a href="/uploads/students_pdfs/${pd.pdfFile}" target="_blank">Ver PDF</a>` : 'N/A'}
                  `).join('; ');
                }
                return `<li>${student.name} ${student.lastName} (${student.matricula}) - Pagos: ${paymentDetailsSummary}</li>`;
              }).join('')}
            </ul>
          `;
          generalSearchResults.innerHTML += studentHtml;
        }

        // Display Folios (now integrated into students, so this section might become obsolete or simplified)
        // Since Folios are now part of Student.paymentDetails, this section might be removed or adapted.
        // For now, we'll keep it but acknowledge its potential obsolescence.
        if (results.folios && results.folios.length > 0) {
          hasResults = true;
          const folioHtml = `
            <h4>Folios</h4>
            <ul>
              ${results.folios.map(folio => `<li>
                Student: ${folio.student ? `${folio.student.name} ${folio.student.lastName} (${folio.student.matricula})` : 'N/A'},
                Type: ${folio.folioType}, 
                File: ${folio.fileName ? `<a href="/uploads/folios_pdfs/${folio.fileName}" target="_blank">${folio.fileName}</a>` : 'N/A'}
              </li>`).join('')}
            </ul>
          `;
          generalSearchResults.innerHTML += folioHtml;
        }

        // Display Payments
        if (results.payments && results.payments.length > 0) {
          hasResults = true;
          const paymentHtml = `
            <h4>Pagos</h4>
            <ul>
              ${results.payments.map(payment => `<li>Folio: ${payment.paymentFolio}, Amount: $${payment.amount.toFixed(2)}, Student: ${payment.student ? `${payment.student.name} ${payment.student.lastName}` : 'N/A'}</li>`).join('')}
            </ul>
          `;
          generalSearchResults.innerHTML += paymentHtml;
        }

        if (!hasResults) {
          generalSearchResults.innerHTML = '<p>No results found for your query.</p>';
        }
      } else {
        generalSearchResults.innerHTML = `<p>Error fetching search results: ${results.msg || 'Unknown error'}</p>`;
      }
    } catch (err) {
      console.error(err);
      generalSearchResults.innerHTML = '<p>An error occurred while fetching search results.</p>';
    }
  }

  // Modified fetchStudents to accept a query parameter
  async function fetchStudents(query = '') {
    console.log('Fetching students...');
    try {
      const url = query ? `/api/students?search=${query}` : '/api/students';
      const res = await fetch(url, {
        headers: {
          'x-auth-token': token,
        },
      });
      const students = await res.json();
      console.log('Students response:', students);

      if (res.ok) {
        studentTableBody.innerHTML = '';
        if (students.length === 0) {
          console.log('No students found.');
          studentTableBody.innerHTML = '<tr><td colspan="9">No students found.</td></tr>';
          return;
        }
        students.forEach((student) => {
          console.log('Processing student:', student);
          const row = document.createElement('tr');
          let paymentDetailsHtml = 'N/A';
          if (student.paymentDetails && student.paymentDetails.length > 0) {
            paymentDetailsHtml = `<div class="student-payment-details">` + student.paymentDetails.map(pd => `
              <div>
                Tipo: ${pd.folioType || 'N/A'}, 
                Monto: $${pd.amount ? pd.amount.toFixed(2) : '0.00'}, 
                Estado: ${pd.status || 'N/A'},
                PDF: ${pd.pdfFile ? `<a href="/uploads/students_pdfs/${pd.pdfFile}" target="_blank">Ver PDF</a>` : 'N/A'}
              </div>
            `).join('<hr>') + `</div>`;
          }
          row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.lastName}</td>
            <td>${student.major}</td>
            <td>${student.matricula}</td>
            <td>${student.yearOfAdmission}</td>
            <td>${student.group}</td>
            <td>${student.grade}</td>
            <td>${paymentDetailsHtml}</td>
            <td>
              <button class="action-button edit-student primary" data-id="${student._id}"><i class="fas fa-edit"></i> Editar</button>
              <button class="action-button delete-student" data-id="${student._id}"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </td>
          `;
          studentTableBody.appendChild(row);
        });

        // Add event listeners for delete buttons
        studentTableBody.querySelectorAll('.delete-student').forEach(button => {
          button.addEventListener('click', async (e) => {
            const studentId = e.currentTarget.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este alumno y todos sus detalles de pago?')) {
              await deleteStudent(studentId);
            }
          });
        });

        // Add event listeners for edit buttons (initial setup)
        studentTableBody.querySelectorAll('.edit-student').forEach(button => {
          button.addEventListener('click', async (e) => {
            const studentId = e.currentTarget.dataset.id;
            await editStudent(studentId);
            toggleFormVisibility(true, true); // Expand the form and indicate editing
          });
        });

      } else {
        studentTableBody.innerHTML = `<tr><td colspan="9">Error fetching students: ${students.msg || 'Unknown error'}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      studentTableBody.innerHTML = '<tr><td colspan="9">An error occurred while fetching students.</td></tr>';
    }
  }

  // Function to delete a student
  async function deleteStudent(studentId) {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token,
        },
      });

      if (res.ok) {
        console.log('Student deleted successfully');
        fetchStudents(); // Refresh the student list
      } else {
        const data = await res.json();
        console.error(`Error deleting student: ${data.msg || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error during delete operation:', err);
    }
  }

  // Function to edit a student (initial setup)
  async function editStudent(studentId) {
    console.log('editStudent: Iniciando edición para el alumno con ID:', studentId);
    newStudentFormContainer.classList.remove('hidden');
    newStudentFormContainer.classList.add('active');
    newStudentMessage.textContent = '';
    newStudentMessage.classList.remove('success', 'error');

    try {
      console.log('editStudent: Realizando fetch a /api/students/' + studentId);
      const res = await fetch(`/api/students/${studentId}`, {
        headers: {
          'x-auth-token': token,
        },
      });
      console.log('editStudent: Respuesta del fetch recibida:', res);

      const studentToEdit = await res.json();
      console.log('editStudent: Datos del alumno parseados como JSON:', studentToEdit);

      if (res.ok) {
        console.log('editStudent: Fetch exitoso. Datos del alumno para editar:', studentToEdit);

        // Populate form fields with student data
        document.getElementById('studentName').value = studentToEdit.name;
        document.getElementById('studentLastName').value = studentToEdit.lastName;
        document.getElementById('studentMajor').value = studentToEdit.major;
        document.getElementById('studentMatricula').value = studentToEdit.matricula;
        document.getElementById('studentYearOfAdmission').value = studentToEdit.yearOfAdmission;
        document.getElementById('studentGroup').value = studentToEdit.group;
        document.getElementById('studentGrade').value = studentToEdit.grade;

        // Populate payment details if they exist
        if (studentToEdit.paymentDetails && studentToEdit.paymentDetails.length > 0) {
          const firstPayment = studentToEdit.paymentDetails[0];
          document.getElementById('paymentFolioType').value = firstPayment.folioType || '';
          document.getElementById('paymentAmount').value = firstPayment.amount || '';
          document.getElementById('paymentStatus').value = firstPayment.status || 'pending';
          // Note: Cannot pre-fill file input for security reasons.
        } else {
          // Clear payment details if no existing ones
          document.getElementById('paymentFolioType').value = '';
          document.getElementById('paymentAmount').value = '';
          document.getElementById('paymentStatus').value = 'pending';
        }

        editingStudentId = studentId; // Set the editing student ID
        saveStudentButton.textContent = 'Actualizar Alumno'; // Change button text
        saveStudentButton.classList.remove('primary');
        saveStudentButton.classList.add('warning');
        
      } else {
        console.error(`Error fetching student for edit: ${studentToEdit.msg || 'Unknown error'}`);
        newStudentMessage.classList.add('error');
        newStudentMessage.textContent = `Error: ${studentToEdit.msg || 'No se pudo cargar el alumno para editar.'}`;
      }
    } catch (err) {
      console.error('Error fetching student for edit operation:', err);
      newStudentMessage.classList.add('error');
      newStudentMessage.textContent = 'Error del servidor al cargar alumno para editar.';
    }
  }

  // Initial fetch based on the default active section (users-section)
  // fetchUsers(); // This will be called by showSection('users-section')
  // fetchAllFolios(); // This will be called by showSection('folios-section') if it was the initial active section

  // Toggle new student form visibility (now handled by toggleAddEditStudentForm)
  toggleAddStudentForm.addEventListener('click', () => {
    toggleFormVisibility(); // Simply toggle
    newStudentForm.reset(); // Reset form when toggling for new entry
    document.getElementById('paymentPdfFile').value = ''; // Clear file input explicitly
    editingStudentId = null; // Ensure we are in 'create' mode
    saveStudentButton.textContent = 'Guardar Alumno'; // Reset button text
    saveStudentButton.classList.remove('warning');
    saveStudentButton.classList.add('primary');
    newStudentMessage.textContent = ''; // Clear previous messages
    newStudentMessage.classList.remove('success', 'error');
  });

  cancelAddStudentButton.addEventListener('click', () => {
    toggleFormVisibility(false); // Collapse the form
    newStudentForm.reset();
    newStudentMessage.textContent = '';
    newStudentMessage.classList.remove('success', 'error');
    document.getElementById('paymentPdfFile').value = ''; // Clear file input explicitly
    editingStudentId = null; // Reset editing state
    saveStudentButton.textContent = 'Guardar Alumno'; // Reset button text
    saveStudentButton.classList.remove('warning');
    saveStudentButton.classList.add('primary');
  });

  // Handle new student form submission
  newStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(newStudentForm);

    const method = editingStudentId ? 'PUT' : 'POST';
    const url = editingStudentId ? `/api/students/${editingStudentId}` : '/api/students';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'x-auth-token': token,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        newStudentMessage.textContent = `Alumno ${editingStudentId ? 'actualizado' : 'añadido'} con éxito!`;
        newStudentMessage.classList.remove('error');
        newStudentMessage.classList.add('success');
        newStudentForm.reset();
        document.getElementById('paymentPdfFile').value = ''; 
        editingStudentId = null;
        saveStudentButton.textContent = 'Guardar Alumno';
        saveStudentButton.classList.remove('warning');
        saveStudentButton.classList.add('primary');
        fetchStudents();
        toggleFormVisibility(false); // Collapse the form after successful submission
      } else {
        newStudentMessage.textContent = `Error: ${data.msg || `No se pudo ${editingStudentId ? 'actualizar' : 'añadir'} el alumno.`}`;
        newStudentMessage.classList.remove('success');
        newStudentMessage.classList.add('error');
      }
    } catch (err) {
      console.error(err);
      newStudentMessage.textContent = `Error del servidor al ${editingStudentId ? 'actualizar' : 'añadir'} alumno.`;
      newStudentMessage.classList.remove('success');
      newStudentMessage.classList.add('error');
    }
  });
});
