/**
 * Content collections managed with the generic list/editor of the admin console
 * (/admin/contenu/<slug>). Pure data: shared by the admin UI and the server validation.
 */
import { USED_ITEM_STATUSES, UNIVERSES } from "./types";

export type AdminFieldType = "text" | "textarea" | "select" | "date" | "checkbox" | "image";

export interface AdminField {
  name: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
  half?: boolean;
  rows?: number;
  placeholder?: string;
  options?: [value: string, label: string][];
}

export interface CollectionDef {
  title: string;
  singular: string;
  intro: string;
  fields: AdminField[];
  /** Field shown as the item title in lists. */
  titleField: string;
  /** Items can be reordered by hand (otherwise sorted by date). */
  sortable: boolean;
  /** Public page where the collection appears. */
  previewPath: string;
}

const universeOptions = Object.entries(UNIVERSES) as [string, string][];

const cardFields = (rows: number): AdminField[] => [
  { name: "title", label: "Titre", type: "text", required: true },
  { name: "text", label: "Description", type: "textarea", rows },
  { name: "image", label: "Photo", type: "image" },
];

export const COLLECTIONS = {
  nouveautes: {
    title: "Nouveautés",
    singular: "nouveauté",
    intro:
      "Publiées sur la page « Nouveautés » ; les trois dernières apparaissent sur l'accueil. Une date future programme la publication.",
    titleField: "title",
    sortable: false,
    previewPath: "/nouveautes",
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "universe", label: "Univers", type: "select", options: universeOptions, half: true },
      { name: "publishDate", label: "Date de publication", type: "date", half: true },
      { name: "text", label: "Texte", type: "textarea", rows: 6 },
      { name: "image", label: "Photo", type: "image" },
      { name: "published", label: "Publiée sur le site", type: "checkbox" },
      { name: "featured", label: "Mettre en avant (toujours en premier)", type: "checkbox" },
    ],
  },
  occasions: {
    title: "Occasions",
    singular: "occasion",
    intro:
      "Selles et matériel d'occasion affichés sur la page Équitation. Les articles « vendus » disparaissent automatiquement du site.",
    titleField: "title",
    sortable: true,
    previewPath: "/equitation",
    fields: [
      { name: "title", label: "Titre", type: "text", required: true, placeholder: "ex. Selle mixte 17 pouces" },
      { name: "brand", label: "Marque", type: "text", half: true },
      {
        name: "size",
        label: "Taille / dimensions",
        type: "text",
        half: true,
        placeholder: "ex. 17,5'' · arcade moyenne",
      },
      {
        name: "condition",
        label: "État",
        type: "select",
        half: true,
        options: [
          ["", "—"],
          ["Très bon état", "Très bon état"],
          ["Bon état", "Bon état"],
          ["État correct", "État correct"],
          ["À restaurer", "À restaurer"],
        ],
      },
      { name: "price", label: "Prix (€) — facultatif", type: "text", half: true },
      {
        name: "status",
        label: "Statut",
        type: "select",
        half: true,
        options: Object.entries(USED_ITEM_STATUSES) as [string, string][],
      },
      { name: "image", label: "Photo", type: "image" },
      { name: "description", label: "Description (usage interne)", type: "textarea", rows: 3 },
    ],
  },
  avis: {
    title: "Avis clients",
    singular: "avis",
    intro:
      "Témoignages affichés sur la page d'accueil (la section est masquée tant qu'il n'y en a pas). Ne publiez que des avis réels, avec l'accord du client.",
    titleField: "author",
    sortable: true,
    previewPath: "/",
    fields: [
      { name: "author", label: "Nom affiché", type: "text", required: true, placeholder: "ex. Marie L." },
      { name: "location", label: "Commune / écurie", type: "text", half: true },
      {
        name: "rating",
        label: "Note",
        type: "select",
        half: true,
        options: [
          ["5", "★★★★★"],
          ["4", "★★★★"],
          ["3", "★★★"],
          ["", "Sans note"],
        ],
      },
      { name: "text", label: "Avis", type: "textarea", rows: 4, required: true },
      { name: "published", label: "Affiché sur le site", type: "checkbox" },
    ],
  },
  fermetures: {
    title: "Fermetures exceptionnelles",
    singular: "fermeture",
    intro:
      "Le site affiche automatiquement « Fermé exceptionnellement » le jour venu, et liste les fermetures à venir avec les horaires.",
    titleField: "startDate",
    sortable: false,
    previewPath: "/contact",
    fields: [
      { name: "startDate", label: "Du", type: "date", required: true, half: true },
      { name: "endDate", label: "Au (inclus, vide si un seul jour)", type: "date", half: true },
      { name: "reason", label: "Motif (affiché)", type: "text", placeholder: "ex. Inventaire, congés, jour férié" },
    ],
  },
  rayons: {
    title: "Rayons équitation",
    singular: "rayon",
    intro: "Les rayons affichés sur l'accueil et la page Équitation.",
    titleField: "title",
    sortable: true,
    previewPath: "/equitation",
    fields: cardFields(3),
  },
  amenagements: {
    title: "Offres aménagement",
    singular: "offre",
    intro: "Les solutions présentées sur la page Clôtures & aménagement (et les 6 premières sur l'accueil).",
    titleField: "title",
    sortable: true,
    previewPath: "/amenagement",
    fields: cardFields(4),
  },
  services: {
    title: "Services",
    singular: "service",
    intro: "Les services en magasin (location de tondeuse, lavage…).",
    titleField: "title",
    sortable: true,
    previewPath: "/equitation",
    fields: cardFields(3),
  },
} satisfies Record<string, CollectionDef>;

export type CollectionSlug = keyof typeof COLLECTIONS;
export const isCollectionSlug = (s: string): s is CollectionSlug => Object.hasOwn(COLLECTIONS, s);

/** Values handled by the generic editor. */
export type ItemValues = Record<string, string | boolean>;
export type CollectionItem = ItemValues & { id: string };
