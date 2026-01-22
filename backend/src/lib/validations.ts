import { z } from 'zod';

export const hospitalSchema = z.object({
    name: z
    .string()
    .min(3, 'Le nom de l\'hôpital doit contenir au moins 3 caractères.')
    .max(50, 'Le nom de l\'hôpital ne peut pas dépasser 50 caractères.'),

    type: z.enum([
        "Générale",
        "Spécialisée",
        "Clinique Multidisciplinaire",
        "Clinique d’Oncologie",
        "Clinique de Beauté et d’Esthétique",
        "Clinique Néphrologique",
        "Clinique d’Ophtalmologie"
    ], {
            message: "Veuillez sélectionner un type valide",
    }),

    status: z.enum(["Active", "En construction", "En étude"], {
      message: "Veuillez sélectionner un statut valide",
    }),

    lat: z.number({
    message: "Veuillez cliquer sur la carte pour choisir un emplacement",
  }),
  
  lng: z.number({
    message: "Veuillez cliquer sur la carte pour choisir un emplacement",
  }),
   
})


export type inputHospital = z.infer<typeof hospitalSchema>