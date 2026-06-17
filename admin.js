const configWarning = document.querySelector("[data-config-warning]");
const loginSection = document.querySelector("[data-login]");
const adminSection = document.querySelector("[data-admin]");
const loginForm = document.querySelector("[data-login-form]");
const loginNote = document.querySelector("[data-login-note]");
const logoutButton = document.querySelector("[data-logout]");
const importButton = document.querySelector("[data-import-json]");
const projectForm = document.querySelector("[data-project-form]");
const projectNote = document.querySelector("[data-project-note]");
const projectList = document.querySelector("[data-project-list]");
const formTitle = document.querySelector("[data-form-title]");
const resetButton = document.querySelector("[data-reset-form]");
const siteContentForm = document.querySelector("[data-site-content-form]");
const siteContentNote = document.querySelector("[data-site-content-note]");
const saveSiteContentButton = document.querySelector("[data-save-site-content]");

const config = window.SAA_CMS || {};
const hasConfig =
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes("YOUR_SUPABASE_URL") &&
  !config.supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY");

const cms = hasConfig && window.supabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
let projects = [];
let siteContent = [];

const defaultSiteContent = [
  ["meta_description", "SEO - Description Google", "Agence spécialisée dans l'Architecture contemporaine, offrant un service complet couvrant le processus de création, de la conception architecturale à l'achèvement de la construction."],
  ["hero_eyebrow", "Accueil - Petit titre", "Agence d'architecture - Sousse & Tunis / Tunisie"],
  ["hero_line", "Accueil - Slogan", "Du concept à la vie"],
  ["hero_footer_left", "Accueil - Texte bas gauche", "Architecture contemporaine"],
  ["hero_footer_right", "Accueil - Texte bas droite", "Créé par Me. Sourour Aoun Allah Mhalla depuis 1990"],
  ["consultation_button", "Bouton consultation", "Demander une consultation"],
  ["intro_kicker", "Approche - Label", "Approche"],
  ["intro_title", "Approche - Titre", "Architecture Contemporaine"],
  ["intro_body_1", "Approche - Description 1", "Agence spécialisée dans l'Architecture contemporaine, offrant un service complet couvrant le processus de création, de la conception architecturale à l'achèvement de la construction. Créé par Me. Sourour Aoun Allah Mhalla depuis 1990."],
  ["intro_body_2", "Approche - Description 2", "Nous sommes à votre écoute pour donner vie à vos projets architecturaux."],
  ["projects_kicker", "Projets - Label", "Portfolio"],
  ["projects_title", "Projets - Titre", "NOS PROJETS"],
  ["about_kicker", "À propos - Label", "À propos"],
  ["about_title", "À propos - Titre", "Une architecture contemporaine, construite avec mesure depuis 1990."],
  ["about_body_1", "À propos - Paragraphe 1", "SAA ARCHI est une agence spécialisée dans l'Architecture contemporaine, créée par Me. Sourour Aoun Allah Mhalla depuis 1990."],
  ["about_body_2", "À propos - Paragraphe 2", "L'agence offre un service complet couvrant le processus de création, de la conception architecturale à l'achèvement de la construction."],
  ["about_body_3", "À propos - Paragraphe 3", "Implantée entre Sousse et Tunis, SAA ARCHI accompagne les projets avec une approche attentive, sobre et durable."],
  ["contact_kicker", "Contact - Label", "Contact"],
  ["contact_title", "Contact - Titre", "Contactez-nous"],
  ["contact_panel_title", "Contact - Titre agence", "SAA ARCHI"],
  ["contact_panel_body", "Contact - Description agence", "Agence spécialisée dans l'Architecture contemporaine. Nous sommes à votre écoute pour donner vie à vos projets architecturaux."],
  ["contact_form_title", "Contact - Titre formulaire", "Envoyez votre message"],
  ["contact_form_body", "Contact - Description formulaire", "N'hésitez pas à nous contacter. Nous serons ravis de vous aider."],
  ["footer_kicker", "Footer - Label", "SAA ARCHI"],
  ["footer_title", "Footer - Titre", "Architecture contemporaine depuis 1990."],
  ["footer_copy", "Footer - Copyright", "© 2024 SAA ARCHI. Tous droits réservés."],
].map(([key, label, value], index) => ({ key, label, value, input_type: "textarea", sort_order: index }));

if (!cms) {
  configWarning.hidden = false;
  loginSection.hidden = true;
}

function imageLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resetForm() {
  projectForm.reset();
  projectForm.id.value = "";
  projectForm.sort_order.value = "100";
  formTitle.textContent = "Nouveau projet";
}

