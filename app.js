const categories = ["TOUS", "BATIMENT CIVIL", "HOTELLERIE", "IMMEUBLE", "TERTIAIRE", "VILLA", "INTERIEUR"];

const state = {
  projects: [],
  category: "TOUS",
  search: "",
  content: {},
};

const header = document.querySelector("[data-header]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const homeSections = document.querySelectorAll(".home-section");
const filterWrap = document.querySelector("[data-filters]");
const projectSearch = document.querySelector("[data-project-search]");
const projectGrid = document.querySelector("[data-project-grid]");
const aboutPage = document.querySelector("[data-about-page]");
const projectPage = document.querySelector("[data-project-page]");
const form = document.querySelector("[data-form]");
const formNote = document.querySelector("[data-form-note]");

let revealObserver;
let ticking = false;

function finishLoading() {
  document.body.classList.add("is-loaded");
}

const defaultContent = {
  meta_description:
    "Agence spécialisée dans l'Architecture contemporaine, offrant un service complet couvrant le processus de création, de la conception architecturale à l'achèvement de la construction.",
  hero_eyebrow: "Agence d'architecture - Sousse & Tunis / Tunisie",
  hero_line: "Du concept à la vie",
  hero_footer_left: "Architecture contemporaine",
  hero_footer_right: "Créé par Me. Sourour Aoun Allah Mhalla depuis 1990",
  consultation_button: "Demander une consultation",
  intro_kicker: "Approche",
  intro_title: "Architecture Contemporaine",
  intro_body_1:
    "Agence spécialisée dans l'Architecture contemporaine, offrant un service complet couvrant le processus de création, de la conception architecturale à l'achèvement de la construction. Créé par Me. Sourour Aoun Allah Mhalla depuis 1990.",
  intro_body_2: "Nous sommes à votre écoute pour donner vie à vos projets architecturaux.",
  projects_kicker: "Portfolio",
  projects_title: "NOS PROJETS",
  about_kicker: "À propos",
  about_title: "Une architecture contemporaine, construite avec mesure depuis 1990.",
  about_body_1:
    "SAA ARCHI est une agence spécialisée dans l'Architecture contemporaine, créée par Me. Sourour Aoun Allah Mhalla depuis 1990.",
  about_body_2:
    "L'agence offre un service complet couvrant le processus de création, de la conception architecturale à l'achèvement de la construction.",
  about_body_3: "Implantée entre Sousse et Tunis, SAA ARCHI accompagne les projets avec une approche attentive, sobre et durable.",
  contact_kicker: "Contact",
  contact_title: "Contactez-nous",
  contact_panel_title: "SAA ARCHI",
  contact_panel_body:
    "Agence spécialisée dans l'Architecture contemporaine. Nous sommes à votre écoute pour donner vie à vos projets architecturaux.",
  contact_form_title: "Envoyez votre message",
  contact_form_body: "N'hésitez pas à nous contacter. Nous serons ravis de vous aider.",
  footer_kicker: "SAA ARCHI",
  footer_title: "Architecture contemporaine depuis 1990.",
  footer_copy: "© 2024 SAA ARCHI. Tous droits réservés.",
};

state.content = { ...defaultContent };

function content(key) {
  return state.content[key] ?? defaultContent[key] ?? "";
}

function applySiteContent() {
  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = content(element.dataset.content);
    if (value) element.textContent = value;
  });

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", content("meta_description"));
}

function primeStaticReveals() {
  document
    .querySelectorAll(".section-head, .intro-grid, .contact-grid, .map-wrap, .site-footer")
    .forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    });
}

