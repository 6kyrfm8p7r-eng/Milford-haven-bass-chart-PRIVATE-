# 🐉 Milford Haven Bass Chart

### Private fishing intelligence for the Pembrokeshire coast

A private, data-driven boat fishing chart designed to learn **where, when and why fish are caught** around Milford Haven and the Pembrokeshire coast.

The project combines:

- Accurate geographic catch positions
- Fishing effort and blank drifts
- Tide state and tidal range
- Wind conditions
- Swell height, direction and period
- Sea temperature
- Atmospheric conditions
- Bathymetry and seabed structure
- Lure and tackle information
- Historical catch patterns

The long-term objective is to turn personal fishing records into a **condition-aware fishing intelligence system** capable of identifying patterns and highlighting promising areas for future sessions.

---

## 🎯 Primary Target

**European Bass — Dicentrarchus labrax**

Secondary species will initially include:

- Pollack
- Wrasse
- Mackerel

The database will support additional species later.

---

# 🗺️ Initial Chart Area

The first development area will cover:

**Dale → Milford Haven entrance → St Ann's Head → Freshwater West**

The system should later be capable of expanding across Pembrokeshire, South Wales and beyond.

The chart is intended for **fishing analysis and planning**.

> ⚠️ It is NOT a replacement for an approved nautical chart, chartplotter or official navigation information.

---

# 🐟 Catch Records

Every catch should be stored as an individual event.

Minimum information:

- Latitude
- Longitude
- Species
- Date
- Time

Optional information:

- Weight
- Length
- Lure
- Lure colour
- Lure length
- Jig-head / lure weight
- Retrieve style
- Fishing depth
- Notes
- Photograph

The system will then attempt to enrich the catch automatically with environmental information.

---

# 🌊 Environmental Enrichment

For each catch we aim to determine:

### Tide

- Tide height
- Flood / ebb
- Time relative to HW/LW
- Previous HW/LW
- Next HW/LW
- Tidal range
- Spring / neap classification
- Estimated tidal-stream strength
- Estimated tidal-stream direction

### Wind

- Direction
- Average speed
- Gust speed

### Sea

- Swell height
- Swell direction
- Swell period
- Wave height
- Sea temperature

### Weather

- Air temperature
- Atmospheric pressure
- Cloud cover
- Precipitation
- Visibility

### Ground

Where reliable data are available:

- Water depth
- Depth contour
- Reef
- Rock
- Sand
- Gravel
- Kelp / vegetation
- Drop-off
- Gully
- Pinnacle
- Sand / rock transition

---

# 🚤 Fishing Effort

Catches alone do not tell the whole story.

The system will also record **fishing effort**.

An effort record may represent:

- A complete drift
- Time spent fishing a mark
- A trolling pass
- A stationary fishing period

Example:

    Drift start: 14:05
    Drift end:   14:18
    Result:      0 fish

Blank drifts are valuable data.

This allows the system to distinguish:

**Catch Density**

Where have fish been caught?

from

**Catch Rate**

How often does fishing that location actually produce fish?

---

# 🔥 Heat Maps

The chart will eventually support several analytical layers.

### Catch Heat

Displays concentrations of historical catches.

### Catch-Rate Heat

Accounts for fishing effort and blank sessions.

### Condition Heat

Displays catches matching selected environmental conditions.

Example:

    Species: Bass
    Tide: Ebb
    HW offset: +60 to +180 min
    Wind: W–NW
    Swell: SW
    Tidal range: > 4.5 m

### Prediction Layer

Highlights areas whose historical conditions most closely resemble upcoming forecast conditions.

Predictions must always be visually distinguishable from recorded catches.

---

# 🧠 Fishing Intelligence

The eventual prediction engine should consider relationships between:

    Location
       +
    Structure
       +
    Tide
       +
    Weather
       +
    Sea state
       +
    Season
       +
    Fishing effort
       +
    Historical catches

Instead of simply saying:

