# Portfolio — Fiaro Andrianina

Site statique personnel, sans framework ni dépendance. HTML, CSS et JavaScript natif.
Déploiement : [Vercel](https://vercel.com) — URL de production : <https://fiaro-andrianina.vercel.app/>

## Structure

```
.
├── index.html            # Page d'accueil (toutes les sections)
├── contact.html          # Page de contact (formulaire + coordonnées)
├── robots.txt
├── sitemap.xml
├── css/
│   ├── main.css          # Point d'entrée : uniquement des @import
│   ├── variables.css     # Charte graphique (couleurs, largeurs, ombres)
│   ├── base.css          # Reset + styles globaux + utilitaires
│   └── components/       # Une feuille par section
│       ├── nav.css
│       ├── hero.css
│       ├── about.css
│       ├── education.css
│       ├── projects.css
│       ├── skills.css
│       ├── experience.css
│       ├── contact.css
│       └── form.css
├── js/
│   ├── main.js           # Menu mobile, barres de compétences, reveal, tilt
│   └── contact.js        # Validation + envoi du formulaire
└── images/
    ├── favicon.svg
    ├── og-image.jpg      # Image de partage réseaux sociaux (1200×630)
    ├── hero-*.webp|jpg   # Portrait du hero
    ├── *.webp|jpg        # Visuels de projets
    └── CV_Fiaro_Andrianina.pdf
```

## Formulaire de contact

Le formulaire de `contact.html` envoie les messages vers **rktfify@gmail.com** via [Web3Forms](https://web3forms.com/), sans backend : le navigateur poste directement sur `https://api.web3forms.com/submit`.

### Mise en service (à faire une seule fois)

1. Aller sur <https://web3forms.com/> et saisir `rktfify@gmail.com`.
2. Récupérer la **clé d'accès** reçue par email.
3. Remplacer `VOTRE_CLE_WEB3FORMS` dans `js/contact.js` :

```js
const CONTACT_CONFIG = {
  accessKey: 'VOTRE_CLE_WEB3FORMS', // <-- coller la clé ici
  recipientEmail: 'rktfify@gmail.com',
  ...
};
```

Tant que ce n'est pas fait, le formulaire affiche un message d'erreur et oriente vers l'e-mail direct — il ne casse pas la page.

### Sécurité

La clé Web3Forms **n'est pas un secret** : c'est un identifiant public lié au site, qui autorise l'envoi vers la seule adresse enregistrée. Elle peut rester dans le code client.

En revanche, ne jamais placer dans ce dépôt un mot de passe SMTP, une clé Resend/SendGrid ou toute autre credential : le code côté navigateur est lisible par tous les visiteurs.

### Protection anti-spam

Le formulaire est en accès public, sans quoi l'adresse servirait de relais de spam. Les barrières se cumulent :

| Barrière | Où |
|---|---|
| hCaptcha | Widget tiers rendu par `web3forms.com/client/script.js` |
| Piège à robots (`botcheck`) | Masqué en CSS, envoyé dans la charge utile |
| Rejet des envois sous 3 s | `js/contact.js` → `isTooFast()` |
| Délai de 25 s entre deux envois | `js/contact.js` → `isInCooldown()` (localStorage) |
| Filtrage serveur | Web3Forms rejette les charges `botcheck` non vides |

### hCaptcha — à activer dans le dashboard

Le widget est déjà présent dans `contact.html`, mais il **ne protège rien tant qu'il n'est pas activé** côté Web3Forms :

1. <https://app.web3forms.com> → ouvrir le formulaire
2. Régler hCaptcha comme méthode de blocage du spam
3. Enregistrer

Aucun compte hCaptcha ni clé à créer : Web3Forms proxifie le service. La seule clé possible est celle de l'offre gratuite (`50b2fe65-b00b-4b9e-ad62-3ba471098be2`), inutilisée ici.

**Le captcha est appliqué avec souplesse.** `js/contact.js` n'exige le widget que s'il est réellement présent dans la page. Si `hcaptcha.com` est bloqué (extension navigateur, pare-feu, coupure réseau), l'envoi n'est pas bloqué : perdre un vrai contact pour un captcha injoignable serait pire que de laisser passer un spam. Les quatre autres barrières restent actives dans tous les cas.

Le token hCaptcha est à usage unique : `resetCaptcha()` le réinitialise après chaque envoi réussi, sinon le deuxième message depuis le même navigateur échouerait.

### Pour un usage intensif

Activer hCaptcha dans le dashboard Web3Forms est la priorité. Ensuite seulement, si le spam persiste, envisager la fonctionnalité **Restrict to Domain** (offre Pro) qui limite les envois à `fiaro-andrianina.vercel.app`.

## Conventions

- **Aucune dépendance.** Ne pas introduire de framework ou de build step sans raison : le site doit rester déployable tel quel sur Vercel.
- **CSS** : toutes les couleurs et largeurs passent par `variables.css`. Pas de valeur codée en dur dans les composants.
- **Pas de `style="..."` dans le HTML.** Toute mise en forme passe par une classe.
- **Images** : format WebP avec repli JPEG, dimensions (`width`/`height`) obligatoires pour éviter le décalage de mise en page, `loading="lazy"` sauf pour le hero.
- **JS** : un seul IIFE dans `js/main.js`, sans dépendance globale. Toute animation non essentials doit respecter `prefers-reduced-motion` et rester facultative (le site doit rester lisible sans JavaScript).

## Images manquantes

Les visuels `images/project-infra.svg` et `images/project-garage.svg` sont des **placeholders** générés pour les projets 02 et 04. Les remplacer par de vraies captures d'écran.

Pour compresser une nouvelle image :

```bash
magick source.png -resize 800x -quality 82 -strip image-800.webp
magick source.png -background white -alpha remove -alpha off \
  -resize 800x -interlace Plane -quality 86 -strip image.jpg
```

## Après un déploiement

Si l'URL change, mettre à jour : `canonical`, `og:url`, `twitter:*`, `robots.txt`, `sitemap.xml`. Penser aussi à la page `contact.html`.

## Licence

Code source : usage personnel. Contenu et images : © Fiaro Andrianina Rakotonirina.