function getCmsClient() {
  const config = window.SAA_CMS || {};
  const hasConfig =
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_SUPABASE_URL") &&
    !config.supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY");

  if (!hasConfig || !window.supabase) return null;
  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueImages(project) {
  return [project.thumbnail, ...(project.images || [])].filter((url, index, list) => url && list.indexOf(url) === index);
}

function cloudinaryImage(url, options = "f_auto,q_auto:good,c_limit,w_1600") {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  if (url.includes("/f_auto,") || url.includes("/q_auto")) return url;
  return url.replace("/image/upload/", `/image/upload/${options}/`);
}

function projectFacts(project) {
  return [
    ["Catégorie", project.category],
    ["Date", project.date],
    ["Localisation", project.location],
    ["Surface", project.areaLabel],
    ["Statut", project.status],
  ].filter(([, value]) => value);
}

function projectNarrative(project) {
  return [
    {
      title: "Contexte",
      body: [project.location, project.category, project.date].filter(Boolean).join(" · "),
    },
    {
      title: "Intention architecturale",
      body: project.description || "",
    },
    {
      title: "Matériaux & lumière",
      body: "Lecture visuelle à partir des images originales du projet.",
    },
    {
      title: "Surface",
      body: project.areaLabel || "",
    },
    {
      title: "Statut",
      body: project.status || "",
    },
  ].filter((item) => item.body);
}

function isLocalPreview() {
  return ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
}

function routeSlug() {
  if (window.location.hash.startsWith("#projects/")) {
    return decodeURIComponent(window.location.hash.replace("#projects/", ""));
  }

  const match = window.location.pathname.match(/^\/projects\/(.+)\/?$/);
  return match ? decodeURIComponent(match[1]).replace(/\/$/, "") : null;
}

function isAboutRoute() {
  if (window.location.hash === "#about") return true;
  if (window.location.protocol === "file:") return false;
  return window.location.pathname.replace(/\/$/, "") === "/about";
}

function projectUrl(project) {
  const slug = slugify(project.title);
  return isLocalPreview() ? `#projects/${slug}` : `/projects/${slug}`;
}

function aboutUrl() {
  return isLocalPreview() ? "#about" : "/#about";
}

function findProjectBySlug(slug) {
  return state.projects.find((project) => slugify(project.title) === slug);
}

function setHeaderState() {
  const onProjectPage = document.body.classList.contains("project-route");
  const onAboutPage = document.body.classList.contains("about-route");
  header.classList.toggle("is-scrolled", onProjectPage || onAboutPage || window.scrollY > 12);
}

function setActiveNav(activeKey) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.navLink === activeKey);
  });
}

function updateActiveNav() {
  if (document.body.classList.contains("about-route")) {
    setActiveNav("about");
    return;
  }

  if (document.body.classList.contains("project-route")) {
    setActiveNav("projets");
    return;
  }

  let active = "accueil";
  homeSections.forEach((section) => {
    if (section.hidden) return;
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.42 && rect.bottom >= window.innerHeight * 0.24) {
      active = section.id || "accueil";
    }
  });
  setActiveNav(active);
}

window.addEventListener("scroll", () => {
  setHeaderState();
  updateActiveNav();
  updateParallax();
});

function initReveal() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}

function updateParallax() {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    document.querySelectorAll("[data-parallax]").forEach((image) => {
      const rect = image.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      image.style.setProperty("--parallax", `${Math.max(-18, Math.min(18, progress * -26))}px`);
    });
    ticking = false;
  });
}

function renderFilters() {
  const counts = state.projects.reduce(
    (total, project) => {
      total[project.category] = (total[project.category] || 0) + 1;
      total.TOUS += 1;
      return total;
    },
    { TOUS: 0 }
  );

  filterWrap.innerHTML = categories
    .map(
      (category) => `
        <button class="${category === state.category ? "is-active" : ""}" type="button" data-category="${category}">
          <span>${category}</span>
          <em>(${counts[category] || 0})</em>
        </button>
      `
    )
    .join("");
}

