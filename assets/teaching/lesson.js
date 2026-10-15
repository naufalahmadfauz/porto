(() => {
  "use strict";

  document.querySelectorAll("[data-quiz]").forEach(quiz => {
    quiz.addEventListener("change", event => {
      if (!event.target.matches('input[type="radio"]')) return;
      const correct = event.target.value === quiz.dataset.correct;
      const feedback = quiz.querySelector('[role="status"]');
      feedback.textContent = `${correct ? "Yes." : "Not quite."} ${quiz.dataset.explanation}`;
    });
  });
})();
