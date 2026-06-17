# SAA ARCHI - Espace admin projets

## 1. Créer la base Supabase

1. Crée un projet sur Supabase.
2. Va dans `SQL Editor`.
3. Copie/colle tout le contenu de `supabase-schema.sql`.
4. Lance le script.

## 2. Ajouter les clés du projet

Dans `cms-config.js`, remplace:

```js
window.SAA_CMS = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

par les valeurs de ton projet Supabase:

```js
window.SAA_CMS = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "ta-cle-anon-public",
};
```

La clé `anon` est publique. Ne mets jamais la clé `service_role` dans le site.

## 3. Créer le compte admin

Dans Supabase:

1. Va dans `Authentication`.
2. Crée un utilisateur avec email + mot de passe.
3. Désactive les inscriptions publiques si tu ne veux pas que d'autres personnes puissent créer un compte.

## 4. Utiliser l'admin

Après publication, ouvre:

```txt
https://ton-domaine.com/admin.html
```

Connecte-toi avec l'email et le mot de passe créés dans Supabase.

Tu peux:

- ajouter un nouveau projet
- modifier un projet
- supprimer un projet
- importer les projets actuels depuis `projects.json`

Pour les images, colle une URL par ligne. Tu peux continuer à utiliser Cloudinary comme actuellement.

## 5. Important

Tant que Supabase n'est pas configuré, le site continue de charger les projets depuis `projects.json`.
Une fois Supabase configuré, le site public charge automatiquement les projets depuis la base de données.
