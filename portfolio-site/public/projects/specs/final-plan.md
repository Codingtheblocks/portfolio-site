# Final Implementation Plan: Synthetic Delta-Based 0DTE Options Backtester (v2)

This document provides the finalized, implementation-grade roadmap for building a synthetic options backtesting engine in VectorBT. It incorporates critical mathematical guardrails and architectural improvements to ensure numerical stability and statistical realism.

---

## Phase 1: Environment & Data Preparation

### Step 1: Python Environment Setup
* **Task:** Initialize environment with `vectorbtpro`, `numpy`, `pandas`, `scipy`, and `numba`.
* **Context:** `scipy.stats.norm` is required for Black-Scholes CDF/PPF functions. Numba is recommended for speed in vectorized loops.

### Step 2: Data Groundwork
* **Task:** Load underlying OHLCV data.
* **Requirements:** 
    * Datetime index.
    * Forward-fill missing bars to maintain continuous time-to-expiry (T) calculations.
    * Minimum resolution: 1-minute or 5-minute bars for 0DTE.

---

## Phase 2: Core Mathematical Engine & Stability

### Step 3: Volatility Proxy & Scaling
* **Task:** Calculate annualized rolling realized volatility.
* **Enhancements:**
    * **Regime Scaling:** Implement `Effective_IV = Realized_IV * Regime_Multiplier` (e.g., using a VIX proxy or ATR-based regime filter).
* **Output:** A series of `sigma` values for the BS engine.

### Step 4: Numerical Stability (The T-Floor)
* **Task:** Implement a safe time-to-expiry calculation.
* **Logic:** Black-Scholes numerical stability fails as $T \to 0$.
* **Implementation:** 
    `T_eff = max(T_calculated, 1 / (252 * 6.5 * 60))` (Floor at 1 minute or ~10 minutes).
* **Context:** Essential for 0DTE trades entering late in the session.

---

## Phase 3: Selection Logic (Delta-to-Strike)

### Step 5: Sign-Aware Delta Solver
* **Task:** Convert absolute target delta (e.g., 0.20) to a specific strike $K$.
* **Critical Fix:** Define explicit delta conventions:
    * **Calls:** $\Delta \in (0, 1)$. Formula: $\Phi(d_1) = \Delta_{target}$.
    * **Puts:** $\Delta \in (-1, 0)$. Formula: $\Phi(d_1) - 1 = \Delta_{target}$ (where $\Delta_{target}$ is negative, e.g., -0.20).
* **Function:** `solve_strike_from_delta(S, delta, T_eff, sigma, r)`
* **Abstraction:** Keep this function separate from the pricing logic to allow for future skew modeling.

### Step 6: Synthetic Premium Estimation
* **Task:** Calculate theoretical credit at entry using the solved strike.
* **Function:** `bs_price_given_strike(S, K, T_eff, sigma, r, type)`

---

## Phase 4: Strategy & Spread Construction

### Step 7: Credit Spread Logic
* **Task:** Define the "Short Leg" and "Long Leg" parameters.
* **Logic:** 
    * `Net_Credit = Premium_Short - Premium_Long`
    * `Width = |Strike_Short - Strike_Long|`
* **Output:** A data structure (or multi-indexed DataFrame) containing Entry Price, Strikes, Credit, and Max Risk per trade.

---

## Phase 5: Settlement & Payoff Engine

### Step 8: Explicit Settlement Policy
* **Task:** Define how "Expiration Price" ($S_{settle}$) is calculated.
* **Enum Policy:**
    * `CLOSE`: Settlement at bar close.
    * `MID_HL`: Average of High and Low.
    * `WORST_CASE`: Low for Puts, High for Calls (Conservative).
* **Context:** This ensures research consistency across different risk appetites.

### Step 9: Capped Payoff Logic
* **Task:** Calculate final PnL per trade, ensuring no "infinite" losses or gains.
* **Logic:**
    1. `Intrinsic_Short = max(0, Strike_Short - S_settle)` (for Puts)
    2. `Intrinsic_Long = max(0, Strike_Long - S_settle)` (for Puts)
    3. `Raw_Loss = max(0, Intrinsic_Short - Intrinsic_Long)`
    4. `Final_Loss = min(Width, Raw_Loss)`
    5. **`PnL = Net_Credit - Final_Loss`**

---

## Phase 6: VectorBT Integration

### Step 10: Cash-Flow Injection (Avoid from_signals)
* **Task:** Map the calculated PnL into VectorBT.
* **Technique:** Do **not** use `Portfolio.from_signals`. Instead, use:
    * `vbt.Portfolio.from_orders` with custom cash flows.
    * OR manually construct an equity curve from the trade-level PnL series.
* **Reasoning:** 0DTE options are "cash-settled" instruments; you are not buying/selling the underlying shares, just injecting EOD cash flows.

### Step 11: Capital & Margin Requirements
* **Task:** Calculate margin required per trade.
* **Margin:** `Required_Capital = Width - Net_Credit`.
* **Context:** Use this to scale position sizing within VectorBT.

---

## Phase 7: Validation & Refinement

### Step 12: Statistical Sanity Check
* **Task:** Validate Win Rate vs. Delta.
* **Assertion:** A 20-delta strategy should win ~80% of the time. If the win rate is significantly different, re-check the Settlement Policy and Delta Sign conventions.

### Step 13: Optional Enhancements Hook
* **Probabilistic Breach:** Implement a "Phase 2" hook where settlement isn't binary ITM/OTM but includes a probability of breach based on `Distance_to_Strike / Bar_Range`.
* **Parameter Sweep:** Use VectorBT's `vbt.Param` to grid search:
    * `Short_Delta` (0.05 to 0.30)
    * `Spread_Width` (Fixed points vs % of Spot)
    * `Vol_Window` (10 to 60 periods)
