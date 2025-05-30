import * as StoryAPI from '../data/api';
import { addBookmark, getBookmark, getAllBookmarks, deleteBookmark } from '../data/indexeddb-helper';

export default class AppPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel = null }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  // Login Presenter Logic
  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.getLogin({ email, password });
      console.log(response);
      if (!response.ok) {
        console.error('getLogin: response:', response);
        this.#view.loginFailed(response.message);
        return;
      }

      if (this.#authModel) {
        this.#authModel.putAccessToken(response.loginResult.token);
      }

      this.#view.loginSuccessfully(response.message, response.loginResult);
    } catch (error) {
      console.error('getLogin: error:', error);
      this.#view.loginFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  // Register Presenter Logic
  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.getRegistered({ name, email, password });

      if (!response.ok) {
        console.error('getRegistered: response:', response);
        this.#view.registeredFailed(response.message);
        return;
      }

      this.#view.registeredSuccessfully(response.message, response.data);
    } catch (error) {
      console.error('getRegistered: error:', error);
      this.#view.registeredFailed(error.message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  // Home Presenter Logic
  async initialStory() {
    this.#view.showLoading();
    try {
      const response = await this.#model.getAllReports();
      console.log("initialStory: API response:", response);

      if (!response.ok) {
        console.error("initialStory: API error response:", response);
        this.#view.populateReportsListError(response.message);
        return;
      }

      if (!response.listStory) {
        console.error("No stories found in API response");
        this.#view.populateReportsListEmpty("No stories available from API"); // Assuming you have an empty state for home too
        return;
      }

      // Get all bookmarks from IndexedDB
      const bookmarkedStories = await getAllBookmarks();
      
      // Ensure bookmarkedStories is an array before mapping
      const bookmarkedIds = new Set(Array.isArray(bookmarkedStories) ? bookmarkedStories.map(story => story.id) : []);

      // Map the stories and add isBookmarked property based on IndexedDB
      const stories = response.listStory.map(story => ({
        ...story,
        isBookmarked: bookmarkedIds.has(story.id)
      }));

      console.log("initialStory: Processed stories (with bookmark status):", stories);
      this.#view.populateReportsList(response.message, stories);
    } catch (error) {
      console.error("initialStory: error:", error);
      // Consider fetching from IndexedDB as a fallback if API fails
      try {
        const offlineStories = await getAllBookmarks();
        console.log("initialStory: Fetched offline stories from IndexedDB:", offlineStories);
        if (offlineStories.length > 0) {
             this.#view.populateReportsList("Menampilkan cerita dari offline", offlineStories);
        } else {
             this.#view.populateReportsListEmpty("Gagal memuat cerita dan tidak ada data offline.");
        }
      } catch(dbError) {
           console.error("initialStory: IndexedDB fallback error:", dbError);
           this.#view.populateReportsListError(error.message);
      }
    } finally {
      // Loading should be hidden by the view after populating or showing error/empty state
      // this.#view.hideLoading(); // Already removed
    }
  }

  // Add Presenter Logic
  async postNewStory({ description, photo, lat, lon }) {
    this.#view.showSubmitLoadingButton();
    try {
      const data = { description, photo, lat, lon };
      const response = await this.#model.TambahData(data);

      if (!response.ok) {
        console.error('TambahData: response:', response);
        this.#view.storeFailed(response.message || 'Failed to add story');
        return;
      }

      this.#view.storeSuccessfully(response.message || 'Story added successfully', response.data);
    } catch (error) {
      console.error('TambahData: error:', error);
      this.#view.storeFailed(error.message || 'An error occurred');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  // Detail Presenter Logic
  async getDetailStory(id) {
    this.#view.showDetailLoading();
    try {
      const response = await this.#model.getStoryById(id);
      console.log('API Response in getDetailStory:', response);
  
      if (!response.ok) {
        console.error('getDetailStory: response failed:', response);
        this.#view.storeFailed(response.message || 'Failed to fetch story');
        return;
      }
  
      let story = response.data || response.story || response;
      if (!story || Object.keys(story).length === 0) {
        console.error('No valid story data found:', response);
        this.#view.storeFailed('No story data available');
        return;
      }
  
      this.#view.storeSuccessfully(response.message || 'Success', story);
      this.#view.StoryDetail(story);
      if (story.lat && story.lon) {
        this.#view.initialMap(story.lat, story.lon);
      } else {
        console.log('Latitude or longitude missing:', story);
      }
    } catch (error) {
      console.error('getDetailStory: error:', error);
      this.#view.storeFailed(error.message || 'An error occurred');
    } finally {
      this.#view.hideDetailLoading();
    }
  }

  // Bookmark Presenter Logic
  async initialBookmark() {
    this.#view.showReportsListLoading();

    try {
      // Fetch bookmarked stories directly from IndexedDB
      const bookmarkedReports = await getAllBookmarks();
      const message = 'Berhasil mendapatkan daftar laporan tersimpan dari offline.';
      this.#view.populateBookmarkedReports(message, bookmarkedReports);

      // Optional: Attempt to sync with API in background
      // const response = await this.#model.getAllReports();
      // if (response.ok) {
      //   // Sync logic here if needed
      // }

    } catch (error) {
      console.error('initialBookmark: error:', error);
      this.#view.populateBookmarkedReportsError(error.message);
    } finally {
      this.#view.hideReportsListLoading();
    }
  }

  async toggleBookmark(story, isBookmarked) {
    try {
      console.log('toggleBookmark: Toggling bookmark for story:', story.id, 'isBookmarked (before toggle):', isBookmarked);
      let success = false;

      if (isBookmarked) {
        // Delete from IndexedDB
        await deleteBookmark(story.id);
        console.log('toggleBookmark: Deleted from IndexedDB:', story.id);
        success = true; // Assume IndexedDB operation is successful
        // Removed API call for unbookmarking
        // this.#model.unbookmarkStory(story.id).catch(apiError => console.error('toggleBookmark: API unbookmark failed:', apiError));

      } else {
        // Add to IndexedDB
        // Ensure the story object has necessary properties for IndexedDB
        const storyToSave = {
             id: story.id,
             name: story.name,
             description: story.description,
             photoUrl: story.photoUrl,
             createdAt: story.createdAt,
             location: story.location || {},
             lat: story.lat,
             lon: story.lon,
             // Add other necessary properties if any
        };
        await addBookmark(storyToSave);
        console.log('toggleBookmark: Added to IndexedDB:', story.id);
        success = true; // Assume IndexedDB operation is successful
        // Removed API call for bookmarking
        // this.#model.bookmarkStory(story.id).catch(apiError => console.error('toggleBookmark: API bookmark failed:', apiError));
      }

      return success;
    } catch (error) {
      console.error('toggleBookmark: IndexedDB operation failed:', error);
      // If IndexedDB fails, the UI should probably reflect the original state
      return false;
    }
  }
}

// Helper function for mapping report data
async function reportMapper(report) {
  const lat = report.lat;
  const lon = report.lon;

  let placeName = 'Lokasi tidak diketahui';

  if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
    try {
      placeName = await getPlaceNameByCoordinate(lat, lon);
    } catch (error) {
      console.error('Error getting place name:', error);
      placeName = 'Lokasi tidak diketahui';
    }
  }

  return {
    ...report,
    location: {
      latitude: lat || null,
      longitude: lon || null,
      placeName,
    },
  };
}

// Helper function for getting place name
async function getPlaceNameByCoordinate(lat, lon) {
  return `Lokasi: ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}