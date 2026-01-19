# Implementation Plan: Synthetic Delta-Based Options Backtesting in VectorBT

This document provides a step-by-step technical roadmap for implementing the synthetic options backtesting framework defined in `model-response.md`. This plan is designed for an LLM or developer to follow sequentially to produce a fully functional, vectorized backtesting engine.

---

## Phase 1: Environment & Data Preparation

### Step 1: Python Environment Setup
Install the core dependencies required for vectorized financial analysis and Black-Scholes calculations.
* **Task:** Initialize a Python environment (e.g., conda or venv).
* **Dependencies:** `vectorbtpro` (or `vectorbt`), `numpy`, `pandas`, `scipy`, `numba` (for speed).
* **Context:** VectorBT is the primary engine; Scipy will be used for the cumulative distribution function (CDF) and its inverse (PPF) in Black-Scholes.

### Step 2: Data Loading & Pre-processing
Load the underlying OHLCV data that will serve as the foundation.
* **Task:** Load a CSV or parquet file of underlying data (e.g., SPY 1-minute or 5-minute bars).
* **Requirements:** 
    * Ensure the index is datetime-aware.
    * Handle missing bars (forward-fill or drop).
    * Standardize column names: `Open`, `High`, `Low`, `Close`, `Volume`.

---

## Phase 2: Core Mathematical Engine

### Step 3: Implement Volatility Proxy (IV Estimation)
Since we lack real options IV data, we must estimate a "synthetic IV" from the underlying price action.
* **Task:** Create a function/class to calculate rolling volatility.
* **Implementation:** 
    * Calculate log returns.
    * Compute rolling standard deviation over a window (e.g., 20 periods).
    * Annualize the result: `vol * sqrt(annual_periods)`.
* **Context:** This "Proxy IV" will be the `sigma` input for Black-Scholes.

### Step 4: Vectorized Black-Scholes Functions
Implement the basic Black-Scholes functions using Numpy/Scipy for speed.
* **Task:** Create `bs_price(S, K, T, sigma, r, type)` and `bs_delta(S, K, T, sigma, r, type)`.
* **Constraints:** Must be fully vectorized (operate on Numpy arrays).
* **Context:** Use `scipy.stats.norm.cdf` for delta and pricing.

---

## Phase 3: Synthetic Option Selection Logic

### Step 5: Delta-to-Strike Solver (The "Heart")
Convert a target Delta (e.g., 0.20) into a specific Strike Price $K$.
* **Task:** Create a function `delta_to_strike(S, delta, T, sigma, r, type)`.
* **Implementation:** 
    * Use the inverse of the BS Delta formula. 
    * For Put Delta: $d_1 = \Phi^{-1}(\Delta)$. Since $d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)T}{\sigma\sqrt{T}}$, solve for $K$:
        $K = S \cdot \exp(-d_1 \sigma \sqrt{T} + (r + \sigma^2/2)T)$.
* **Context:** This allows "delta-based" entry without an options chain.

### Step 6: Synthetic Premium Estimation
Calculate the "Entry Credit" for the selected strike.
* **Task:** Calculate the theoretical premium at the moment of entry.
* **Implementation:** Use the `bs_price` function with the Strike $K$ solved in Step 5.
* **Context:** Even if we don't trade intraday, we need this to establish the initial PnL potential.

---

## Phase 4: Strategy Construction (Spreads)

### Step 7: Credit Spread Logic
Combine two synthetic options into a single tradeable unit.
* **Task:** Define logic for "Short Leg" and "Long Leg".
* **Inputs:** `Delta_Short` (e.g., 0.20) and `Delta_Long` (e.g., 0.05).
* **Outputs:** 
    * `Strike_Short`, `Strike_Long`.
    * `Net_Credit = Premium_Short - Premium_Long`.
    * `Width = |Strike_Short - Strike_Long|`.
* **Context:** This defines the risk/reward profile of each 0DTE trade.

---

## Phase 5: Expiration & Settlement Engine

### Step 8: Payoff Evaluation (The "EOD" Logic)
Calculate the final PnL based on the settlement price.
* **Task:** Create a payoff function for expiration.
* **Implementation:**
    * `Intrinsic_Short = max(0, Strike_Short - S_settle)` (for Puts).
    * `Intrinsic_Long = max(0, Strike_Long - S_settle)` (for Puts).
    * `Payoff = Net_Credit - max(0, Intrinsic_Short - Intrinsic_Long)`.
* **Context:** Use the bar's `Close` or a more conservative `High/Low` breach as the settlement price.

### Step 9: Handling Intrabar Breaches (Conservative Model)
Account for the risk of being stopped out or assigned early.
* **Task:** Implement the "Conservative" mode from requirements.
* **Logic:** If `Low` (for puts) or `High` (for calls) breaches the `Strike_Short` during the bar, flag as ITM/Loss even if the `Close` recovers.

---

## Phase 6: VectorBT Integration

### Step 10: Mapping to VectorBT Arrays
Transform the synthetic PnL into a format VectorBT understands.
* **Task:** Produce a series of "Cash Flows" or "Returns".
* **Technique:** Since these are 0DTE, each entry bar has a corresponding exit at the end of the day.
* **Output:** A DataFrame where rows are timestamps and columns represent different parameter sets (deltas, vol windows).

### Step 11: Portfolio Simulation
Use VectorBT's performance engine to analyze the equity curve.
* **Task:** Initialize `vbt.Portfolio.from_signals` or use `vbt.Portfolio.from_orders` with custom PnL.
* **Key Metric:** Ensure "Capital Allocation" correctly accounts for `Width - Credit` as the margin requirement.

---

## Phase 7: Validation & Optimization

### Step 12: Sanity Check & Win-Rate Validation
Ensure the model adheres to the fundamental statistical assumption.
* **Task:** Assert that a 0.10 Delta strategy wins approximately 90% of the time in the simulation.
* **Action:** Compare `Actual_Win_Rate` vs `1 - Target_Delta`.

### Step 13: Parameter Grid Sweep
Utilize VectorBT's native multi-indexing for optimization.
* **Task:** Run the backtest across a range of:
    * `Short_Delta`: [0.10, 0.15, 0.20, 0.25]
    * `Long_Delta`: [0.01, 0.05]
    * `Vol_Window`: [10, 20, 50]
* **Output:** A heatmap of Expectancy or Sharpe Ratio.

---

## Final Deliverable Structure
The code should be structured as follows:
1. `class SyntheticOptionEngine`: Handles BS math and strike solving.
2. `class ZeroDTEBacktester`: Orchestrates data, entry signals, and payoff logic.
3. `analysis_notebook.ipynb`: Demonstrates parameter sweeps and visualization.
