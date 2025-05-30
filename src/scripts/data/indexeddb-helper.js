const DATABASE_NAME = 'story-app-database';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'bookmarks';

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const addBookmark = async (story) => {
  const db = await openDatabase();
  const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OBJECT_STORE_NAME);
  store.add(story);
  return tx.complete;
};

const getBookmark = async (id) => {
  const db = await openDatabase();
  const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
  const store = tx.objectStore(OBJECT_STORE_NAME);
  return store.get(id);
};

const getAllBookmarks = async () => {
  const db = await openDatabase();
  const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
  const store = tx.objectStore(OBJECT_STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const deleteBookmark = async (id) => {
  const db = await openDatabase();
  const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OBJECT_STORE_NAME);
  store.delete(id);
  return tx.complete;
};

export { addBookmark, getBookmark, getAllBookmarks, deleteBookmark }; 