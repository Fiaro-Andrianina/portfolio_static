# Portfolio — Fiaro Andrianina

Site personnel statique, sans framework, sans build et sans dépendance à installer.
HTML, CSS et JavaScript natif.

- Production : <https://fiaro-andrianina.vercel.app/>
- Dépôt : <https://github.com/Fiaro-Andrianina/portfolio_static>

## Structure

```text
.
├── index.html              # Accueil : hero, à propos, formation, projets, compétences, expériences, contact
├── contact.html            # Formulaire + coordonnées directes
├── confidentialite.html    # Politique de confidentialité
├── merci.html              # Confirmation après un envoi sans JavaScript
├── 404.html                # Page introuvable
├── vercel.json             # En-têtes de sécurité et redirections
├── robots.txt
├── sitemap.xml
├── css/
│   ├── variables.css       # Couleurs, largeurs, ombres, transitions
│   ├── base.css            # Reset, focus, skip-link, footer, reveal
│   ├── no-js.css           # Replis chargés uniquement dans <noscript>
│   └── components/
│       ├── nav.css
│       ├── hero.css
│       ├── about.css
│       ├── education.css
│       ├── projects.css
│       ├── skills.css
│       ├── experience.css
│       ├── contact.css
│       ├── form.css
│       └── pages.css       # 404, merci, confidentialité
├── js/
│   ├── main.js             # Menu mobile, focus trap, reveal, tilt, toggle « À propos »
│   └── contact.js          # Validation et envoi AJAX du formulaire
└── images/
    ├── favicon.svg
    ├── apple-touch-icon.png
    ├── og-image.jpg        # Partage social (1200×630)
    ├── hero-*.webp|jpg     # Portrait
    ├── taxi-ako-*.webp|jpg # Projet Taxi-Be Ako
    ├── portfolio-*.webp|jpg
    ├── project-infra.svg   # Schéma d'infrastructure (illustration)
    └── CV_Fiaro_Andrianina_detaille.pdf
```

## Formulaire de contact

Le formulaire de `contact.html` envoie les messages à **rktfify@gmail.com**
via [FormSubmit](https://formsubmit.co/). Aucun backend n'est nécessaire.

- Avec JavaScript : envoi AJAX vers `https://formsubmit.co/ajax/rktfify@gmail.com`.
- Sans JavaScript : POST natif vers `https://formsubmit.co/rktfify@gmail.com`,
  puis redirection vers `merci.html` grâce au champ `_next`.
- L'endpoint AJAX est dérivé de l'attribut `action` du formulaire : une seule
  adresse à modifier dans le HTML.

### Première mise en service

FormSubmit exige une activation avant le premier envoi :

1. Envoyer un message depuis le site (ou depuis un formulaire de test).
2. Ouvrir l'e-mail d'activation reçu sur `rktfify@gmail.com` et cliquer sur le lien.
3. Renvoyer un message pour vérifier la réception.

Tant que le formulaire n'est pas activé, la page affiche un message qui renvoie
vers l'adresse e-mail directe : aucun message n'est perdu silencieusement.

Après activation, FormSubmit peut fournir une adresse alias propre au formulaire.
Elle peut remplacer `rktfify@gmail.com` dans l'attribut `action` de
`contact.html` : l'endpoint AJAX se met à jour automatiquement.

### Protection anti-spam

- Champ piège `_honey`, masqué en CSS et invisible pour les humains.
- Rejet des envois effectués moins de 3 secondes après le chargement.
- Filtrage côté FormSubmit.

## Conventions

- **Aucune dépendance et aucun build.** Le site doit rester déployable tel quel.
- **CSS** : les couleurs, rayons, ombres et transitions passent par `variables.css`.
- **Pas de style inline dans le HTML.** Les styles dynamiques (tilt) sont appliqués
  via des variables CSS par `js/main.js`.
- **Images** : dimensions `width`/`height` obligatoires, `loading="lazy"` sauf pour
  le portrait du hero, formats WebP avec repli JPEG quand c'est pertinent.
- **Accessibilité** : navigation clavier, `aria-current`, focus visible, `skip-link`,
  `prefers-reduced-motion`, repli complet sans JavaScript.
- **JavaScript** : scripts chargés en `defer`, un IIFE par fichier, aucune variable
  globale.

## Vérifications locales

Servir le dossier avec un serveur statique (les liens relatifs et le formulaire
ne fonctionnent pas correctement en `file://`) :

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080/
```

Contrôles rapides :

```bash
node --check js/main.js
node --check js/contact.js
python3 -m json.tool vercel.json > /dev/null
```

## Déploiement Vercel

Le projet n'a besoin d'aucune commande de build : Vercel sert directement les
fichiers du dépôt. `vercel.json` ajoute les en-têtes de sécurité
(`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, HSTS) et redirige `/index.html` vers `/`.

Si le domaine change, mettre à jour :

- `canonical`, `og:url`, `twitter:*` dans `index.html`, `contact.html`
  et `confidentialite.html` ;
- `sitemap.xml` ;
- le champ `_next` du formulaire dans `contact.html`.

## Licence

Code source : usage personnel. Contenu et images : © Fiaro Andrianina Rakotonirina.
