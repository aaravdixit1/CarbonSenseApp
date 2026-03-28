"""
Versioned emissions factors database for CarbonSenseAI.

Sources:
- EPA: https://www.epa.gov/ghgemissions/sources-greenhouse-gas-emissions
- IPCC AR6 (2021): https://www.ipcc.ch/report/ar6/wg1/
- Our World in Data: https://ourworldindata.org/food-choice-vs-eating-local
"""

from __future__ import annotations

from typing import Optional


# ---------------------------------------------------------------------------
# Emissions factors — version "1.0"
# All values in kgCO2e per unit (unit noted in comments).
# ---------------------------------------------------------------------------

_FACTORS_V1: dict[str, float] = {
    # ── Food (kgCO2e per kg of food, annual consumption proxy) ──────────────
    # Source: Our World in Data / Poore & Nemecek (2018) / IPCC AR6
    "food.beef": 27.0,          # kg CO2e / kg beef
    "food.poultry": 6.9,        # kg CO2e / kg poultry
    "food.dairy": 3.2,          # kg CO2e / kg dairy (milk equivalent)
    "food.plant_based": 2.0,    # kg CO2e / kg plant-based foods (avg)

    # Annual diet footprint multipliers (tCO2e/year) derived from
    # diet-type × meat-frequency combinations.
    # These are the primary factors used by the footprint engine.
    "food.annual.omnivore.daily": 3.3,
    "food.annual.omnivore.few_per_week": 2.5,
    "food.annual.omnivore.weekly": 1.9,
    "food.annual.omnivore.rarely": 1.5,
    "food.annual.flexitarian.daily": 2.5,
    "food.annual.flexitarian.few_per_week": 2.0,
    "food.annual.flexitarian.weekly": 1.6,
    "food.annual.flexitarian.rarely": 1.3,
    "food.annual.vegetarian.daily": 1.7,
    "food.annual.vegetarian.few_per_week": 1.5,
    "food.annual.vegetarian.weekly": 1.4,
    "food.annual.vegetarian.rarely": 1.3,
    "food.annual.vegan.daily": 1.1,
    "food.annual.vegan.few_per_week": 1.0,
    "food.annual.vegan.weekly": 1.0,
    "food.annual.vegan.rarely": 0.9,

    # Global average food footprint (tCO2e/year) — used for substitution
    "food.global_average": 1.7,

    # ── Transport (kgCO2e per km) ────────────────────────────────────────────
    # Source: EPA / IPCC AR6 / Our World in Data
    "transport.car.gasoline": 0.192,   # kg CO2e / km (avg passenger car)
    "transport.car.diesel": 0.171,     # kg CO2e / km
    "transport.car.hybrid": 0.110,     # kg CO2e / km
    "transport.car.electric": 0.053,   # kg CO2e / km (avg grid mix)
    "transport.transit": 0.089,        # kg CO2e / km (bus/rail avg)
    "transport.cycling": 0.0,          # kg CO2e / km
    "transport.walking": 0.0,          # kg CO2e / km

    # Air travel (kgCO2e per km, including radiative forcing factor ~1.9×)
    # Source: IPCC AR6 / Our World in Data
    "transport.air.short": 0.255,      # < 1500 km
    "transport.air.medium": 0.195,     # 1500–4000 km
    "transport.air.long": 0.150,       # > 4000 km

    # Annual transport footprint multipliers (tCO2e/year)
    # Assumes average annual distance: car ~15,000 km, transit ~5,000 km
    "transport.annual.car.gasoline": 2.88,
    "transport.annual.car.diesel": 2.57,
    "transport.annual.car.hybrid": 1.65,
    "transport.annual.car.electric": 0.80,
    "transport.annual.transit": 0.45,
    "transport.annual.cycling": 0.0,
    "transport.annual.walking": 0.0,

    # Flight frequency annual additions (tCO2e/year)
    "transport.flights.none": 0.0,
    "transport.flights.one_or_two": 0.6,
    "transport.flights.several": 1.8,
    "transport.flights.frequent": 4.0,

    # Global average transport footprint (tCO2e/year) — used for substitution
    "transport.global_average": 1.9,

    # ── Home Energy (kgCO2e per kWh) ────────────────────────────────────────
    # Source: EPA eGRID / IPCC AR6
    "home_energy.grid_electricity": 0.386,   # kg CO2e / kWh (US avg grid)
    "home_energy.natural_gas": 0.202,        # kg CO2e / kWh (gas combustion)
    "home_energy.renewables": 0.020,         # kg CO2e / kWh (lifecycle)
    "home_energy.mixed": 0.250,              # kg CO2e / kWh (mixed sources)

    # Annual home energy footprint multipliers (tCO2e/year per person)
    # Assumes avg household consumption ~10,000 kWh/year, divided by household size
    "home_energy.annual.grid": 3.86,
    "home_energy.annual.natural_gas": 2.02,
    "home_energy.annual.renewables": 0.20,
    "home_energy.annual.mixed": 2.50,

    # Global average home energy footprint (tCO2e/year) — used for substitution
    "home_energy.global_average": 2.0,

    # ── Shopping (tCO2e/year) ────────────────────────────────────────────────
    # Source: EPA / Our World in Data / lifecycle assessment literature
    "shopping.clothing": 0.7,       # tCO2e/year (avg clothing purchases)
    "shopping.electronics": 0.3,    # tCO2e/year (avg electronics)
    "shopping.delivery": 0.1,       # tCO2e/year (last-mile delivery)

    # Annual shopping footprint multipliers by frequency (tCO2e/year)
    "shopping.annual.rarely": 0.3,
    "shopping.annual.monthly": 0.7,
    "shopping.annual.weekly": 1.5,
    "shopping.annual.daily": 3.0,

    # Global average shopping footprint (tCO2e/year) — used for substitution
    "shopping.global_average": 0.7,

    # ── Weekly km adjustment factors ─────────────────────────────────────────
    # Used to scale transport footprint based on actual weekly distance.
    # Base assumption in annual multipliers: ~15,000 km/year (~288 km/week).
    # Adjustment = (weekly_km * 52) / 15000 — applied as a multiplier.
    "transport.weekly_km_baseline": 288.0,   # km/week baseline

    # ── Fuel economy adjustment ───────────────────────────────────────────────
    # fuel_economy 0–100: 0 = worst (old gasoline), 100 = best (EV/efficient)
    # Maps to a multiplier: 0 → 1.4×, 50 → 1.0×, 100 → 0.5×
    "transport.fuel_economy.worst_multiplier": 1.4,
    "transport.fuel_economy.best_multiplier": 0.5,

    # ── Local food adjustment ─────────────────────────────────────────────────
    # local_food_pct 0–100: each 10% local/unprocessed reduces food footprint by ~3%
    # Max reduction capped at 25% (fully local still has some footprint)
    "food.local_reduction_per_10pct": 0.03,
    "food.local_max_reduction": 0.25,

    # ── Trash adjustment ─────────────────────────────────────────────────────
    # trash_vs_neighbors 0–100: 0=much less waste, 100=much more
    # Baseline (50) = 0 adjustment. Range: -0.15 to +0.15 tCO2e/year
    "waste.baseline_tco2e": 0.0,
    "waste.max_delta_tco2e": 0.15,
}


