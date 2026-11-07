/**
 * Editable texts and images of the public site ("Pages & visuels" in the admin console).
 *
 * Each block has a default — the original wording of the site — and the database only stores
 * the blocks the shop has changed. Resetting a block deletes its override.
 *
 * Kinds:
 *  - text      single line
 *  - textarea  plain multi-line text
 *  - rich      formatted text (see src/lib/rich-text.tsx): **gras**, *italique*, [lien](/url), {telephone}
 *  - lines     one item per line (bullet lists)
 *  - image     image URL (/img/… or /uploads/site/…)
 */

export type BlockKind = "text" | "textarea" | "rich" | "lines" | "image";

export interface BlockDef {
  page: PageId;
  section: string;
  kind: BlockKind;
  label: string;
  default: string;
  help?: string;
}

export const BLOCK_PAGES = {
  global: { label: "Tout le site", path: "/" },
  home: { label: "Accueil", path: "/" },
  equitation: { label: "Équitation", path: "/equitation" },
  amenagement: { label: "Clôtures & aménagement", path: "/amenagement" },
  nouveautes: { label: "Nouveautés", path: "/nouveautes" },
  devis: { label: "Demande de devis", path: "/devis" },
  contact: { label: "Le magasin (contact)", path: "/contact" },
  legal: { label: "Mentions légales", path: "/mentions-legales" },
  notFound: { label: "Page introuvable (404)", path: "/page-inexistante" },
} as const;

export type PageId = keyof typeof BLOCK_PAGES;

const block =
  (page: PageId, section: string) =>
  (kind: BlockKind, label: string, value: string, help?: string): BlockDef => ({
    page,
    section,
    kind,
    label,
    default: value,
    help,
  });

const SEO_HELP = "Titre affiché dans l'onglet du navigateur et dans les résultats Google.";
const DESC_HELP = "Résumé affiché sous le titre dans les résultats Google (150 caractères environ).";

const identity = block("global", "Identité");
const nav = block("global", "Menu");
const footer = block("global", "Pied de page");

const homeSplit = block("home", "Grandes photos d'entrée");
const homeIntro = block("home", "Présentation");
const homeSections = block("home", "Titres des sections");
const homeCta = block("home", "Encadré devis");
const homeSeo = block("home", "Référencement");

const equiHero = block("equitation", "En-tête");
const equiSections = block("equitation", "Titres des sections");
const equiSeo = block("equitation", "Référencement");

const amenHero = block("amenagement", "En-tête");
const amenSteps = block("amenagement", "Déroulé d'un projet");
const amenSections = block("amenagement", "Titres des sections");
const amenCta = block("amenagement", "Encadré de fin de page");
const amenSeo = block("amenagement", "Référencement");

const news = block("nouveautes", "Page");
const newsSeo = block("nouveautes", "Référencement");

const quote = block("devis", "Page");
const quoteSeo = block("devis", "Référencement");

const contact = block("contact", "Page");
const contactSeo = block("contact", "Référencement");

const legal = block("legal", "Contenu");
const legalSeo = block("legal", "Référencement");

const notFound = block("notFound", "Page");

