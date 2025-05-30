import AppPresenter from '../../utils/presenter';
import StoryAPI from '../../data/api';

function showFormattedDate(date, locale) {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

export default class BookmarkPage {
  #presenter = null;

  async render() {
    return `
      <section>
        <div id="bookmark-loading">${generateLoaderAbsoluteTemplate()}</div>
        <div id="reports-list" class="reports-list"></div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AppPresenter({
      view: this,
      model: StoryAPI,
    });
    this.#presenter.initialBookmark(); 
  }

  showReportsListLoading() {
    document.getElementById('bookmark-loading').style.display = 'block';
  }

  hideReportsListLoading() {
    document.getElementById('bookmark-loading').style.display = 'none';
  }

  populateBookmarkedReports(message, reports) {
    const container = document.getElementById('reports-list');
    container.innerHTML = '';

    // Ensure reports is an array before processing
    if (!Array.isArray(reports) || reports.length === 0) {
      console.warn('populateBookmarkedReports: No reports to display or invalid data received.', reports);
      container.innerHTML = generateReportsListEmptyTemplate();
      return;
    }

    reports.forEach((report) => {
      const {
        id,
        name = 'Tanpa Nama',
        description = '-',
        photoUrl,
        createdAt,
        location = {},
      } = report;

      const date = createdAt ? showFormattedDate(createdAt, 'id-ID') : 'Tanggal tidak diketahui';
      // Display latitude and longitude
      const locationDisplay = (report.lat !== undefined && report.lon !== undefined) 
        ? `Latitude: ${report.lat}, Longitude: ${report.lon}`
        : 'Lokasi tidak diketahui';

      container.innerHTML += `
        <div tabindex="0" class="report-item" data-reportid="${id}">
          <img class="report-item__image" src="${photoUrl}" alt="${name}">
          <div class="report-item__body">
            <div class="report-item__main">
              <h2 class="report-item__title">${name}</h2>
              <div class="report-item__more-info">
                <div class="report-item__createdat">
                  <i class="fas fa-calendar-alt"></i> ${date}
                </div>
                <div class="report-item__location">
                  <i class="fas fa-map"></i> ${locationDisplay}
                </div>
              </div>
            </div>
            <div class="report-item__description">${description}</div>
            <div class="report-item__actions">
              <button class="bookmark-button" data-id="${id}" aria-label="Hapus dari bookmark">
                <i class="fas fa-bookmark"></i> Hapus dari Bookmark
              </button>
              <a href="#/stories/${id}" class="detail-button">Selengkapnya</a>
            </div>
          </div>
        </div>
      `;
    });

    // Add event listeners for bookmark buttons
    const bookmarkButtons = container.querySelectorAll('.bookmark-button');
    bookmarkButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        
        const id = button.dataset.id;
        // In bookmark page, the button always means 'unbookmark'
        const isBookmarked = true; 

        // Find the corresponding story object from the initial reports array
        const report = reports.find(r => r.id === id);

        if (!report) {
             console.error('Report object not found for ID:', id);
             return;
        }

        console.log('Unbookmark button clicked:', { reportId: id, reportObject: report });
        
        try {
          // Pass the report object to toggleBookmark
          const success = await this.#presenter.toggleBookmark(report, isBookmarked);
          
          if (success) {
            console.log('Unbookmark successful in IndexedDB:', id);
            // Remove the card from the view
            const card = button.closest('.report-item');
            card.remove();
            
            // If no more cards, show empty state
            if (container.children.length === 0) {
              container.innerHTML = generateReportsListEmptyTemplate();
            }
          } else {
            console.error('Failed to unbookmark in IndexedDB');
          }
        } catch (error) {
          console.error('Error unbookmarking:', error);
        }
      });
    });

    console.log(message);
  }

  populateBookmarkedReportsError(message) {
    const container = document.getElementById('reports-list');
    container.innerHTML = generateReportsListErrorTemplate(message);
  }
}

// Template functions
function generateLoaderAbsoluteTemplate() {
  return `<div class="loader loader-absolute"></div>`;
}

function generateReportsListEmptyTemplate() {
  return `
    <div id="reports-list-empty" class="reports-list__empty">
      <h2>Tidak ada laporan yang tersedia</h2>
      <p>Saat ini, tidak ada laporan kerusakan fasilitas umum yang dapat ditampilkan.</p>
    </div>
  `;
}

function generateReportsListErrorTemplate(message) {
  return `
    <div id="reports-list-error" class="reports-list__error">
      <h2>Terjadi kesalahan pengambilan daftar laporan</h2>
      <p>${message || 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}
