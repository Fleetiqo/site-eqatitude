/**
 * Single source of truth for the quote request ("demande de devis").
 *
 * The public 5-step form, its recap, server-side validation, the admin quote sheet and the
 * legacy JSON import all read these definitions, so a field is added or renamed in one place.
 * `legacy` is the key used by the previous Express version (data/quotes.json).
 */

export type FieldValue = string | string[];
export type FieldGroup = Record<string, FieldValue>;

export interface FieldOption {
  value: string;
  label: string;
}

interface BaseField {
  name: string;
  legacy: string;
  label: string;
  /** Shorter label for the admin quote sheet. Defaults to `label`. */
  adminLabel?: string;
  required?: boolean;
  /** Spans both columns of the field grid. */
  wide?: boolean;
}

export interface InputField extends BaseField {
  kind: "text" | "number" | "email" | "tel";
  placeholder?: string;
  min?: number;
  step?: number;
  inputMode?: "numeric" | "decimal";
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
}

export interface SelectField extends BaseField {
  kind: "select";
  options: FieldOption[];
}

export interface CheckboxesField extends BaseField {
  kind: "checkboxes";
  options: string[];
}

export interface TextareaField extends BaseField {
  kind: "textarea";
  rows: number;
  placeholder?: string;
}

export type FieldDef = InputField | SelectField | CheckboxesField | TextareaField;

/** `opt("—")` → empty value with a label; plain strings use the label as value. */
const empty = (label: string): FieldOption => ({ value: "", label });
const opts = (...labels: string[]): FieldOption[] => labels.map((l) => ({ value: l, label: l }));

// ---------------------------------------------------------------------------
// Project types
// ---------------------------------------------------------------------------

export interface ProjectTypeDef {
  id: string;
  label: string;
  /** Label used in admin tables and statistics. */
  shortLabel: string;
  hint: string;
  fields: FieldDef[];
  /** Fields are laid out in the two-column grid (false for a single textarea). */
  grid: boolean;
}