class EmissionsDatabase:
    """
    Versioned store of emissions factors.

    Versions are loaded via `load_version` but remain inactive until
    `promote_version` is called. The initial version "1.0" is seeded at
    construction time and immediately activated.
    """

    def __init__(self) -> None:
        self._versions: dict[str, dict[str, float]] = {}
        self._active_version: str = ""

        # Seed the initial version and activate it immediately.
        self.load_version("1.0", _FACTORS_V1)
        self.promote_version("1.0")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_factors(self, version: str) -> dict[str, float]:
        """Return the emissions factor map for *version*.

        Raises KeyError if the version has not been loaded.
        """
        if version not in self._versions:
            raise KeyError(f"Emissions database version '{version}' not found.")
        return dict(self._versions[version])  # return a copy

    def get_active_version(self) -> str:
        """Return the currently active version string."""
        return self._active_version

    def load_version(self, version: str, factors: dict[str, float]) -> None:
        """Load *factors* under *version* without activating it.

        If the version already exists it will be overwritten (useful for
        patching a staged version before promotion).
        """
        self._versions[version] = dict(factors)  # store a copy

    def promote_version(self, version: str) -> None:
        """Activate a previously loaded version.

        Raises KeyError if the version has not been loaded first.
        """
        if version not in self._versions:
            raise KeyError(
                f"Cannot promote version '{version}': it has not been loaded."
            )
        self._active_version = version

    def get_fallback_actions(self) -> list[dict]:
        """Return a static top-3 generic high-impact actions.

        Used by the AI pipeline when the LLM call times out or fails.
        Each action targets a universally high-impact behaviour change.
        """
        return [
            {
                "id": "fallback_1",
                "description": (
                    "Switch to a plant-rich diet by replacing beef with "
                    "plant-based proteins at least 3 days per week."
                ),
                "savings_tco2e": 0.8,
                "impact_label": "your biggest lever",
                "rank": 1,
                "composite_score": 0.92,
            },
            {
                "id": "fallback_2",
                "description": (
                    "Replace one short-haul flight per year with train or "
                    "video-conference alternatives."
                ),
                "savings_tco2e": 0.6,
                "impact_label": "high impact",
                "rank": 2,
                "composite_score": 0.78,
            },
            {
                "id": "fallback_3",
                "description": (
                    "Switch your home energy tariff to a certified renewable "
                    "electricity provider."
                ),
                "savings_tco2e": 0.5,
                "impact_label": "high impact",
                "rank": 3,
                "composite_score": 0.71,
            },
        ]


# ---------------------------------------------------------------------------
# Module-level singleton — import and use directly in other backend modules.
# ---------------------------------------------------------------------------

emissions_db: EmissionsDatabase = EmissionsDatabase()
