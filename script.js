const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      navigation.classList.remove("is-open");
    }
  });
}

const revealTargets = document.querySelectorAll(
  "main h1, main h2, main h3, main p, .principles > div, .approach-step, .contact-link"
);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (revealTargets.length && !prefersReducedMotion) {
  const revealGroups = new Map();
  const pendingRevealTargets = new Set(revealTargets);

  revealTargets.forEach((element) => {
    const parent = element.parentElement;
    const siblingIndex = revealGroups.get(parent) || 0;
    revealGroups.set(parent, siblingIndex + 1);
    element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex, 3) * 90}ms`);
    element.classList.add("scroll-reveal");
  });

  const revealVisibleText = () => {
    pendingRevealTargets.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top >= window.innerHeight * 0.9 || bounds.bottom <= 0) return;
      element.classList.add("is-visible");
      pendingRevealTargets.delete(element);
    });
    if (!pendingRevealTargets.size) {
      window.removeEventListener("scroll", revealVisibleText);
      window.removeEventListener("resize", revealVisibleText);
    }
  };

  window.addEventListener("scroll", revealVisibleText, { passive: true });
  window.addEventListener("resize", revealVisibleText);
  revealVisibleText();
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
}