export const PROJECT_TYPES: ProjectTypeDef[] = [
  {
    id: "cloture",
    label: "Clôture",
    shortLabel: "Clôture",
    hint: "Prairie, paddock, lisses, électrique",
    grid: true,
    fields: [
      {
        kind: "select",
        name: "fenceType",
        legacy: "type",
        label: "Type de clôture",
        adminLabel: "Type",
        options: [
          empty("Je ne sais pas encore"),
          ...opts(
            "Lisses bois",
            "Lisses PVC",
            "Lisses acier galvanisé",
            "Électrique ruban",
            "Électrique fil / cordelette",
            "Grillage (type ursus / mailles nouées)",
            "Mixte (lisses + électrique)",
          ),
        ],
      },
      {
        kind: "number",
        name: "length",
        legacy: "longueur",
        label: "Longueur totale (mètres)",
        adminLabel: "Longueur (m)",
        min: 0,
        inputMode: "decimal",
      },
      {
        kind: "number",
        name: "height",
        legacy: "hauteur",
        label: "Hauteur souhaitée (m)",
        adminLabel: "Hauteur (m)",
        min: 0,
        step: 0.1,
        inputMode: "decimal",
        placeholder: "ex. 1,40",
      },
      {
        kind: "select",
        name: "rails",
        legacy: "rangs",
        label: "Nombre de lisses / rangs",
        adminLabel: "Lisses / rangs",
        options: [empty("—"), ...opts("1", "2", "3", "4 ou plus")],
      },
      {
        kind: "select",
        name: "posts",
        legacy: "poteaux",
        label: "Poteaux",
        options: [
          empty("Je ne sais pas"),
          ...opts("Bois (pin traité)", "Bois (acacia / robinier)", "Métal", "Poteaux existants à conserver"),
        ],
      },
      {
        kind: "number",
        name: "postSpacing",
        legacy: "espacement",
        label: "Espacement des poteaux (m)",
        adminLabel: "Espacement poteaux (m)",
        min: 0,
        step: 0.1,
        inputMode: "decimal",
      },
      {
        kind: "select",
        name: "energizer",
        legacy: "electrificateur",
        label: "Électrificateur",
        options: [
          empty("Non concerné"),
          ...opts("À prévoir — secteur 230 V", "À prévoir — batterie", "À prévoir — solaire", "J'en ai déjà un"),
        ],
      },
      {
        kind: "number",
        name: "gaps",
        legacy: "passages",
        label: "Nombre d'accès / passages à prévoir",
        adminLabel: "Accès / passages",
        min: 0,
        inputMode: "numeric",
      },
      {
        kind: "select",
        name: "removal",
        legacy: "depose",
        label: "Ancienne clôture à retirer ?",
        adminLabel: "Dépose ancienne clôture",
        options: [empty("—"), ...opts("Non", "Oui")],
      },
    ],
  },
  {
    id: "portail",
    label: "Portail / barrière",
    shortLabel: "Portail / barrière",
    hint: "Barrières de prairie, portails, passages",
    grid: true,
    fields: [
      { kind: "number", name: "count", legacy: "nombre", label: "Nombre", min: 1, inputMode: "numeric" },
      {
        kind: "number",
        name: "width",
        legacy: "largeur",
        label: "Largeur de passage (m)",
        adminLabel: "Largeur (m)",
        min: 0,
        step: 0.1,
        inputMode: "decimal",
        placeholder: "ex. 3,60",
      },
      {
        kind: "select",
        name: "gateType",
        legacy: "type",
        label: "Type",
        options: [
          empty("—"),
          ...opts("Barrière de prairie galvanisée", "Barrière de carrière", "Portail bois", "Passage d'homme"),
        ],
      },
      {
        kind: "select",
        name: "opening",
        legacy: "ouverture",
        label: "Ouverture",
        options: [empty("—"), ...opts("Un vantail", "Deux vantaux", "Coulissant")],
      },
      {
        kind: "select",
        name: "usage",
        legacy: "usage",
        label: "Usage",
        options: [empty("—"), ...opts("Passage des chevaux", "Passage d'engins / tracteur", "Les deux")],
      },
    ],
  },
  {
    id: "box",
    label: "Box / écurie",
    shortLabel: "Box / écurie",
    hint: "Box intérieurs, extérieurs, façades",
    grid: true,
    fields: [
      {
        kind: "number",
        name: "count",
        legacy: "nombre",
        label: "Nombre de box",
        adminLabel: "Nombre",
        min: 1,
        inputMode: "numeric",
      },
      {
        kind: "select",
        name: "dimensions",
        legacy: "dimensions",
        label: "Dimensions par box",
        adminLabel: "Dimensions",
        options: [
          empty("—"),
          ...opts("3 × 3 m", "3 × 3,5 m", "3,5 × 3,5 m", "3,5 × 4 m", "4 × 4 m", "Autre (préciser)"),
        ],
      },
      {
        kind: "select",
        name: "placement",
        legacy: "implantation",
        label: "Implantation",
        options: [empty("—"), ...opts("Dans un bâtiment existant", "Box extérieurs", "Écurie complète à créer")],
      },
      {
        kind: "select",
        name: "need",
        legacy: "besoin",
        label: "Ce que vous recherchez",
        adminLabel: "Besoin",
        options: [
          empty("—"),
          ...opts("Façades seules", "Box complets (façades + séparations)", "Kit / structure complète"),
        ],
      },
      {
        kind: "select",
        name: "material",
        legacy: "materiau",
        label: "Matériau",
        options: [empty("Pas de préférence"), ...opts("Bois", "Métal galvanisé + bois", "Métal + PVC")],
      },
      {
        kind: "select",
        name: "door",
        legacy: "porte",
        label: "Porte",
        options: [empty("—"), ...opts("Coulissante", "Battante", "Porte à double vantail (haut/bas)")],
      },
      {
        kind: "checkboxes",
        name: "equipment",
        legacy: "options",
        label: "Équipements",
        adminLabel: "Options / équipements",
        wide: true,
        options: ["Mangeoire", "Râtelier", "Abreuvoir automatique", "Grille anti-morsure", "Fenêtre", "Tapis de sol"],
      },
    ],
  },
  {
    id: "abri",
    label: "Abri de prairie",
    shortLabel: "Abri",
    hint: "Fixe ou mobile",
    grid: true,
    fields: [
      {
        kind: "text",
        name: "dimensions",
        legacy: "dimensions",
        label: "Dimensions souhaitées",
        adminLabel: "Dimensions",
        placeholder: "ex. 6 × 3,6 m",
      },
      {
        kind: "number",
        name: "count",
        legacy: "nombre",
        label: "Nombre d'abris",
        adminLabel: "Nombre",
        min: 1,
        inputMode: "numeric",
      },
      {
        kind: "select",
        name: "shelterType",
        legacy: "type",
        label: "Type",
        options: [empty("—"), ...opts("Fixe", "Mobile sur patins", "Je ne sais pas")],
      },
      {
        kind: "select",
        name: "structure",
        legacy: "structure",
        label: "Structure",
        options: [empty("Pas de préférence"), ...opts("Bois", "Métal")],
      },
      {
        kind: "select",
        name: "extras",
        legacy: "options",
        label: "Options",
        adminLabel: "Options / équipements",
        options: [
          empty("—"),
          ...opts("Avec avancée de toit", "Avec partie fermée / sellerie", "Avec stockage fourrage"),
        ],
      },
    ],
  },
  {
    id: "sol",
    label: "Sol & stabilisation",
    shortLabel: "Sol",
    hint: "Dalles alvéolées, stabilisateurs drainants",
    grid: true,
    fields: [
      {
        kind: "number",
        name: "area",
        legacy: "surface",
        label: "Surface à traiter (m²)",
        adminLabel: "Surface",
        min: 0,
        inputMode: "decimal",
      },
      {
        kind: "select",
        name: "product",
        legacy: "produit",
        label: "Produit",
        options: [empty("Conseillez-moi"), ...opts("Dalles alvéolées", "Stabilisateurs drainants")],
      },
      {
        kind: "checkboxes",
        name: "zones",
        legacy: "zones",
        label: "Zones concernées",
        adminLabel: "Zones",
        wide: true,
        options: ["Box", "Abri de pré", "Paddock", "Abords d'écurie", "Chemin / accès", "Point d'eau / mangeoire"],
      },
      {
        kind: "select",
        name: "groundState",
        legacy: "etat",
        label: "État actuel du sol",
        adminLabel: "État du sol",
        options: [empty("—"), ...opts("Boueux en hiver", "Terre / herbe", "Empierré", "Sable")],
      },
    ],
  },
  {
    id: "carriere",
    label: "Carrière / paddock",
    shortLabel: "Carrière / paddock",
    hint: "Création ou rénovation",
    grid: true,
    fields: [
      {
        kind: "select",
        name: "project",
        legacy: "projet",
        label: "Projet",
        options: [empty("—"), ...opts("Création", "Rénovation", "Clôture seule")],
      },
      {
        kind: "text",
        name: "dimensions",
        legacy: "dimensions",
        label: "Dimensions (m)",
        adminLabel: "Dimensions",
        placeholder: "ex. 20 × 40",
      },
      {
        kind: "select",
        name: "usage",
        legacy: "usage",
        label: "Usage",
        options: [
          empty("—"),
          ...opts("Paddock / détente", "Travail sur le plat", "Obstacle", "Dressage", "Polyvalent"),
        ],
      },
      {
        kind: "select",
        name: "rails",
        legacy: "lisses",
        label: "Type de lisses",
        adminLabel: "Lisses",
        options: [empty("—"), ...opts("Bois", "PVC", "Acier galvanisé")],
      },
      {
        kind: "checkboxes",
        name: "needs",
        legacy: "besoins",
        label: "Besoins",
        wide: true,
        options: ["Terrassement", "Drainage", "Sable / revêtement", "Clôture / lisses", "Portail d'accès"],
      },
    ],
  },
  {
    id: "autre",
    label: "Autre",
    shortLabel: "Autre",
    hint: "Abreuvoirs, équipement d'écurie…",
    grid: false,
    fields: [
      {
        kind: "textarea",
        name: "description",
        legacy: "description",
        label: "Décrivez votre besoin",
        adminLabel: "Description",
        rows: 3,
      },
    ],
  },
];