function fillForm(project) {
  projectForm.id.value = project.id;
  projectForm.title.value = project.title || "";
  projectForm.date.value = project.date || "";
  projectForm.category.value = project.category || "VILLA";
  projectForm.thumbnail.value = project.thumbnail || "";
  projectForm.images.value = (project.images || []).join("\n");
  projectForm.location.value = project.location || "";
  projectForm.area_label.value = project.area_label || "";
  projectForm.status.value = project.status || "";
  projectForm.sort_order.value = project.sort_order ?? 100;
  projectForm.description.value = project.description || "";
  formTitle.textContent = "Modifier le projet";
  projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderProjects() {
  if (!projects.length) {
    projectList.innerHTML = '<p class="loading">Aucun projet pour le moment.</p>';
    return;
  }

  projectList.innerHTML = projects
    .map(
      (project) => `
        <article class="admin-project">
          <img src="${project.thumbnail}" alt="${project.title}" />
          <div>
            <h3>${project.title}</h3>
            <p>${project.category || ""} ${project.date ? "- " + project.date : ""}</p>
          </div>
          <div class="admin-project-actions">
            <button type="button" data-edit="${project.id}">Modifier</button>
            <button type="button" data-delete="${project.id}">Supprimer</button>
          </div>
        </article>
      `
    )
    .join("");
}

function mergedSiteContent(rows = []) {
  const stored = new Map(rows.map((item) => [item.key, item]));
  return defaultSiteContent.map((item) => ({ ...item, ...(stored.get(item.key) || {}) }));
}

function renderSiteContent() {
  siteContentForm.innerHTML = siteContent
    .map(
      (item) => `
        <label class="site-content-field">
          <span>${item.label}</span>
          <textarea name="${item.key}" rows="${item.value.length > 110 ? 4 : 2}">${item.value || ""}</textarea>
        </label>
      `
    )
    .join("");
}

async function loadSiteContent() {
  const { data, error } = await cms.from("site_content").select("*").order("sort_order", { ascending: true });

  if (error) {
    siteContent = mergedSiteContent();
    siteContentNote.textContent = error.message;
    renderSiteContent();
    return;
  }

  siteContent = mergedSiteContent(data || []);
  renderSiteContent();
}

async function loadProjects() {
  const { data, error } = await cms
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    projectList.innerHTML = `<p class="loading">${error.message}</p>`;
    return;
  }

  projects = data;
  renderProjects();
}

async function showAdmin() {
  loginSection.hidden = true;
  adminSection.hidden = false;
  await loadProjects();
  await loadSiteContent();
}

async function checkSession() {
  if (!cms) return;
  const { data } = await cms.auth.getSession();
  if (data.session) await showAdmin();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginNote.textContent = "Connexion...";

  const formData = new FormData(loginForm);
  const { error } = await cms.auth.signInWithPassword({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (error) {
    loginNote.textContent = error.message;
    return;
  }

  loginForm.reset();
  loginNote.textContent = "";
  await showAdmin();
});

logoutButton.addEventListener("click", async () => {
  await cms.auth.signOut();
  adminSection.hidden = true;
  loginSection.hidden = false;
});

importButton.addEventListener("click", async () => {
  if (!confirm("Importer les projets actuels depuis projects.json ?")) return;
  projectNote.textContent = "Import en cours...";

  const response = await fetch("projects.json");
  const localProjects = await response.json();
  const rows = localProjects.map((project, index) => ({
    title: project.title,
    date: project.date,
    category: project.category,
    thumbnail: project.thumbnail,
    images: project.images || [],
    location: project.location,
    area_label: project.areaLabel,
    status: project.status,
    description: project.description,
    sort_order: index,
  }));

  const { error } = await cms.from("projects").insert(rows);
  if (error) {
    projectNote.textContent = error.message;
    return;
  }

  projectNote.textContent = "Import terminé.";
  await loadProjects();
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  projectNote.textContent = "Enregistrement...";

  const formData = new FormData(projectForm);
  const id = formData.get("id");
  const payload = {
    title: formData.get("title"),
    date: formData.get("date"),
    category: formData.get("category"),
    thumbnail: formData.get("thumbnail"),
    images: imageLines(formData.get("images")),
    location: formData.get("location"),
    area_label: formData.get("area_label"),
    status: formData.get("status"),
    sort_order: Number(formData.get("sort_order") || 100),
    description: formData.get("description"),
  };

  const request = id ? cms.from("projects").update(payload).eq("id", id) : cms.from("projects").insert(payload);
  const { error } = await request;

  if (error) {
    projectNote.textContent = error.message;
    return;
  }

  projectNote.textContent = "Projet enregistré.";
  resetForm();
  await loadProjects();
});

projectList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const project = projects.find((item) => item.id === editButton.dataset.edit);
    if (project) fillForm(project);
  }

  if (deleteButton) {
    const project = projects.find((item) => item.id === deleteButton.dataset.delete);
    if (!project || !confirm(`Supprimer "${project.title}" ?`)) return;

    const { error } = await cms.from("projects").delete().eq("id", project.id);
    if (error) {
      projectNote.textContent = error.message;
      return;
    }

    await loadProjects();
  }
});

resetButton.addEventListener("click", resetForm);

saveSiteContentButton.addEventListener("click", async () => {
  siteContentNote.textContent = "Enregistrement des textes...";
  const formData = new FormData(siteContentForm);
  const rows = siteContent.map((item, index) => ({
    key: item.key,
    label: item.label,
    value: formData.get(item.key) || "",
    input_type: item.input_type || "textarea",
    sort_order: index,
  }));

  const { error } = await cms.from("site_content").upsert(rows, { onConflict: "key" });
  if (error) {
    siteContentNote.textContent = error.message;
    return;
  }

  siteContentNote.textContent = "Textes enregistrés.";
  await loadSiteContent();
});

checkSession();
