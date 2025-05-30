import AppPresenter from '../../utils/presenter';
import { parseActivePathname } from '../../routes/url-parser';
import * as StoryAPI from '../../data/api';

export default class DetailPage {
  #presenter = null;
  #map;
  #story = null;

  async render() {
    return `
      <section>
        <div class="story-detail__container">
          <p id="story-id"></p>
          <p id="story-name"></p>
          <p id="story-description"></p>
          <img id="story-photo" src="" alt="Photo" />
          <p id="story-created-at"></p>
          <p id="story-lat"></p>
          <p id="story-lon"></p>
          <div id="map" style="height: 400px; width: 100%;"></div>

          <!-- Loading Container -->
          <div id="story-detail-loading-container" class="loading-container" style="display: none;">
            <div class="loader">Loading...</div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyId = parseActivePathname().id;
    console.log(storyId);

    this.#presenter = new AppPresenter({
      view: this,
      model: StoryAPI,
    });

    await this.#presenter.getDetailStory(storyId);
  }

  StoryDetail(story) {
    if (!story) {
      console.error('StoryDetail: story is undefined');
      this.storeFailed('Story data is missing');
      return;
    }
    this.#story = story;
    document.getElementById('story-id').innerHTML = `ID: ${story.id || 'N/A'}`;
    document.getElementById('story-name').innerHTML = `Nama: ${story.name || 'N/A'}`;
    document.getElementById('story-description').innerHTML = `Deskripsi: ${story.description || 'N/A'}`;
    document.getElementById('story-photo').src = story.photoUrl || '';
    document.getElementById('story-created-at').innerHTML = `Tanggal: ${story.createdAt ? new Date(story.createdAt).toLocaleString() : 'N/A'}`;
    document.getElementById('story-lat').innerHTML = `Lat: ${story.lat || 'N/A'}`;
    document.getElementById('story-lon').innerHTML = `Lon: ${story.lon || 'N/A'}`;
  }

  async initialMap(lat, lon) {
    this.#map = L.map("map", {
      zoomControl: true,
      doubleClickZoom: false,
    });

    if (lat && lon) {
      this.#map.setView([lat, lon], 13);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(this.#map);

      const marker = L.marker([lat, lon]).addTo(this.#map);
      marker.bindPopup(
        `<b>${this.#story.name || 'Nama Tidak Tersedia'}</b><br>
        Deskripsi: ${this.#story.description || 'Tidak ada deskripsi'}<br>
        Latitude: ${lat.toFixed(6)}<br>
        Longitude: ${lon.toFixed(6)}`,
        { autoClose: false, closeOnClick: false }
      ).openPopup();
    } else {
      console.log("Lokasi tidak tersedia.");
    }
  }

  hideDetailLoading() {
    const loadingContainer = document.getElementById('story-detail-loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }

  showDetailLoading() {
    const loadingContainer = document.getElementById('story-detail-loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'block';
    }
  }

  storeFailed(message) {
    alert(`Error: ${message}`);
  }

  storeSuccessfully(message, data) {
    console.log(message, data);
  }
}