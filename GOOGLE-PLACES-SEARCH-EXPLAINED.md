# Google Places Search - Fonctionnement Complet

Ce document explique comment fonctionne la recherche de facilities médicales avec l'API Google Places.

## 📊 Architecture de la Recherche

### 1. Recherche Multi-Types
Pour chaque recherche, le système effectue des requêtes séparées pour chaque type de facility:

```
Types de facilities recherchés:
├── Hospital    → Google type: "hospital"
├── Clinic      → Google types: "doctor", "physiotherapist", "health"
├── Doctor      → Google types: "doctor", "dentist"
├── Pharmacy    → Google types: "pharmacy", "drugstore"
└── Laboratory  → Google type: "health" (filtré par nom)
```

**Exemple:** Si vous sélectionnez "Tout", le système fait 6 requêtes distinctes:
1. `type=hospital`
2. `type=doctor`
3. `type=dentist`
4. `type=pharmacy`
5. `type=physiotherapist`
6. `type=health`

### 2. Pagination Automatique

Chaque requête Google retourne **maximum 20 résultats** par page. Pour obtenir plus de résultats, le système utilise la pagination:

```
Page 1 → 20 résultats + next_page_token
   ↓ (attendre 2 secondes)
Page 2 → 20 résultats + next_page_token
   ↓ (attendre 2 secondes)
Page 3 → 20 résultats (dernière page)
```

**Limite Google:** Maximum **3 pages = 60 résultats** par type de recherche.

### 3. Résultats Totaux Possibles

```
Calcul théorique maximum:
- Hospital:         60 résultats
- Doctor:           60 résultats
- Dentist:          60 résultats
- Pharmacy:         60 résultats
- Physiotherapist:  60 résultats
- Health:           60 résultats
─────────────────────────────────
TOTAL MAXIMUM:     360 résultats (si tous différents)
```

**Note:** En pratique, il y a des doublons (ex: un médecin peut être taggé "doctor" ET "health"), donc le nombre réel est inférieur.

## 🗺️ Filtres Géographiques

### Restriction au Maroc

Le système applique **deux filtres** pour éviter les résultats en Espagne:

#### 1. Région Bias (`region=ma`)
```javascript
// Dans l'API proxy
url.searchParams.set('region', 'ma'); // Bias vers le Maroc
```
Indique à Google de prioriser les résultats marocains.

#### 2. Filtre Latitude Strict
```javascript
const MOROCCO_NORTH_LIMIT = 35.92; // Latitude limite

// Rejette tous les résultats au nord de cette ligne
if (pLat && pLat >= MOROCCO_NORTH_LIMIT) {
    // Résultat rejeté (probablement en Espagne)
}
```

**Géographie du Détroit de Gibraltar:**
```
Tarifa (Espagne):        36.01°N  ← Bloqué
─────────────────────────────────────
Limite filtre:           35.92°N
─────────────────────────────────────
Tanger Med (Maroc):      35.89°N  ✓ OK
Tanger Ville (Maroc):    35.77°N  ✓ OK
```

## 🔄 Processus de Recherche Complet

### Étape par Étape

```
1. Utilisateur clique "Rechercher"
   └─> Point de référence: Lat/Lng
   └─> Rayon: X km
   └─> Types sélectionnés: [hospital, pharmacy, ...]

2. Pour chaque type Google:
    ├─> Requête Page 1 (0-20 résultats)
   ├─> Si next_page_token existe:
   │   ├─> Attendre 2 secondes
   │   ├─> Requête Page 2 (21-40 résultats)
   │   └─> Si next_page_token existe:
   │       ├─> Attendre 2 secondes
   │       └─> Requête Page 3 (41-60 résultats)
    └─> Filtre géographique strict (lat < 35.92)

3. Fusion de tous les résultats
    ├─> Suppression des doublons (par place_id)
    ├─> Tri par distance
    └─> Affichage sur la carte + panneau

4. **Comportement non‑décroissant (rayon)**
    - Si le point de référence et les filtres sont identiques,
      alors augmenter le rayon **ne peut plus diminuer** le nombre de résultats.
    - Le système **fusionne** les nouveaux résultats avec les anciens,
      puis filtre seulement ceux qui sortent du nouveau rayon.
```

### Logs Console (F12)

Pendant la recherche, vous verrez:
```
[hospital] Page 1: 18 added, 2 filtered (Spain), 20 total in response
[hospital] Next page token available, will fetch page 2
[hospital] Page 2: 15 added, 1 filtered (Spain), 20 total in response
[hospital] Next page token available, will fetch page 3
[hospital] Page 3: 12 added, 0 filtered (Spain), 20 total in response
[hospital] No more pages available. Total fetched: 3 pages
[hospital] Completed: 3 pages fetched

[pharmacy] Page 1: 20 new results added (20 total in response)
[pharmacy] Next page token available, will fetch page 2
...

Total unique facilities found: 156
```

## 📈 Comportement du Nombre de Résultats

### Pourquoi le nombre change avec le rayon?

| Rayon | Résultats | Explication |
|-------|-----------|-------------|
| 10 km | 85 | Peu de facilities dans cette zone |
| 30 km | 232 | Plus de zone couverte = plus de résultats |
| 50 km | 226 | Google change son ranking, certains résultats "moins pertinents" disparaissent des 60 premiers |

