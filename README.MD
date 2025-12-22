# Filipino Emigrants Dashboard

A comprehensive data visualization dashboard for analyzing Filipino emigrant data across different dimensions including destinations, origins, demographics, and trends over time.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. **IMPORTANT: Update Firestore Rules**

The dashboard requires public read access to Firestore. Follow these steps:

#### Option A: Firebase Console (Fastest - 2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **filipinoemigrantsdb-21c54**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the rules from `firestore.rules` file in this project
5. Click **Publish**

#### Option B: Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

See `FIRESTORE_RULES_SETUP.md` for detailed instructions.

### 3. Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Video Demo

https://github.com/user-attachments/assets/e305b136-7317-4af5-8299-034053612b66


## 📊 Features

- **Geographic Visualization**: Interactive choropleth maps showing emigrant distribution
- **Comparison Charts**: Compare emigrant data across different categories
- **Composition Analysis**: View data composition and proportions
- **Trend Analysis**: Analyze emigration trends over time
- **Distribution Charts**: Visualize data distribution patterns
- **Relationship Analysis**: Explore correlations and relationships
- **CSV Upload**: Upload new data to Firebase

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS 4
- **Charts**: Nivo Charts
- **Database**: Firebase Firestore
- **Icons**: React Icons

## 📁 Project Structure
```
case-study-2/
├── .tanstack/                      # TanStack Query cache
├── config/                         # Configuration files
├── docs/                          # Documentation
│   ├── architecture/
│   │   └── PROJECT_STRUCTURE.md
│   ├── guides/
│   │   ├── CHOROPLETH_INTEGRATION_GUIDE.md
│   │   ├── CRUD_ARCHITECTURE.md
│   │   ├── CRUD_DEPLOYMENT_CHECKLIST.md
│   │   ├── CRUD_GUIDE.md
│   │   ├── CRUD_IMPLEMENTATION_SUMMARY.md
│   │   ├── CRUD_QUICK_REFERENCE.md
│   │   ├── CSV_DATA_EXPLANATION.md
│   │   ├── CSV_FORMAT_GUIDE.md
│   │   ├── FIRESTORE_RULES_SETUP.md
│   │   ├── PAGES_GUIDE.md
│   │   └── PAGES_QUICK_REFERENCE.md
│   └── issues/                    # Known issues and solutions
├── node_modules/                  # Dependencies
├── public/                        # Static assets
│   ├── data/                     # CSV data files
│   │   ├── processed/            # Cleaned/processed CSV files
│   │   └── raw/                  # Original CSV files
│   │       ├── Age-Clean.csv
│   │       ├── CivilStatus-Clean.csv
│   │       ├── Countries-Clean.csv
│   │       ├── Education-Clean.csv
│   │       ├── MajorCountries-Clean.csv
│   │       ├── Occupation-Clean.csv
│   │       ├── PlaceOfOrigin-Clean.csv
│   │       └── Sex-Clean.csv
│   └── robots.txt
├── src/
│   ├── api/                      # Firebase service layer
│   │   ├── baseService.ts        # Base service with common operations
│   │   ├── destinationService.ts # Destination data CRUD operations
│   │   └── originService.ts      # Origin data CRUD operations
│   ├── components/               # Reusable UI components
│   │   ├── charts/              # Chart components
│   │   ├── DataPopulationButton.tsx
│   │   ├── header.tsx
│   │   ├── loadingScreen.tsx
│   │   └── navBar.tsx
│   ├── context/                  # React context providers
│   │   └── navBarContext.tsx
│   ├── data/                    # Data management
│   │   ├── processed/           # Processed data
│   │   └── raw/                 # Raw CSV data
│   ├── hooks/                   # Custom React hooks
│   │   ├── useComparisonData.ts
│   │   ├── useCompositionData.ts
│   │   ├── useDashboardStats.ts
│   │   ├── useDistributionData.ts
│   │   ├── useGeoJSON.ts
│   │   ├── useIsMobile.ts
│   │   ├── useNavBarWidth.ts
│   │   ├── useParseAllDestinationData.ts
│   │   ├── useParseOriginProvinceData.ts
│   │   ├── useRelationshipData.ts
│   │   ├── useTrendData.ts
│   │   └── useYearFilter.ts
│   ├── routes/                  # Page/Route components
│   │   ├── _root.tsx           # Root layout
│   │   ├── comparison.tsx      # Comparison visualizations
│   │   ├── composition.tsx     # Composition analysis
│   │   ├── crud.tsx           # CRUD operations page
│   │   ├── distribution.tsx    # Distribution charts
│   │   ├── geographic.tsx      # Geographic/map visualizations
│   │   ├── index.tsx          # Landing/home page
│   │   ├── parallel.tsx       # Parallel coordinates
│   │   ├── radar.tsx          # Radar charts
│   │   ├── relationships.tsx   # Relationship analysis
│   │   ├── trends.tsx         # Trend analysis
│   │   └── upload.tsx         # CSV upload page
│   ├── scripts/                # Utility scripts
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   │   ├── countryMapping.ts
│   │   ├── csvDataPopulation.ts
│   │   └── normalizeProvince.ts
│   ├── firebase.ts             # Firebase configuration
│   ├── main.tsx               # Application entry point
│   ├── routeTree.gen.ts       # Auto-generated route tree
│   └── styles.css             # Global styles
├── .cta.json                   # CTA configuration
├── .gitignore
├── convert-csvs.js            # CSV conversion script
├── firebase-debug.log
├── firestore.rules            # Firestore security rules
├── index.html
├── package.json
├── package-lock.json
├── README.MD
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

### Key Directories Explained

#### `/src/api` - Firebase Service Layer
Base services and CRUD operations for interacting with Firestore database. Handles all data persistence operations.

#### `/src/components` - UI Components
Reusable React components including charts, navigation, loading states, and data population controls.

#### `/src/context` - State Management
React Context providers for managing global application state (e.g., navigation bar state).

#### `/src/hooks` - Custom Hooks
Custom React hooks for data fetching, parsing CSV files, filtering, and responsive design utilities.

#### `/src/routes` - Pages
TanStack Router route components representing different pages/views in the application.

#### `/src/utils` - Utilities
Helper functions for data normalization, country mapping, and CSV data population.

#### `/public/data` - Data Files
Raw and processed CSV files containing demographic and migration data organized by category (age, education, occupation, etc.).

#### `/docs` - Documentation
Comprehensive guides covering CRUD operations, data formats, Firebase setup, deployment checklists, and architecture decisions.

## 🔥 Firebase Configuration

The project uses Firebase for:

- **Firestore**: Data storage and retrieval
- No authentication required (public access)

## 📝 Data Upload

Navigate to `/upload` to upload CSV files. The system supports:

- Destination countries data
- Origin provinces data
- Age group data
- Gender distribution data
- Education level data
- Civil status data

## 🚨 Troubleshooting

### "Missing or insufficient permissions" Error

This means Firestore security rules haven't been updated. Follow the Firestore setup steps above.

### Charts Not Loading

1. Check browser console for errors
2. Verify Firebase configuration in `src/firebase.ts`
3. Ensure Firestore has data in the correct collections

## 📦 Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm test` - Run tests

## 🌐 Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure Firestore rules are published

## 📄 License

Private project