export const BLOCKS = {
  // --- Tout le site ---------------------------------------------------------
  "global.logo": identity(
    "image",
    "Logo",
    "/img/logo-full.jpg",
    "Affiché dans l'en-tête, le pied de page et sur les devis.",
  ),
  "global.favicon": identity(
    "image",
    "Icône d'onglet (favicon)",
    "/img/favicon.jpg",
    "Image carrée, affichée dans l'onglet du navigateur.",
  ),
  "global.logoTitle": identity("text", "Nom à côté du logo", "Equ'Attitud"),
  "global.logoSubtitle": identity("text", "Sous-titre à côté du logo", "Sellerie · Quimper"),
  "global.headerCta": identity("text", "Bouton de l'en-tête", "Demander un devis"),

  "nav.home": nav("text", "Accueil", "Accueil"),
  "nav.equitation": nav("text", "Équitation", "Équitation"),
  "nav.amenagement": nav("text", "Aménagement", "Clôtures & aménagement"),
  "nav.news": nav("text", "Nouveautés", "Nouveautés"),
  "nav.contact": nav("text", "Le magasin", "Le magasin"),
  "nav.quote": nav("text", "Bouton devis", "Demander un devis"),

  "footer.tagline": footer("rich", "Présentation", "Sellerie, équipement équestre\net aménagement d'écurie à Quimper."),

  // --- Accueil --------------------------------------------------------------
  "home.equitation.image": homeSplit("image", "Photo gauche « Équitation »", "/img/selle-4.jpg"),
  "home.equitation.kicker": homeSplit("text", "Surtitre gauche", "Le magasin"),
  "home.equitation.title": homeSplit("text", "Titre gauche", "Sellerie & équipement équestre"),
  "home.equitation.text": homeSplit(
    "textarea",
    "Texte gauche",
    "Cavalier, cheval, soins, sellerie d'occasion et services d'atelier.",
  ),
  "home.equitation.link": homeSplit("text", "Lien gauche", "Voir l'équitation"),
  "home.amenagement.image": homeSplit("image", "Photo droite « Aménagement »", "/img/carriere.jpg"),
  "home.amenagement.kicker": homeSplit("text", "Surtitre droit", "Les installations"),
  "home.amenagement.title": homeSplit("text", "Titre droit", "Clôtures, box & aménagement"),
  "home.amenagement.text": homeSplit(
    "textarea",
    "Texte droit",
    "Prairies, paddocks, carrières, abris, sols stabilisés. Étude et devis gratuits.",
  ),
  "home.amenagement.link": homeSplit("text", "Lien droit", "Voir l'aménagement"),

  "home.intro.title": homeIntro("text", "Titre principal", "Sellerie Equ'Attitud, à Quimper"),
  "home.intro.text": homeIntro(
    "textarea",
    "Texte de présentation",
    "Installée à Quimper, la Sellerie Equ'Attitud équipe les cavaliers, les chevaux et les écuries du Finistère. En magasin, vous trouvez le matériel d'équitation au quotidien comme en compétition. Pour vos installations, nous étudions avec vous clôtures, box, abris et sols, et vous remettons un devis détaillé.",
  ),
  "home.intro.points": homeIntro(
    "lines",
    "Points forts (un par ligne)",
    "Ouvert du lundi au samedi\nConseil sur place\nDevis aménagement gratuit",
  ),

  "home.shop.title": homeSections("text", "Section rayons — titre", "Au magasin"),
  "home.shop.link": homeSections("text", "Section rayons — lien", "Tout l'univers équitation"),
  "home.fitting.title": homeSections("text", "Section aménagement — titre", "Aménagement d'écurie"),
  "home.fitting.link": homeSections("text", "Section aménagement — lien", "Toutes nos solutions"),
  "home.services.title": homeSections("text", "Section services — titre", "Services en magasin"),
  "home.news.title": homeSections("text", "Section nouveautés — titre", "Nouveautés"),
  "home.news.link": homeSections("text", "Section nouveautés — lien", "Toutes les nouveautés"),
  "home.reviews.title": homeSections("text", "Section avis — titre", "Ils nous font confiance"),
  "home.visit.title": homeSections("text", "Section accès — titre", "Nous rendre visite"),
  "home.visit.button": homeSections("text", "Section accès — bouton", "Contact et plan d'accès"),

  "home.cta.title": homeCta("text", "Titre", "Un projet de clôture, de box ou de carrière ?"),
  "home.cta.text": homeCta(
    "textarea",
    "Texte",
    "Décrivez-nous votre terrain et vos besoins : nous revenons vers vous avec une proposition chiffrée.",
  ),
  "home.cta.button": homeCta("text", "Bouton", "Demander un devis"),

  "seo.home.title": homeSeo(
    "text",
    "Titre de la page",
    "Sellerie Equ'Attitud · Sellerie, clôtures et aménagement équestre à Quimper",
    SEO_HELP,
  ),
  "seo.home.description": homeSeo(
    "textarea",
    "Description",
    "Sellerie Equ'Attitud à Quimper : équipement du cavalier et du cheval, soins, selles d'occasion, et aménagement d'écurie (clôtures, barrières, box, abris, sols). Devis gratuit.",
    DESC_HELP,
  ),

  // --- Équitation -----------------------------------------------------------
  "equitation.hero.image": equiHero("image", "Photo d'en-tête", "/img/boutique-rayon.jpg"),
  "equitation.hero.title": equiHero("text", "Titre", "Sellerie & équipement équestre"),
  "equitation.intro": equiHero(
    "textarea",
    "Texte d'introduction",
    "Vêtements, sécurité, sellerie, soins et alimentation : notre magasin réunit l'essentiel pour le cavalier et son cheval. Les produits s'essaient sur place, et nous prenons le temps de vous conseiller sur les tailles et les modèles.",
  ),
  "equitation.aside": equiHero(
    "rich",
    "Encadré à droite",
    "**Les produits se voient et s'essaient en magasin.** Pour une taille, un modèle ou une disponibilité, appelez-nous au {telephone}.",
  ),
  "equitation.departments.title": equiSections("text", "Rayons — titre", "Nos rayons"),
  "equitation.used.title": equiSections("text", "Occasions — titre", "Occasions"),
  "equitation.used.subtitle": equiSections(
    "text",
    "Occasions — sous-titre",
    "Selles et matériel d'occasion, à voir et essayer en magasin.",
  ),
  "equitation.brands.title": equiSections("text", "Marques — titre", "Les marques en magasin"),
  "equitation.services.title": equiSections("text", "Services — titre", "Services en magasin"),
  "equitation.gallery.title": equiSections("text", "Galerie — titre", "En magasin"),
  "equitation.gallery.link": equiSections("text", "Galerie — lien", "Les nouveautés équitation"),

  "seo.equitation.title": equiSeo("text", "Titre de la page", "Équitation · Sellerie Equ'Attitud, Quimper", SEO_HELP),
  "seo.equitation.description": equiSeo(
    "textarea",
    "Description",
    "Vêtements du cavalier, casques et airbags, tapis, couvertures, soins, selles d'occasion, location de tondeuse, lavage et affûtage à Quimper.",
    DESC_HELP,
  ),

  // --- Clôtures & aménagement ---------------------------------------------
  "amenagement.hero.image": amenHero("image", "Photo d'en-tête", "/img/barriere-carriere.jpg"),
  "amenagement.hero.title": amenHero("text", "Titre", "Clôtures, box & aménagement d'écurie"),
  "amenagement.hero.button": amenHero("text", "Bouton de l'en-tête", "Demander un devis gratuit"),
  "amenagement.intro": amenHero(
    "textarea",
    "Texte d'introduction",
    "Clôtures de prairie, barrières, box, abris, sols stabilisés : nous vous accompagnons dans l'aménagement de vos installations, du particulier qui accueille ses chevaux à la maison jusqu'aux écuries professionnelles.",
  ),
  "amenagement.aside": amenHero(
    "rich",
    "Encadré à droite",
    "**Devis gratuit et sans engagement.** Remplissez le formulaire en ligne en quelques minutes, ou passez en parler en magasin.",
  ),
  "amenagement.aside.button": amenHero("text", "Bouton de l'encadré", "Demander un devis"),
  "amenagement.offers.link": amenSections("text", "Lien sous chaque offre", "Demander un devis"),

  "amenagement.steps.title": amenSteps("text", "Titre", "Comment se passe votre projet"),
  "amenagement.step1.title": amenSteps("text", "Étape 1 — titre", "Votre demande"),
  "amenagement.step1.text": amenSteps(
    "textarea",
    "Étape 1 — texte",
    "Vous décrivez votre projet en ligne ou en magasin : type d'installation, dimensions, terrain, photos.",
  ),
  "amenagement.step2.title": amenSteps("text", "Étape 2 — titre", "L'étude"),
  "amenagement.step2.text": amenSteps(
    "textarea",
    "Étape 2 — texte",
    "Nous analysons vos besoins et vous rappelons pour préciser les détails. Une visite peut être organisée si nécessaire.",
  ),
  "amenagement.step3.title": amenSteps("text", "Étape 3 — titre", "Le devis"),
  "amenagement.step3.text": amenSteps(
    "textarea",
    "Étape 3 — texte",
    "Vous recevez une proposition détaillée et chiffrée, poste par poste.",
  ),
  "amenagement.step4.title": amenSteps("text", "Étape 4 — titre", "La réalisation"),
  "amenagement.step4.text": amenSteps(
    "textarea",
    "Étape 4 — texte",
    "Une fois le devis validé, nous organisons la suite avec vous : commande, mise à disposition du matériel et planning.",
  ),

  "amenagement.gallery.title": amenSections("text", "Galerie — titre", "Réalisations"),
  "amenagement.gallery.link": amenSections("text", "Galerie — lien", "Les nouveautés aménagement"),

  "amenagement.cta.title": amenCta("text", "Titre", "Parlons de votre projet"),
  "amenagement.cta.text": amenCta(
    "textarea",
    "Texte",
    "Clôture de prairie, carrière, box, abri, sol stabilisé : obtenez une proposition adaptée à votre terrain.",
  ),
  "amenagement.cta.button": amenCta("text", "Bouton", "Demander un devis"),

  "seo.amenagement.title": amenSeo(
    "text",
    "Titre de la page",
    "Clôtures, box et aménagement d'écurie · Equ'Attitud, Quimper",
    SEO_HELP,
  ),
  "seo.amenagement.description": amenSeo(
    "textarea",
    "Description",
    "Clôtures de prairie, barrières et portails, box, abris, dalles alvéolées et stabilisateurs de sol, carrières et paddocks dans le Finistère. Devis gratuit.",
    DESC_HELP,
  ),

  // --- Nouveautés ---------------------------------------------------------
  "nouveautes.title": news("text", "Titre", "Nouveautés"),
  "nouveautes.empty": news("text", "Message quand il n'y a rien", "Aucune nouveauté pour le moment."),
  "seo.nouveautes.title": newsSeo("text", "Titre de la page", "Nouveautés · Sellerie Equ'Attitud, Quimper", SEO_HELP),
  "seo.nouveautes.description": newsSeo(
    "textarea",
    "Description",
    "Les nouveautés et arrivages de la Sellerie Equ'Attitud : équipement équestre, clôtures et aménagement d'écurie.",
    DESC_HELP,
  ),

  // --- Demande de devis -----------------------------------------------------
  "devis.title": quote("text", "Titre", "Demande de devis"),
  "devis.intro": quote(
    "textarea",
    "Introduction",
    "Clôtures, portails, box, abris, sols, carrières : plus votre description est précise, plus notre proposition sera juste. Comptez environ 5 minutes. Les champs marqués * sont obligatoires.",
  ),
  "devis.aside.title": quote("text", "Encadré d'aide — titre", "Besoin d'aide ?"),
  "devis.aside.text": quote(
    "textarea",
    "Encadré d'aide — texte",
    "Vous pouvez aussi venir en parler au magasin, avec vos photos ou un plan du terrain.",
  ),
  "devis.done.title": quote("text", "Confirmation — titre", "Merci, votre demande a bien été envoyée"),
  "devis.done.text": quote(
    "rich",
    "Confirmation — texte",
    "Nous étudions votre projet et revenons vers vous rapidement. Pour toute question, appelez-nous au {telephone}.",
  ),
  "seo.devis.title": quoteSeo(
    "text",
    "Titre de la page",
    "Demande de devis · Clôtures, box, aménagement · Equ'Attitud",
    SEO_HELP,
  ),
  "seo.devis.description": quoteSeo(
    "textarea",
    "Description",
    "Demandez votre devis gratuit pour vos clôtures, portails, box, abris, sols stabilisés, carrières et paddocks. Sellerie Equ'Attitud, Quimper.",
    DESC_HELP,
  ),

  // --- Le magasin -----------------------------------------------------------
  "contact.title": contact("text", "Titre", "Le magasin"),
  "contact.details.title": contact("text", "Coordonnées — titre", "Coordonnées"),
  "contact.hours.title": contact("text", "Horaires — titre", "Horaires"),
  "contact.hours.note": contact(
    "text",
    "Horaires — remarque",
    "Fermetures exceptionnelles et jours fériés annoncés sur notre page Facebook.",
  ),
  "contact.form.title": contact("text", "Formulaire — titre", "Nous écrire"),
  "contact.form.text": contact(
    "rich",
    "Formulaire — texte",
    "Une question sur un produit, une disponibilité, un service ? Laissez-nous un message, nous vous répondons rapidement.\n\nPour un projet de clôture, de box ou d'aménagement, utilisez plutôt notre [formulaire de demande de devis](/devis) : il nous permet de vous répondre plus précisément.",
  ),
  "contact.form.success": contact(
    "text",
    "Message après envoi",
    "Merci, votre message a bien été envoyé. Nous vous répondons rapidement.",
  ),
  "seo.contact.title": contactSeo(
    "text",
    "Titre de la page",
    "Contact et accès · Sellerie Equ'Attitud, Quimper",
    SEO_HELP,
  ),
  "seo.contact.description": contactSeo(
    "textarea",
    "Description",
    "Adresse, horaires et plan d'accès de la Sellerie Equ'Attitud, 7 allée du Dr Picquenard à Quimper. Téléphone 02 98 53 01 77.",
    DESC_HELP,
  ),

  // --- Mentions légales -----------------------------------------------------
  "legal.publisher": legal(
    "rich",
    "Éditeur du site",
    "Sellerie Equ'Attitud\n7 allée du Dr Picquenard, 29000 Quimper\nTéléphone : 02 98 53 01 77 · E-mail : contact@sellerie-equattitud.fr\n\nEQU'ATTITUD, société à responsabilité limitée (SARL)\nSiège : ZI de Kerhuel, 7 allée du Docteur Picquenard, 29000 Quimper\nSIREN 493 729 917 · SIRET 493 729 917 00010 · Code NAF 47.64Z\nCapital social, RCS et TVA intracommunautaire : *[à compléter]*\nDirecteur de la publication : *[à compléter]*",
    "Raison sociale, siège, SIREN/SIRET, capital, RCS, TVA et directeur de la publication.",
  ),
  "legal.hosting": legal("rich", "Hébergement", "*[Nom, adresse et téléphone de l'hébergeur à compléter]*"),
  "legal.privacy": legal(
    "rich",
    "Données personnelles",
    "Les informations transmises via les formulaires de contact et de demande de devis sont utilisées uniquement pour répondre à votre demande. Elles ne sont ni cédées ni vendues. Elles sont conservées le temps nécessaire au traitement de la demande et au suivi commercial, puis supprimées.\n\nConformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour l'exercer, écrivez à contact@sellerie-equattitud.fr.",
  ),
  "legal.cookies": legal(
    "rich",
    "Cookies",
    "Ce site n'utilise pas de cookie publicitaire ni de mesure d'audience. La carte d'accès est fournie par Google Maps, soumis à ses propres conditions.",
  ),
  "seo.legal.title": legalSeo("text", "Titre de la page", "Mentions légales · Sellerie Equ'Attitud", SEO_HELP),
  "seo.legal.description": legalSeo(
    "textarea",
    "Description",
    "Mentions légales du site de la Sellerie Equ'Attitud.",
    DESC_HELP,
  ),

  // --- 404 ------------------------------------------------------------------
  "notFound.title": notFound("text", "Titre", "Page introuvable"),
  "notFound.text": notFound("text", "Texte", "La page demandée n'existe pas ou a été déplacée."),
  "notFound.button": notFound("text", "Bouton", "Retour à l'accueil"),
} satisfies Record<string, BlockDef>;

