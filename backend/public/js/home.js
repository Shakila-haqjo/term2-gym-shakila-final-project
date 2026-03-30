// home.js - Landing page interactions
document.addEventListener('DOMContentLoaded', () => {
  // Animate stats numbers
  const counters = document.querySelectorAll('.stats-bar-item .num');
  counters.forEach(counter => {
    const target = parseInt(counter.textContent.replace('+', ''));
    let current = 0;
    const increment = Math.ceil(target / 40);
    const suffix = counter.textContent.includes('+') ? '+' : '';
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = current + suffix;
    }, 30);
  });
});