**Important:** Google ne retourne pas TOUS les résultats dans un rayon, mais les **60 "meilleurs"** selon son algorithme de pertinence. Quand le rayon augmente:
- ✅ Plus de zone = potentiellement plus de résultats
- ⚠️ Mais Google peut remplacer des résultats "moyens" proches par des résultats "excellents" lointains
- ⚠️ Limite de 60 par type reste constante

**NOUVEAU:** Pour éviter la baisse illogique du nombre de résultats, un cache local
fusionne les résultats précédents lorsqu'on augmente le rayon (même point + mêmes filtres).

## 🎯 Optimisations Appliquées

### 1. Déduplication Stricte
```javascript
const seenPlaceIds = new Set<string>();

// Vérifie si le place_id existe déjà
if (!seenPlaceIds.has(place.place_id)) {
    seenPlaceIds.add(place.place_id);
    allResults.push(place);
}
```

### 2. Retry Logic
- 3 tentatives par requête en cas d'erreur réseau
- Délai exponentiel entre les tentatives
- Continue avec le type suivant en cas d'échec complet

### 3. Timeout Protection
```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000); // 30 secondes max
```

## 🔍 Types de Facilities et Classification

### Mapping Intelligent

Le système classifie les résultats Google en types internes:

```javascript
parseGooglePlaceType(types, name) {
    // Hôpital
    if (types.includes('hospital')) return 'hospital';
    
    // Pharmacie
    if (types.includes('pharmacy')) return 'pharmacy';
    
    // Laboratoire (détecté par nom)
    if (name.includes('laboratoire') || name.includes('analyse'))
        return 'laboratory';
    
    // Médecin
    if (types.includes('doctor') || types.includes('dentist'))
        return 'doctor';
    
    // Clinique
    if (name.includes('clinique') || name.includes('centre'))
        return 'clinic';
}
```

### Spécialités Détectées

```javascript
- 'Dentiste'            → dentist, dental
- 'Kinésithérapie'      → physiotherapist, physioth
- 'Analyses Médicales'  → laboratoire, laboratory
- 'Podologie'           → podologue, podiatrist
- 'Psychothérapie'      → psycho
```

## ⚡ Performance

### Temps de Recherche Typique

```
1 type sélectionné:
└─> 1-3 requêtes (selon pagination)
└─> ~2-8 secondes

Tous les types (6 types):
└─> 6-18 requêtes (selon pagination)
└─> ~10-40 secondes
```

### Optimisations Futures Possibles

1. **Cache local** - Mémoriser les résultats par zone
2. **Recherche progressive** - Afficher les résultats au fur et à mesure
3. **Web Workers** - Paralléliser les requêtes
4. **Clustering** - Grouper les markers proches sur la carte

## 🚨 Limitations Google Places API

### Limitations Techniques
- ✅ **60 résultats max** par type de recherche (3 pages × 20)
- ✅ **next_page_token** valide après ~2 secondes
- ✅ **Ranking propriétaire** - Google décide quels sont les "meilleurs" résultats
- ✅ **Pas de filtrage pays direct** - On doit filtrer manuellement par latitude

### Quotas et Coûts
```
Prix (2026):
- Nearby Search: $32 / 1000 requêtes
- Page supplémentaire: même prix qu'une nouvelle requête

Exemple de coût pour 1 recherche "Tout":
- 6 types × 3 pages = 18 requêtes
- Coût: 18 × $0.032 = $0.576 par recherche
- Crédit gratuit: $200/mois = ~350 recherches complètes
```

## 📝 Fichiers Modifiés

### Backend
- `/frontend/src/app/api/places/route.ts`
  - Support du `pagetoken`
  - Ajout du `region=ma` bias

### Frontend
- `/frontend/src/lib/overpass.ts`
    - Pagination complète (boucle jusqu'à épuisement du `next_page_token`)
    - Filtre géographique strict Maroc (lat < 35.92)
    - Logs détaillés (ajoutés/filtrés par page)
    - Retry logic améliorée

- `/frontend/src/components/SearchMap.tsx`
    - Fusion des résultats lors d'une augmentation de rayon
    - Garantie de résultat **non‑décroissant** pour même point et mêmes filtres

## 🎓 Pour les Développeurs

### Ajouter un Nouveau Type de Facility

1. **Définir le type** dans `types/hospital.ts`:
```typescript
export const FACILITY_TYPE_KEYS = [
    "hospital", "clinic", "doctor", "pharmacy", "laboratory", "newtype"
] as const;
```

2. **Mapper vers Google** dans `lib/overpass.ts`:
```typescript
const GOOGLE_PLACES_TYPE_MAP = {
    // ...
    newtype: ['google_type1', 'google_type2'],
};
```

3. **Ajouter la traduction** dans `locales/fr.json` et `en.json`:
```json
{
    "facilityTypes": {
        "newtype": "Nouveau Type"
    }
}
```

### Debug Console

Pour voir tous les détails:
```javascript
// Ouvrir la console (F12)
// Chercher les logs:
[hospital] Page 1: 18 new results added
[pharmacy] Completed: 3 pages fetched
Total unique facilities found: 232
```

---

**Dernière mise à jour:** 3 février 2026  
**Version API Google Places:** v1 (Nearby Search)  
**Auteur:** Migration OpenStreetMap → Google Maps