export const PROJECT_TYPE_IDS = PROJECT_TYPES.map((t) => t.id);
export const projectType = (id: string): ProjectTypeDef | undefined => PROJECT_TYPES.find((t) => t.id === id);
export const projectTypeLabel = (id: string): string => projectType(id)?.label ?? id;
export const projectTypeShortLabel = (id: string): string => projectType(id)?.shortLabel ?? id;

// ---------------------------------------------------------------------------
// Step 1 — about the requester
// ---------------------------------------------------------------------------

export const PROFILE_FIELD: SelectField = {
  kind: "select",
  name: "profile",
  legacy: "profil",
  label: "Vous êtes",
  adminLabel: "Profil",
  required: true,
  options: [
    empty("Choisir…"),
    ...opts(
      "Particulier",
      "Écurie / pension",
      "Centre équestre",
      "Élevage",
      "Exploitation agricole",
      "Collectivité / association",
      "Professionnel (autre)",
    ),
  ],
};

export const ANIMAL_COUNT_FIELD: InputField = {
  kind: "number",
  name: "animalCount",
  legacy: "nbAnimaux",
  label: "Nombre d'animaux concernés",
  adminLabel: "Nombre d'animaux",
  min: 0,
  inputMode: "numeric",
};

export const ANIMALS_FIELD: CheckboxesField = {
  kind: "checkboxes",
  name: "animals",
  legacy: "animaux",
  label: "Animaux",
  options: ["Chevaux", "Poneys", "Ânes", "Étalons", "Bovins / ovins"],
};