> "This is a good mark."

the system should eventually produce explanations such as:

> Strong historical match

    12 comparable drifts
    Bass caught on 8
    Most productive HW +70 to +130 min
    Similar WNW wind
    Similar SW swell
    Reef-to-sand transition

    Confidence: MODERATE

Predictions should remain explainable.

---

# 📊 Data Principles

## Preserve raw observations

Original catch information must never be overwritten by calculated data.

For example:

    RAW
    Catch time: 14:17
    Position: 51.xxxxxx, -5.xxxxxx

Derived environmental information is stored separately.

This means historical catches can be recalculated later if better tide, weather or bathymetric models become available.

---

## Record the source

Environmental information should include:

- Provider
- Observation / forecast time
- Retrieval time
- Model where known
- Confidence / quality indicator

This prevents uncertain third-party information from silently becoming fact.

---

# 🎨 Visual Identity

This should NOT look like a generic web dashboard.

Design direction:

### Welsh
### Maritime
### Technical
### Modern
### Purpose-built for fishing

Visual inspiration:

- Marine electronics
- Nautical charts
- Pembrokeshire coastline
- Welsh maritime identity

Suggested palette:

- Deep navy / near-black chart background
- Bathymetric blue
- Off-white chart text
- Brass / muted gold details
- Welsh red highlights
- Sea-green secondary information

Welsh styling should remain subtle.

Potential branding:

🐉 **Welsh sea-dragon / bass emblem**

rather than covering the interface in flags or decorative graphics.

---

# 🖥️ Main Interface

The chart should dominate the screen.

Suggested layout:

    ┌─────────────────────────────────────┐
    │                                     │
    │                                     │
    │              CHART                  │
    │                                     │
    │                                     │
    │                        ┌───────────┐ │
    │                        │ Catch     │ │
    │                        │ details   │ │
    │                        └───────────┘ │
    └─────────────────────────────────────┘

Primary modes:

**CATCH**

Historical catches.

**HEAT**

Catch density / catch rate.

**STRUCTURE**

Bathymetry and seabed information.

**PREDICT**

Condition-matched fishing opportunities.

---

# 📍 Adding a Catch

The eventual workflow should be extremely quick.

### Method 1 — Chart

Press/hold location →

    Add Catch

Then enter:

    Species
    Time
    Size
    Lure

### Method 2 — Coordinates

Paste coordinates from a chartplotter.

### Method 3 — Future import

Import tracks / waypoints from compatible marine electronics where practical.

---

# 🗃️ Core Data Objects

Initial architecture:

    Catch
    Effort
    Drift
    Trip
    Mark
    Environment
    Tide
    Weather
    SeaState
    Structure
    Lure

These relationships will form the basis of the database.

---

# 🚧 Development Roadmap

## Phase 1 — Foundation

- Project structure
- Data model
- Accurate base map
- Initial Pembrokeshire view
- Catch database
- Add/edit/delete catches
- Catch markers

## Phase 2 — Fishing Chart

- Bathymetry
- Structure layers
- Marks
- Drift recording
- Track display
- Filtering

## Phase 3 — Environmental Intelligence

- Tide integration
- Weather integration
- Marine forecast integration
- Automatic historical enrichment

## Phase 4 — Analysis

- Catch heat maps
- Effort heat maps
- Catch-rate analysis
- Tide analysis
- Seasonal analysis
- Condition filtering

## Phase 5 — Prediction

- Forecast monitoring
- Historical-condition matching
- Mark scoring
- Time-window analysis
- Explainable predictions

---

# 🔒 Privacy

This project contains private fishing locations.

Exact catch coordinates and private marks must **never be exposed through a public client, public repository, analytics service or unrestricted API**.

Sensitive fishing data should be treated as private by default.

---

# 🐉 Project Principle

> **Learn the ground.  
> Understand the tide.  
> Find the fish.**

Built around real fishing experience rather than generic fishing forecasts.
