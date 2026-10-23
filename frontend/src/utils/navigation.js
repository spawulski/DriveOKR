// frontend/src/utils/navigation.js
// Full-page navigation (e.g. to a backend OAuth route), isolated so tests can stub it.
export const navigateTo = (url) => {
  window.location.href = url;
};