export type BlockKey = keyof typeof BLOCKS;
export const BLOCK_KEYS = Object.keys(BLOCKS) as BlockKey[];
export const isBlockKey = (key: string): key is BlockKey => Object.hasOwn(BLOCKS, key);

export type Texts = Record<BlockKey, string>;

/** Merges stored overrides over the defaults. Unknown keys are ignored. */
export function resolveTexts(overrides: Record<string, string>): Texts {
  const out = {} as Texts;
  for (const key of BLOCK_KEYS) out[key] = overrides[key] ?? BLOCKS[key].default;
  return out;
}

/** Blocks of one page, grouped by section in declaration order. */
export function blocksBySection(page: PageId): { section: string; keys: BlockKey[] }[] {
  const groups: { section: string; keys: BlockKey[] }[] = [];
  for (const key of BLOCK_KEYS) {
    const def = BLOCKS[key];
    if (def.page !== page) continue;
    let group = groups.find((g) => g.section === def.section);
    if (!group) groups.push((group = { section: def.section, keys: [] }));
    group.keys.push(key);
  }
  return groups;
}

/** Legacy `content.pages` keys (Express version) → block keys. */
export const LEGACY_PAGE_KEYS: Record<string, BlockKey> = {
  homeEquitationImg: "home.equitation.image",
  homeAmenagementImg: "home.amenagement.image",
  intro: "home.intro.text",
  equitationHero: "equitation.hero.image",
  equitationIntro: "equitation.intro",
  amenagementHero: "amenagement.hero.image",
  amenagementIntro: "amenagement.intro",
};