function renderProjects() {
  const query = state.search.trim().toLowerCase();
  const projects = state.projects.filter((project) => {
    const matchesCategory = state.category === "TOUS" || project.category === state.category;
    const matchesSearch =
      !query ||
      [project.title, project.location, project.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  if (!projects.length) {
    projectGrid.innerHTML = '<p class="loading">Aucun projet trouvé</p>';
    return;
  }

  projectGrid.innerHTML = projects
    .map((project, index) => {
      const title = escapeHtml(project.title);

      return `
        <a class="project-card reveal portfolio-reveal" href="${projectUrl(project)}" data-project="${project._id}" data-project-link aria-label="${title}" style="--reveal-delay: ${Math.min(index * 65, 520)}ms">
          <span class="project-media">
            <img src="${cloudinaryImage(project.thumbnail, "f_auto,q_auto:good,c_limit,w_1200")}" alt="${title}" loading="lazy" />
          </span>
          <div class="project-info">
            <div class="project-meta">
              ${project.category ? `<span>${escapeHtml(project.category)}</span>` : ""}
              ${project.date ? `<span>${escapeHtml(project.date)}</span>` : ""}
            </div>
            <h3>${title}</h3>
          </div>
        </a>
      `;
    })
    .join("");

  initReveal();
}

function openLightbox(images, startIndex = 0, title = "Projet") {
  let index = startIndex;
  const lightbox = document.createElement("div");
  lightbox.className = "gallery-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");

  const render = () => {
    const imageUrl = cloudinaryImage(images[index], "f_auto,q_auto:good,c_limit,w_2400");
    lightbox.innerHTML = `
      <button class="lightbox-close" type="button" data-lightbox-close aria-label="Fermer">Fermer</button>
      <button class="lightbox-arrow is-prev" type="button" data-lightbox-prev aria-label="Image précédente">‹</button>
      <span class="lightbox-bg" style="background-image: url('${imageUrl.replaceAll("'", "%27")}')"></span>
      <img src="${imageUrl}" alt="${escapeHtml(title)}" />
      <button class="lightbox-arrow is-next" type="button" data-lightbox-next aria-label="Image suivante">›</button>
      <p>${index + 1} / ${images.length}</p>
    `;
  };

  const move = (direction) => {
    index = (index + direction + images.length) % images.length;
    render();
  };

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest("[data-lightbox-close]")) lightbox.remove();
    if (event.target.closest("[data-lightbox-prev]")) move(-1);
    if (event.target.closest("[data-lightbox-next]")) move(1);
  });

  render();
  document.body.appendChild(lightbox);
}

function adjacentProject(project, direction) {
  const index = state.projects.findIndex((item) => item._id === project._id);
  if (index < 0) return null;
  const nextIndex = (index + direction + state.projects.length) % state.projects.length;
  return state.projects[nextIndex];
}

