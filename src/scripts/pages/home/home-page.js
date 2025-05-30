import AppPresenter from '../../utils/presenter';
import * as StoryAPI from '../../data/api';

export default class HomePage {
  #presenter = null;
  #stories = [];

  async render() {
    return `
      <section class="hero-home">
        <div class="hero-overlay">
          <div class="hero-content">
            <h1>Welcome to Dicoding Story</h1>
            <p>Share your story with the world</p>
            <button id="scroll-button">View Story</button>
          </div>
        </div>
      </section>

      <section id="story-list" class="story-list">
        <h2>Stories</h2>
        <div class="cards-container" id="reports-container">
          <div class="story-card">Story is empty</div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AppPresenter({
      view: this,
      model: StoryAPI,
    });
    await this.#presenter.initialStory();

    const scrollButton = document.getElementById('scroll-button');
    if (scrollButton) {
      scrollButton.addEventListener('click', () => {
        document.getElementById('story-list').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  set stories(data) {
    this.#stories = data;
    this.populateReportsList('', data);
  }

  populateReportsList(message, stories) {
    const reportsContainer = document.getElementById('reports-container');

    if (!stories || stories.length <= 0) {
      console.log('No stories to display');
      this.populateReportsListEmpty();
      return;
    }

    const html = stories.map((story, index) => {
      return `
        <div class="story-card">
          <img src="${story.photoUrl}" alt="${story.name}" class="story-photo">
          <h3>${story.name}</h3>
          <p id="story-description">${story.description}</p>
          <p><strong>Location:<br></strong> Latitude: ${story.lat},<br> Longitude: ${story.lon}</p>
          <div id="map-${index}" style="height: 200px; width: 100%; margin-top: 10px;" aria-label="Map showing location of story: ${story.name}"></div>
          <div class="story-card__actions">
            <button class="bookmark-button ${story.isBookmarked ? 'bookmarked' : ''}" data-id="${story.id}" aria-label="${story.isBookmarked ? 'Hapus dari bookmark' : 'Tambah ke bookmark'}">
              <i class="fas fa-bookmark"></i> ${story.isBookmarked ? 'Hapus dari Bookmark' : 'Tambah ke Bookmark'}
            </button>
            <a href="#/stories/${story.id}" class="detail-button">Read more</a>
          </div>
        </div>
      `;
    }).join('');

    reportsContainer.innerHTML = html;
    
    // Debugging: Check container content immediately after setting innerHTML

    // Add event listeners for bookmark buttons
    const bookmarkButtons = reportsContainer.querySelectorAll('.bookmark-button');
    bookmarkButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const id = button.dataset.id;
        const isBookmarked = button.classList.contains('bookmarked');
        
        // Find the corresponding story object from the initial stories array
        const story = stories.find(s => s.id === id);

        if (!story) {
             console.error('Story object not found for ID:', id);
             return;
        }

        console.log('Bookmark button clicked:', { storyId: id, isBookmarked, storyObject: story });
        
        try {
          // Pass the story object to toggleBookmark
          const success = await this.#presenter.toggleBookmark(story, isBookmarked);
          
          if (success) {
            // Toggle bookmark state in the local stories array
            story.isBookmarked = !isBookmarked;
            
            // Update UI
            button.classList.toggle('bookmarked');
            
            if (button.classList.contains('bookmarked')) {
              button.setAttribute('aria-label', 'Hapus dari bookmark');
              button.innerHTML = `<i class="fas fa-bookmark"></i> Hapus dari Bookmark`;
            } else {
              button.setAttribute('aria-label', 'Tambah ke bookmark');
              button.innerHTML = `<i class="fas fa-bookmark"></i> Tambah ke Bookmark`;
            }
          } else {
            console.error('Failed to toggle bookmark in IndexedDB');
          }
        } catch (error) {
          console.error('Error toggling bookmark:', error);
        }
      });
    });

    // Initialize maps
    stories.forEach((story, index) => {
      if (story.lat && story.lon) {
        try {
          const map = L.map(`map-${index}`, {
            zoomControl: true,
            doubleClickZoom: false,
          }).setView([story.lat, story.lon], 13);

          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);

          const marker = L.marker([story.lat, story.lon]).addTo(map);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    });
  }

  populateReportsListEmpty() {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = `
      <div class="story-card">Story is empty</div>
    `;
  }

  populateReportsListError(message) {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = `
      <div class="story-card">An error occurred: ${message}</div>
    `;
  }

  showLoading() {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = `<div class="loading-spinner">Loading...</div>`;
  }

  hideLoading() {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = '';
  }
}