export const NOTES_FIELD: TextareaField = {
  kind: "textarea",
  name: "notes",
  legacy: "precisions",
  label: "Précisions sur votre projet",
  rows: 4,
  placeholder: "Contraintes particulières, matériel déjà en place, idées…",
};

// ---------------------------------------------------------------------------
// Step 3 — the site
// ---------------------------------------------------------------------------

export const SITE_FIELDS: FieldDef[] = [
  {
    kind: "text",
    name: "city",
    legacy: "commune",
    label: "Commune du projet",
    adminLabel: "Commune",
    required: true,
    autoComplete: "address-level2",
  },
  {
    kind: "text",
    name: "postalCode",
    legacy: "codePostal",
    label: "Code postal",
    required: true,
    inputMode: "numeric",
    pattern: "[0-9]{5}",
    maxLength: 5,
    autoComplete: "postal-code",
  },
  {
    kind: "text",
    name: "address",
    legacy: "adresse",
    label: "Adresse du terrain (si différente de la vôtre)",
    adminLabel: "Adresse du terrain",
    wide: true,
    autoComplete: "street-address",
  },
  {
    kind: "text",
    name: "area",
    legacy: "surface",
    label: "Surface du terrain (ha ou m²)",
    adminLabel: "Surface",
    placeholder: "ex. 1,5 ha",
  },
  {
    kind: "select",
    name: "terrain",
    legacy: "terrain",
    label: "Nature du terrain",
    options: [
      empty("—"),
      ...opts("Plat", "En pente légère", "En forte pente", "Accidenté / rocailleux", "Humide / zone inondable"),
    ],
  },
  {
    kind: "select",
    name: "access",
    legacy: "acces",
    label: "Accès pour engins / camion",
    adminLabel: "Accès engins",
    options: [empty("—"), ...opts("Facile", "Possible mais étroit", "Difficile", "Je ne sais pas")],
  },
  {
    kind: "select",
    name: "service",
    legacy: "prestation",
    label: "Prestation souhaitée",
    adminLabel: "Prestation",
    required: true,
    options: [empty("Choisir…"), ...opts("Fourniture du matériel seule", "Fourniture et pose", "À définir ensemble")],
  },
  {
    kind: "select",
    name: "timeline",
    legacy: "delai",
    label: "Délai souhaité",
    adminLabel: "Délai",
    options: [
      empty("—"),
      ...opts(
        "Urgent (moins de 2 semaines)",
        "Dans le mois",
        "Dans 1 à 3 mois",
        "Dans plus de 3 mois",
        "Pas de délai précis",
      ),
    ],
  },
  {
    kind: "select",
    name: "budget",
    legacy: "budget",
    label: "Budget indicatif",
    adminLabel: "Budget",
    options: [
      empty("Je préfère ne pas indiquer"),
      ...opts("Moins de 1 000 €", "1 000 à 3 000 €", "3 000 à 8 000 €", "8 000 à 15 000 €", "Plus de 15 000 €"),
    ],
  },
  {
    kind: "select",
    name: "visit",
    legacy: "visite",
    label: "Visite sur place",
    options: [empty("—"), ...opts("Oui, je souhaite une visite", "Non, pas nécessaire")],
  },
];