function renderAboutPage() {
  document.title = "À propos - SAA ARCHI";
  document.body.classList.remove("project-route");
  document.body.classList.add("about-route");
  homeSections.forEach((section) => {
    section.hidden = true;
  });
  projectPage.hidden = true;
  projectPage.innerHTML = "";
  aboutPage.hidden = false;
  aboutPage.innerHTML = `
    <article class="about-shell">
      <a href="#accueil" class="project-back about-back" data-back-home>Retour à l'accueil</a>
      <div class="about-heading reveal">
        <p class="section-kicker">${escapeHtml(content("about_kicker"))}</p>
        <h1>${escapeHtml(content("about_title"))}</h1>
      </div>
      <div class="about-story">
        <p class="reveal">
          ${escapeHtml(content("about_body_1"))}
        </p>
        <p class="reveal">
          ${escapeHtml(content("about_body_2"))}
        </p>
        <p class="reveal">
          ${escapeHtml(content("about_body_3"))}
        </p>
      </div>
      <a class="consult-link reveal" href="#contact">${escapeHtml(content("consultation_button"))}</a>
    </article>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
  setHeaderState();
  updateActiveNav();
  initReveal();
}

function renderProjectPage(project) {
  const images = uniqueImages(project);
  const previous = adjacentProject(project, -1);
  const next = adjacentProject(project, 1);
  const title = escapeHtml(project.title);

  document.title = `${project.title} - SAA ARCHI`;
  document.body.classList.remove("about-route");
  document.body.classList.add("project-route");
  homeSections.forEach((section) => {
    section.hidden = true;
  });
  aboutPage.hidden = true;
  aboutPage.innerHTML = "";
  projectPage.hidden = false;
  projectPage.innerHTML = `
    <article>
      <section class="project-page-hero">
        <img src="${cloudinaryImage(project.thumbnail, "f_auto,q_auto:good,c_limit,w_2200")}" alt="${title}" data-parallax />
        <div class="project-page-overlay"></div>
        <div class="project-page-hero-content reveal">
          <a href="${window.location.protocol === "file:" ? "#projets" : "/#projets"}" class="project-back" data-back-projects>Retour aux projets</a>
          <p class="section-kicker">${escapeHtml(project.category || "Projet")}</p>
          <h1>${title}</h1>
          <a class="consult-link project-consult" href="${window.location.protocol === "file:" ? "#contact" : "/#contact"}">Demander une consultation</a>
        </div>
      </section>

      <section class="project-editorial section-pad">
        <aside class="project-facts reveal">
          ${projectFacts(project)
            .map(([label, value]) => `<p><span>${label}</span>${escapeHtml(value)}</p>`)
            .join("")}
        </aside>
        <div class="project-copy">
          ${projectNarrative(project)
            .map(
              (item, index) => `
                <section class="project-story-block reveal" style="--reveal-delay: ${Math.min(index * 80, 320)}ms">
                  <span>${escapeHtml(item.title)}</span>
                  <p>${escapeHtml(item.body)}</p>
                </section>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="project-gallery-page">
        ${images
          .map(
            (image, index) => `
              <figure class="project-gallery-item ${index % 3 === 0 ? "is-wide" : ""} reveal">
                <button type="button" data-gallery-index="${index}" aria-label="Afficher l'image ${index + 1} de ${title}">
                  <img src="${cloudinaryImage(image, "f_auto,q_auto:good,c_limit,w_1800")}" alt="${title}" loading="${index < 2 ? "eager" : "lazy"}" data-parallax />
                </button>
              </figure>
            `
          )
          .join("")}
      </section>

      <nav class="project-navigation section-pad" aria-label="Navigation entre projets">
        ${
          previous
            ? `<a href="${projectUrl(previous)}" data-project="${previous._id}" data-project-link>
                <img src="${cloudinaryImage(previous.thumbnail, "f_auto,q_auto:good,c_fill,w_980,h_620")}" alt="${escapeHtml(previous.title)}" loading="lazy" />
                <span>Projet précédent</span>
                <strong>${escapeHtml(previous.title)}</strong>
              </a>`
            : ""
        }
        ${
          next
            ? `<a href="${projectUrl(next)}" data-project="${next._id}" data-project-link>
                <img src="${cloudinaryImage(next.thumbnail, "f_auto,q_auto:good,c_fill,w_980,h_620")}" alt="${escapeHtml(next.title)}" loading="lazy" />
                <span>Projet suivant</span>
                <strong>${escapeHtml(next.title)}</strong>
              </a>`
            : ""
        }
      </nav>
    </article>
  `;

  projectPage.dataset.gallery = JSON.stringify(images);

  window.scrollTo({ top: 0, behavior: "smooth" });
  setHeaderState();
  updateActiveNav();
  initReveal();
  updateParallax();
}

function renderHome(scrollToProjects = false) {
  document.title = "SAA ARCHI - Agence d'architecture - Sousse / Tunisie";
  document.body.classList.remove("project-route", "about-route");
  aboutPage.hidden = true;
  aboutPage.innerHTML = "";
  projectPage.hidden = true;
  projectPage.innerHTML = "";
  homeSections.forEach((section) => {
    section.hidden = false;
  });
  setHeaderState();
  updateActiveNav();
  renderFilters();
  renderProjects();

  if (scrollToProjects) {
    requestAnimationFrame(() => document.querySelector("#projets").scrollIntoView({ behavior: "smooth" }));
  }
}

function handleRoute() {
  if (isAboutRoute()) {
    renderAboutPage();
    return;
  }

  const slug = routeSlug();
  if (!slug) {
    renderHome(window.location.hash === "#projets");
    return;
  }

  const project = findProjectBySlug(slug);
  if (project) {
    renderProjectPage(project);
    return;
  }

  renderHome();
}

filterWrap.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderFilters();
  renderProjects();
});

