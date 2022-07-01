const themeToggle = document.getElementById("theme-toggle");

if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  themeToggle.checked = true;
} else {
  document.documentElement.classList.remove('dark');
  themeToggle.checked = false;
}

document.getElementById("theme-toggle").addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    localStorage.theme = 'dark';
    document.documentElement.classList.add('dark');
  } else {
    localStorage.theme = 'light';
    document.documentElement.classList.remove('dark');
  }
})