// ---------------------------------------------------------------------------
// Step 4 — contact details
// ---------------------------------------------------------------------------

export const CONTACT_FIELDS: FieldDef[] = [
  { kind: "text", name: "lastName", legacy: "nom", label: "Nom", required: true, autoComplete: "family-name" },
  { kind: "text", name: "firstName", legacy: "prenom", label: "Prénom", autoComplete: "given-name" },
  {
    kind: "text",
    name: "organization",
    legacy: "structure",
    label: "Structure (écurie, élevage, société…)",
    adminLabel: "Structure",
    wide: true,
    autoComplete: "organization",
  },
  { kind: "tel", name: "phone", legacy: "telephone", label: "Téléphone", required: true, autoComplete: "tel" },
  { kind: "email", name: "email", legacy: "email", label: "E-mail", required: true, autoComplete: "email" },
  {
    kind: "select",
    name: "preference",
    legacy: "preference",
    label: "Être recontacté de préférence",
    adminLabel: "Contact préféré",
    options: opts("Par téléphone", "Par e-mail", "Peu importe"),
  },
  {
    kind: "select",
    name: "slot",
    legacy: "creneau",
    label: "Créneau préféré",
    adminLabel: "Créneau",
    options: [empty("Indifférent"), ...opts("Matin", "Midi", "Après-midi", "Fin de journée")],
  },
];

// ---------------------------------------------------------------------------
// Stored shape
// ---------------------------------------------------------------------------

export interface QuoteContact {
  lastName: string;
  firstName: string;
  organization: string;
  phone: string;
  email: string;
  profile: string;
  preference: string;
  slot: string;
}

export const EMPTY_CONTACT: QuoteContact = {
  lastName: "",
  firstName: "",
  organization: "",
  phone: "",
  email: "",
  profile: "",
  preference: "",
  slot: "",
};

/** What the client describes: project types, per-type details, site and notes. */
export interface QuoteRequestData {
  types: string[];
  details: Record<string, FieldGroup>;
  /** Free text written by the client ("Précisions sur votre projet"). */
  projectNotes: string;
  /** Site fields plus `animals` and `animalCount` from step 1. */
  site: FieldGroup;
  contact: QuoteContact;
}

export const QUOTE_STATUSES = {
  nouveau: "Nouveau",
  "en-cours": "En cours",
  envoye: "Devis envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  archive: "Archivé",
} as const;
export type QuoteStatus = keyof typeof QUOTE_STATUSES;
export const QUOTE_STATUS_IDS = Object.keys(QUOTE_STATUSES) as QuoteStatus[];
export const CLOSED_STATUSES: QuoteStatus[] = ["accepte", "refuse", "archive"];

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  nouveau: "var(--y)",
  "en-cours": "var(--b)",
  envoye: "#8b5fb0",
  accepte: "var(--g)",
  refuse: "var(--p)",
  archive: "#aaa",
};

export const QUOTE_SOURCES = ["Magasin", "Téléphone", "E-mail", "Salon / événement", "Recommandation", "Autre"];

/** Label of a site field (including the step-1 animal fields) for display. */
export function siteFieldLabel(name: string, admin = false): string {
  const f = [...SITE_FIELDS, ANIMALS_FIELD, ANIMAL_COUNT_FIELD].find((x) => x.name === name);
  return f ? (admin ? (f.adminLabel ?? f.label) : f.label) : name;
}

export const fieldLabel = (f: FieldDef, admin = false): string => (admin ? (f.adminLabel ?? f.label) : f.label);

export const displayValue = (v: FieldValue | undefined): string => (Array.isArray(v) ? v.join(", ") : (v ?? ""));