if (projectSearch) {
  projectSearch.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProjects();
  });
}

document.addEventListener("click", (event) => {
  const projectLink = event.target.closest("[data-project-link]");
  const backLink = event.target.closest("[data-back-projects]");
  const aboutLink = event.target.closest("[data-about-link]");
  const backHome = event.target.closest("[data-back-home]");
  const contactLink = event.target.closest('a[href$="#contact"]');
  const galleryButton = event.target.closest("[data-gallery-index]");

  if (galleryButton) {
    event.preventDefault();
    const images = JSON.parse(projectPage.dataset.gallery || "[]");
    if (images.length) openLightbox(images, Number(galleryButton.dataset.galleryIndex), document.title.replace(" - SAA ARCHI", ""));
    return;
  }

  if (aboutLink) {
    event.preventDefault();
    history.pushState({}, "", aboutUrl());
    renderAboutPage();
    return;
  }

  if (backHome) {
    event.preventDefault();
    history.pushState({}, "", "#accueil");
    renderHome(false);
    return;
  }

  if (contactLink && (document.body.classList.contains("project-route") || document.body.classList.contains("about-route"))) {
    event.preventDefault();
    history.pushState({}, "", window.location.protocol === "file:" ? "#contact" : "/#contact");
    renderHome(false);
    requestAnimationFrame(() => document.querySelector("#contact").scrollIntoView({ behavior: "smooth" }));
    return;
  }

  if (backLink) {
    event.preventDefault();
    history.pushState({}, "", window.location.protocol === "file:" ? "#projets" : "/#projets");
    renderHome(true);
    return;
  }

  if (projectLink) {
    event.preventDefault();
    const project = state.projects.find((item) => item._id === projectLink.dataset.project);
    if (!project) return;
    document.body.classList.add("is-route-transitioning");
    window.setTimeout(() => {
      history.pushState({}, "", projectLink.getAttribute("href"));
      renderProjectPage(project);
      document.body.classList.remove("is-route-transitioning");
    }, 180);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelector(".gallery-lightbox")?.remove();
});

window.addEventListener("popstate", handleRoute);
window.addEventListener("hashchange", handleRoute);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
const submitButton = form.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(form).entries());

  formNote.textContent = "Envoi du message...";
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Message not sent");

    form.reset();
    formNote.textContent = "Merci pour votre message ! Nous vous contacterons bientôt.";
  } catch (error) {
    formNote.textContent = "Le message n'a pas pu être envoyé. Vous pouvez nous écrire directement à contact@saa-archi.com.tn.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

async function loadProjects() {
  try {
    const cms = getCmsClient();
    if (cms) {
      const [{ data, error }, contentResponse] = await Promise.all([
        cms
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        cms.from("site_content").select("key,value"),
      ]);

      if (error) throw error;
      state.projects = data.map((project) => ({
        _id: project.id,
        title: project.title,
        date: project.date,
        category: project.category,
        thumbnail: project.thumbnail,
        images: project.images || [],
        location: project.location,
        areaLabel: project.area_label,
        status: project.status,
        description: project.description,
      }));

      if (!contentResponse.error && contentResponse.data) {
        state.content = {
          ...defaultContent,
          ...Object.fromEntries(contentResponse.data.map((item) => [item.key, item.value])),
        };
      }
    } else {
      try {
        const response = await fetch("projects.json");
        if (!response.ok) throw new Error("Impossible de charger les projets");
        state.projects = await response.json();
      } catch (error) {
        if (!window.SAA_PROJECTS) throw error;
        state.projects = window.SAA_PROJECTS;
      }
    }

    applySiteContent();
    handleRoute();
    finishLoading();
  } catch (error) {
    projectGrid.innerHTML = '<p class="loading">Aucun projet trouvé</p>';
    finishLoading();
  }
}

primeStaticReveals();
setHeaderState();
updateActiveNav();
renderFilters();
loadProjects();
