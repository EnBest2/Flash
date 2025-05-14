document.addEventListener('DOMContentLoaded', () => {
  const cardForm = document.getElementById('cardForm');
  const cardsList = document.getElementById('cardsList');

  // Váltás a file input között a választott fájltípus alapján
  const radioButtons = document.getElementsByName('fileType');
  const photoInputDiv = document.getElementById('photoInputDiv');
  const pdfInputDiv = document.getElementById('pdfInputDiv');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      if (document.getElementById('typePhoto').checked) {
        photoInputDiv.style.display = 'block';
        pdfInputDiv.style.display = 'none';
      } else {
        photoInputDiv.style.display = 'none';
        pdfInputDiv.style.display = 'block';
      }
    });
  });

  // Kártyák betöltése
  const loadCards = () => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        cardsList.innerHTML = '';
        if (data.length === 0) {
          cardsList.innerHTML = '<p>Nincsenek kártyák.</p>';
        } else {
          // Kártyák csoportosítása kategóriák szerint
          const categories = {};
          data.forEach(card => {
            if (!categories[card.category]) {
              categories[card.category] = [];
            }
            categories[card.category].push(card);
          });
          for (let category in categories) {
            const catDiv = document.createElement('div');
            catDiv.classList.add('category');
            catDiv.innerHTML = `<h3>${category}</h3>`;
            categories[category].forEach(card => {
              const cardDiv = document.createElement('div');
              cardDiv.classList.add('card');
              cardDiv.innerHTML = `
                <h4>${card.title}</h4>
                <p>${card.content}</p>
                ${card.fileUrl ? `<a href="${card.fileUrl}" target="_blank">Megtekintés (${card.fileType})</a>` : ''}
                <p><small>Létrehozva: ${new Date(card.createdAt).toLocaleString()}</small></p>
              `;
              catDiv.appendChild(cardDiv);
            });
            cardsList.appendChild(catDiv);
          }
        }
      });
  };

  loadCards();

  // Űrlap elküldése
  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(cardForm);
    // A választott fájltípus alapján távolítsuk el a nem kiválasztott inputot
    if (document.getElementById('typePhoto').checked) {
      formData.delete('pdf');
    } else {
      formData.delete('photo');
    }
    fetch('/api/cards', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          cardForm.reset();
          // Alapértelmezetten a fotó mező jelenjen meg
          photoInputDiv.style.display = 'block';
          pdfInputDiv.style.display = 'none';
          loadCards();
        } else {
          alert('Hiba történt a kártya létrehozása során.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Hiba történt a kártya létrehozása során.');
      });
  });
});
