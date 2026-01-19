export const profile = {
  name: "Jacob Mohan",
  title: "Agentic Developer",
  tagline: "Building intelligent systems with hands-on LLM experience.",
  location: "Bunnell, Fl",
  email: "jacobdmohan@gmail.com",
  phone: "386-624-8197",
  github: "https://github.com/Codingtheblocks",
  about: "I’m an agentic software developer who builds specification-driven AI systems using modern LLM tooling. My work focuses on turning clear requirements into robust, testable applications—spanning algorithmic trading engines, internal dashboards, and AI-integrated workflows.",
  skills: [
    "JavaScript (ES6+)", "Python", "React", "Vite", "Electron", "Node.js",
    "SQL", "ffmpeg", "WhisperX", "Gemini API", "RAG", "LLM Workflows"
  ]
};

const t2iPrompts = {
  p34: `A futuristic yet clean crypto trading dashboard UI on first launch. The layout is inspired by Raydium, GeckoTerminal, Gains.Trade, and TradeStation. The screen is structured with a clear modular wireframe:\n\nTop Nav Bar: Full-width, dark glassmorphic style with logo on the left, theme toggle, user wallet status, and settings button on the right.\n\nLeft Sidebar: Vertical panel for the token watchlist with scrolling capability. Each row displays token symbol, price, 24h change, and volume with small sparkline charts.\n\nMain Chart Area (center): Large real-time candlestick chart (like TradingView) with overlays and volume bars. Dropdown above for pair selection (e.g., ETH/USD). Indicator toggle bar above or side.\n\nRight Sidebar: Strategy insights panel — showing active bots, PnL graph, trade history, and toggle between logs / orders / performance.\n\nBottom Panel (dock-style): Strategy builder with tabbed or card view layout. Includes dropdowns for selecting strategy type, indicator configs, inputs for stop-loss/take-profit, start/backtest buttons, and model training toggles if ML is used.\n\nColor & Style: Dark background with neon glow accents (teal, violet, electric blue). 2xl rounded corners, soft shadows, crisp typography (Inter or Manrope). Floating tooltips and right-click context menus are visible on chart and strategy elements.\n\nOverall Aesthetic: Clean, modular, data-heavy but uncluttered. Minimal animations, hover highlights, and card-based design. Everything resizable with panel drag controls.`,
  p37: `A modern cryptocurrency trading dashboard UI blending dark neon aesthetics of Raydium, the clean data grids of GeckoTerminal, the minimalist layout of Gains.Trade, and the modular pane system of TradeStation. The interface features a dark background with subtle gradients and glowing accent colors (blues, purples, cyans). Top navbar with branding and theme toggle. Left sidebar showing a vertical watchlist of tokens with price change and volume info. Center panel displays a real-time candlestick chart with overlays and a strategy control toolbar beneath it. Right panel shows recent trades, active bots, and account balance. Bottom section includes a strategy builder with toggles, dropdowns, and a start/backtest button. Overall layout uses clean cards, soft shadows, rounded corners (2xl), and readable sans-serif fonts. Hover tooltips, minimal animations, and clear hierarchy. Inspired by fintech dashboards like TradingView, DeFi apps, and algorithmic trading platforms.`
};

const specsContent = {
  prompt1: `I know the challenges of getting ORATS options data and I'm budget constrained. I'm in the design and test phase for a backtester. I want to add realistic options backtesting using synthetic delta based backtesting using the Black Sholes model and just the OHLC chart data. We can make this work for hypothetical returns for spread strategies e.g. selling an a .20 delta put should have roughly an 80% odds. I want to design this as a synthetic replacement for 0 DTE backtesting. Since we won't have intrabar prices or tick level prices for the options chain and spreads well create well instead use the OHLC or the high/low of the bars well use. My current framework and strategy backtester is VectorBT. Write an extensive requirements document on how we can simulate these spreads for backtesting in vectorbt and generate the simulated return EOD is fine. I want the step by step document and technical requirements document to serve as an extensive source so if I had it to an LLM it'll have our full context form this chat now and understand our requirements and the order to build it in.`,

  response1: `# Synthetic Delta-Based Options Backtesting Requirements

## 1. Purpose & Scope

This document defines the **functional, mathematical, and technical requirements** for building a **synthetic options backtesting framework** using **only underlying OHLC data**, the **Black–Scholes model**, and **delta-based option selection**.

The system is explicitly designed as a **budget-conscious substitute for full options chain data (e.g., ORATS)** and is intended primarily for:

* **0 DTE (same-day expiration) options strategies**
* **Credit spreads and defined-risk strategies**
* **End-of-day (EOD) PnL evaluation**
* **Vectorized simulation using VectorBT**

This framework **does not attempt to perfectly replicate real option markets**. Instead, it aims to:

* Preserve **statistical realism** (probability of profit, convexity, volatility sensitivity)
* Maintain **internal consistency** across strategies
* Enable **robust research, comparison, and parameter sweeps**

The output should be **hypothetical but directionally and probabilistically correct**, suitable for **strategy discovery and relative ranking**, not precise execution-level modeling.

---

## 2. Design Constraints

### 2.1 Data Constraints

Available data:

* Underlying **OHLCV bars** (minute, 5m, 15m, 1h, or daily)
* No options chain
* No intrabar option price data
* No bid/ask spreads
* No order book

Unavailable data:

* Real option IV surface
* Skew/smile
* Gamma exposure by strike
* Intraday option pricing paths

### 2.2 Modeling Constraints

* Must be **fully vectorizable** in VectorBT
* Must avoid per-trade Python loops where possible
* Must be deterministic given a random seed (if randomness used)
* Must support **batch backtesting across many parameter sets**

---

## 3. Strategy Class Coverage

The system must support at minimum:

### 3.1 Core Strategy Types

* Short put (delta-based)
* Short call (delta-based)
* Put credit spread
* Call credit spread
* Iron condor (optional phase 2)

### 3.2 Strategy Characteristics

* 0 DTE entry (open → same-day expiry)
* Entry at bar open or bar close
* Exit at expiration (EOD)
* Cash-settled PnL

---

## 4. Conceptual Model

### 4.1 Fundamental Assumption

> **Delta ≈ probability of finishing ITM (for short-dated options)**

For example:

* A 0.20 delta put ≈ 80% probability of expiring OTM
* A 0.10 delta spread ≈ 90% probability

This assumption is the **core statistical anchor** of the system.

### 4.2 Synthetic Option Definition

Each synthetic option is defined by:

* Strike (derived from delta)
* Expiry (same day)
* Implied volatility (estimated)
* Direction (call/put)
* Position (long/short)

The option **never trades intraday**. Only its **final payoff at expiration** is evaluated.

---

## 5. Implied Volatility Estimation

### 5.1 IV Proxy Methods (Configurable)

At least one must be implemented; others optional:

1. **Rolling realized volatility**

   * Based on past N bars
   * Annualized

2. **ATR-based volatility proxy**

   * ATR / price

3. **Regime-scaled volatility**

   * Vol multiplied by regime factor (e.g., VIX proxy, trend filter)

### 5.2 Default Requirement

* IV must be **constant across strikes** (flat IV surface)
* Skew is **ignored** in v1

---

## 6. Delta-to-Strike Mapping

### 6.1 Core Requirement

Given:

* Spot price S
* Time to expiry T (in years)
* Risk-free rate r (can be 0)
* Implied volatility σ
* Target delta Δ

We must **solve for strike K** using Black–Scholes.

### 6.2 Method

* Use **inverse delta formulation** of Black–Scholes
* Alternatively, solve numerically for K such that BS_delta(S, K, T, σ) ≈ target Δ

This must be:

* Vectorized
* Stable for near-zero T

---

## 7. Spread Construction Logic

### 7.1 Credit Spread Definition

A spread consists of:

* Short leg at Δ_short (e.g., 0.20)
* Long leg at Δ_long (e.g., 0.05)

Both legs:

* Same expiry
* Same underlying
* Same IV

### 7.2 Width Calculation

Width = |K_short − K_long|

Used for:

* Max loss
* Capital allocation

---

## 8. Premium Estimation

### 8.1 Synthetic Premium Model

Premium is **not mark-to-market**. It is estimated once at entry.

Methods:

1. **Black–Scholes theoretical price**

   * Using S, K, T, σ

2. Optional simplification:

   * Premium ≈ f(delta, IV, time)

### 8.2 Credit Spread Premium

Net credit:

Credit = Premium_short − Premium_long

---

## 9. Expiration Payoff Logic

### 9.1 Underlying Settlement Price

Settlement price must be one of:

* Bar close price
* Bar VWAP (if available)
* Bar midpoint of High/Low

### 9.2 Option Payoff

At expiration:

* Short put ITM if price < K
* Short call ITM if price > K

Payoff per leg:

* OTM: 0
* ITM: |Settlement − Strike|

### 9.3 Spread PnL

PnL = Credit − min(Width, ITM distance)

---

## 10. Handling OHLC Uncertainty

Because intrabar paths are unknown:

### 10.1 Conservative Fill Rules (Configurable)

For short options:

* If **High/Low breaches strike**, treat as ITM
* Optional probabilistic breach model:

  * Use relative distance vs bar range

### 10.2 Modes

* Optimistic (close-only)
* Conservative (high/low based)
* Probabilistic (future phase)

---

## 11. VectorBT Architecture

### 11.1 Data Inputs

* price: pd.Series or DataFrame
* volatility proxy series
* signals: entry masks

### 11.2 Core Outputs

For each bar:

* Strike_short
* Strike_long
* Credit
* Max_loss
* Expired_ITM (bool)
* PnL

### 11.3 Portfolio Integration

PnL feeds into:

* vectorbt.Portfolio.from_signals
* Custom cash-flow simulation

---

## 12. Capital & Risk Modeling

### 12.1 Capital Allocation

Each spread requires:

* Capital = Width − Credit

### 12.2 Constraints

* Max % capital per trade
* Max concurrent trades
* Regime filter enable/disable

---

## 13. Performance Metrics

Must compute:

* Win rate (expected ≈ 1 − delta)
* Expectancy
* Max drawdown
* Tail loss frequency
* Return on capital
* Distribution of outcomes

---

## 14. Validation Requirements

### 14.1 Sanity Checks

* 0.10 delta strategies win ≈ 90% of time
* Wider spreads reduce variance
* Higher IV increases credit but tail loss

### 14.2 Sensitivity Tests

* Change IV ±20%
* Change settlement rule
* Change bar resolution

---

## 15. Explicit Non-Goals

This system does NOT attempt to:

* Reproduce exact option prices
* Model bid/ask spreads
* Capture gamma scalping
* Model intraday adjustments

---

## 16. Build Order (Critical)

1. OHLC → volatility proxy
2. Delta → strike solver
3. BS premium calculator
4. Expiration payoff engine
5. Spread PnL aggregation
6. VectorBT integration
7. Parameter grid testing

---

## 17. Intended Use

This framework is intended for:

* Strategy research
* Relative comparison
* Hypothesis testing
* Regime discovery

Not for live execution calibration.

---

## 18. Future Extensions (Optional)

* Skew modeling
* Intrabar Monte Carlo paths
* Gamma-based breach probability
* Multi-day DTE
* Early exit heuristics

---

## 19. Summary

This document defines a **fully self-contained, delta-driven synthetic options backtesting system** that is:

* Feasible without paid options data
* Vectorizable
* Statistically grounded
* Explicit about assumptions

It is suitable to be handed directly to an LLM or developer as **full implementation context**.`,

  prompt2: `create an ordered step-by-step list in this folder C:\\Users\\jacob\\Desktop\\Jacob Mohan Portfolio\\ai-specs for how youd implment this synthetic delta based options backtesting framework here C:\\Users\\jacob\\Desktop\\Jacob Mohan Portfolio\\ai-specs\\model-response.md. I want the step-by-step list to give full context and show all the required steps so I could hand it off to an AI LLM or developer and they could follow each step in order and have it fully functional options backtest engine in VectorBT.`,

  response2: `# Implementation Plan: Synthetic Delta-Based Options Backtesting in VectorBT

This document provides a step-by-step technical roadmap for implementing the synthetic options backtesting framework defined in \`model-response.md\`. This plan is designed for an LLM or developer to follow sequentially to produce a fully functional, vectorized backtesting engine.

---

## Phase 1: Environment & Data Preparation

### Step 1: Python Environment Setup
Install the core dependencies required for vectorized financial analysis and Black-Scholes calculations.
* **Task:** Initialize a Python environment (e.g., conda or venv).
* **Dependencies:** \`vectorbtpro\` (or \`vectorbt\`), \`numpy\`, \`pandas\`, \`scipy\`, \`numba\` (for speed).
* **Context:** VectorBT is the primary engine; Scipy will be used for the cumulative distribution function (CDF) and its inverse (PPF) in Black-Scholes.

### Step 2: Data Loading & Pre-processing
Load the underlying OHLCV data that will serve as the foundation.
* **Task:** Load a CSV or parquet file of underlying data (e.g., SPY 1-minute or 5-minute bars).
* **Requirements:** 
    * Ensure the index is datetime-aware.
    * Handle missing bars (forward-fill or drop).
    * Standardize column names: \`Open\`, \`High\`, \`Low\`, \`Close\`, \`Volume\`.

---

## Phase 2: Core Mathematical Engine

### Step 3: Implement Volatility Proxy (IV Estimation)
Since we lack real options IV data, we must estimate a "synthetic IV" from the underlying price action.
* **Task:** Create a function/class to calculate rolling volatility.
* **Implementation:** 
    * Calculate log returns.
    * Compute rolling standard deviation over a window (e.g., 20 periods).
    * Annualize the result: \`vol * sqrt(annual_periods)\`.
* **Context:** This "Proxy IV" will be the \`sigma\` input for Black-Scholes.

### Step 4: Vectorized Black-Scholes Functions
Implement the basic Black-Scholes functions using Numpy/Scipy for speed.
* **Task:** Create \`bs_price(S, K, T, sigma, r, type)\` and \`bs_delta(S, K, T, sigma, r, type)\`.
* **Constraints:** Must be fully vectorized (operate on Numpy arrays).
* **Context:** Use \`scipy.stats.norm.cdf\` for delta and pricing.

---

## Phase 3: Synthetic Option Selection Logic

### Step 5: Delta-to-Strike Solver (The "Heart")
Convert a target Delta (e.g., 0.20) into a specific Strike Price $K$.
* **Task:** Create a function \`delta_to_strike(S, delta, T, sigma, r, type)\`.
* **Implementation:** 
    * Use the inverse of the BS Delta formula. 
    * For Put Delta: $d_1 = \Phi^{-1}(\Delta)$. Since $d_1 = \\frac{\\ln(S/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt{T}}$, solve for $K$:
        $K = S \\cdot \\exp(-d_1 \\sigma \\sqrt{T} + (r + \\sigma^2/2)T)$.
* **Context:** This allows "delta-based" entry without an options chain.

### Step 6: Synthetic Premium Estimation
Calculate the "Entry Credit" for the selected strike.
* **Task:** Calculate the theoretical premium at the moment of entry.
* **Implementation:** Use the \`bs_price\` function with the Strike $K$ solved in Step 5.
* **Context:** Even if we don't trade intraday, we need this to establish the initial PnL potential.

---

## Phase 4: Strategy Construction (Spreads)

### Step 7: Credit Spread Logic
Combine two synthetic options into a single tradeable unit.
* **Task:** Define logic for "Short Leg" and "Long Leg".
* **Inputs:** \`Delta_Short\` (e.g., 0.20) and \`Delta_Long\` (e.g., 0.05).
* **Outputs:** 
    * \`Strike_Short\`, \`Strike_Long\`.
    * \`Net_Credit = Premium_Short - Premium_Long\`.
    * \`Width = |Strike_Short - Strike_Long|\`.
* **Context:** This defines the risk/reward profile of each 0DTE trade.

---

## Phase 5: Expiration & Settlement Engine

### Step 8: Payoff Evaluation (The "EOD" Logic)
Calculate the final PnL based on the settlement price.
* **Task:** Create a payoff function for expiration.
* **Implementation:**
    * \`Intrinsic_Short = max(0, Strike_Short - S_settle)\` (for Puts).
    * \`Intrinsic_Long = max(0, Strike_Long - S_settle)\` (for Puts).
    * \`Payoff = Net_Credit - max(0, Intrinsic_Short - Intrinsic_Long)\`.
* **Context:** Use the bar's \`Close\` or a more conservative \`High/Low\` breach as the settlement price.

### Step 9: Handling Intrabar Breaches (Conservative Model)
Account for the risk of being stopped out or assigned early.
* **Task:** Implement the "Conservative" mode from requirements.
* **Logic:** If \`Low\` (for puts) or \`High\` (for calls) breaches the \`Strike_Short\` during the bar, flag as ITM/Loss even if the \`Close\` recovers.

---

## Phase 6: VectorBT Integration

### Step 10: Mapping to VectorBT Arrays
Transform the synthetic PnL into a format VectorBT understands.
* **Task:** Produce a series of "Cash Flows" or "Returns".
* **Technique:** Since these are 0DTE, each entry bar has a corresponding exit at the end of the day.
* **Output:** A DataFrame where rows are timestamps and columns represent different parameter sets (deltas, vol windows).

### Step 11: Portfolio Simulation
Use VectorBT's performance engine to analyze the equity curve.
* **Task:** Initialize \`vbt.Portfolio.from_signals\` or use \`vbt.Portfolio.from_orders\` with custom PnL.
* **Key Metric:** Ensure "Capital Allocation" correctly accounts for \`Width - Credit\` as the margin requirement.

---

## Phase 7: Validation & Optimization

### Step 12: Sanity Check & Win-Rate Validation
Ensure the model adheres to the fundamental statistical assumption.
* **Task:** Assert that a 0.10 Delta strategy wins approximately 90% of the time in the simulation.
* **Action:** Compare \`Actual_Win_Rate\` vs \`1 - Target_Delta\`.

### Step 13: Parameter Grid Sweep
Utilize VectorBT's native multi-indexing for optimization.
* **Task:** Run the backtest across a range of:
    * \`Short_Delta\`: [0.10, 0.15, 0.20, 0.25]
    * \`Long_Delta\`: [0.01, 0.05]
    * \`Vol_Window\`: [10, 20, 50]
* **Output:** A heatmap of Expectancy or Sharpe Ratio.

---

## Final Deliverable Structure
The code should be structured as follows:
1. \`class SyntheticOptionEngine\`: Handles BS math and strike solving.
2. \`class ZeroDTEBacktester\`: Orchestrates data, entry signals, and payoff logic.
3. \`analysis_notebook.ipynb\`: Demonstrates parameter sweeps and visualization.`,

  prompt3: `I asked an AI coding agent to create a developer step by step doc so any AI LLM could code the project if it follows it in order and this is the plan it made. Is there anything you would change or is this good?`,

  response3: `Short answer: this is a very solid plan and is absolutely “good enough” for an AI coding agent to implement a working system.
Long answer: there are a few important corrections, clarifications, and upgrades I would strongly recommend so you don’t accidentally bake in silent errors or limit realism later.

Below I’ll give you:

Overall verdict

Critical fixes (must-change)

Structural improvements (should-change)

Optional enhancements (nice-to-have)

A cleaned-up “v2” mental model of the build order

I’ll be very explicit so you can decide what to keep.

1. Overall Verdict

✅ Yes, this plan is fundamentally good
✅ It is logically ordered
✅ It matches the requirements doc you had me write
✅ An LLM could absolutely code a first working version from this

However…

⚠️ There are 3 critical mathematical / modeling pitfalls
⚠️ There are 2 VectorBT integration risks
⚠️ There is 1 conceptual mismatch with 0DTE reality

None of these invalidate the plan — but fixing them now will save you weeks later.

2. Critical Fixes (Must Change)
🔴 Fix #1: Delta-to-strike formula is incomplete / misleading

Your Step 5 says:

For Put Delta: d1 = Φ⁻¹(Δ)

This is not universally correct unless you are very explicit about sign conventions.

The real issue

Black–Scholes delta conventions:

Call delta ∈ (0, 1)

Put delta ∈ (−1, 0)

But most traders quote absolute delta for puts (e.g. “20 delta put” = −0.20).

Required clarification (must be added)

You must define:

Target_Delta_Abs ∈ (0, 1)
Put_Delta = -Target_Delta_Abs
Call_Delta = +Target_Delta_Abs


Then:

d1 = norm.ppf(Put_Delta + 1)  # or norm.ppf(Call_Delta)


Or explicitly:

Put: Φ(d1) - 1 = Δ

Call: Φ(d1) = Δ

➡️ Without this clarification, an LLM will get strikes wrong by miles.

🔴 Fix #2: Near-zero T numerical stability (0DTE killer)

Your plan treats:

T = time_to_expiry_in_years


For 0DTE, T might be:

1 bar

Minutes

Seconds

Problem

Black–Scholes blows up numerically as:

sigma * sqrt(T) → 0

Required addition

You must add a minimum effective T floor, e.g.:

T_eff = max(T, 1 / 252 / 6.5)  # minimum ~10 minutes


or

T_eff = max(T, T_min)


This is not a hack — every professional options simulator does this.

➡️ This is essential for 0DTE viability.

🔴 Fix #3: Payoff logic incorrectly described for spreads

Your Step 8 says:

Payoff = Net_Credit - max(0, Intrinsic_Short - Intrinsic_Long)


This is directionally correct, but dangerously underspecified.

You must explicitly cap loss:

Loss = min(Width, max(0, Intrinsic_Short - Intrinsic_Long))
PnL = Net_Credit - Loss


Otherwise an LLM might accidentally allow losses > width.

3. Structural Improvements (Strongly Recommended)
🟠 Improvement #1: Separate “Strike Solver” from “Delta Logic”

Right now delta logic and BS math are blended.

Better abstraction:

solve_strike_from_delta(...)

bs_price_given_strike(...)

Why this matters:

Lets you swap delta → strike logic later (empirical mapping, skew)

Prevents coupling bugs

Add this explicitly to the plan.

🟠 Improvement #2: Explicit Settlement Price Policy

You vaguely say:

Use the bar's Close or a more conservative High/Low

This is too ambiguous for an LLM.

You should define an enum-style policy:

SettlementMode:
- CLOSE
- MID_HL
- WORST_CASE


With exact definitions.

This is huge for research consistency.

🟠 Improvement #3: VectorBT integration should avoid from_signals

For this use case:

❌ Portfolio.from_signals (not ideal)
✅ Portfolio.from_orders or custom cash-flow series

Why?

You’re not trading an asset

You’re injecting known PnL at EOD

You should explicitly say:

Prefer from_orders with synthetic cash flows OR manual equity curve

Otherwise an LLM may force-fit signals incorrectly.

4. Optional Enhancements (Nice-to-Have but Powerful)
🟡 Enhancement #1: Probabilistic Intrabar Breach (Phase 2)

You mention conservative mode — good.

Later you should add:

Breach_Probability = f(
    distance_to_strike / bar_range,
    delta,
    sigma
)


This lets you:

Blend optimistic & pessimistic assumptions

Avoid binary over-punishment

Even if not implemented now, mention it as a hook.

🟡 Enhancement #2: Regime-scaled IV

You already hint at this in the requirements doc.

Add explicitly:

Effective_IV = IV * Regime_Multiplier


This matters a LOT for 0DTE realism.

5. Clean “V2” Mental Model (Recommended Order)

If I were handing this to a very strong LLM, I’d want it to think in this order:

Volatility proxy

Effective time-to-expiry (with floor)

Delta → strike solver (sign-safe)

BS premium

Spread construction

Settlement price policy

Loss capping

PnL injection

VectorBT analytics

Statistical validation

Your plan already mostly does this — it just needs the guardrails above.

Final Verdict
Is this plan good?

Yes. Absolutely.

Would I change anything?

Yes — but only to prevent silent, expensive mistakes.`,

  finalPlan: `# Final Implementation Plan: Synthetic Delta-Based 0DTE Options Backtester (v2)

This document provides the finalized, implementation-grade roadmap for building a synthetic options backtesting engine in VectorBT. It incorporates critical mathematical guardrails and architectural improvements to ensure numerical stability and statistical realism.

---

## Phase 1: Environment & Data Preparation

### Step 1: Python Environment Setup
* **Task:** Initialize environment with \`vectorbtpro\`, \`numpy\`, \`pandas\`, \`scipy\`, and \`numba\`.
* **Context:** \`scipy.stats.norm\` is required for Black-Scholes CDF/PPF functions. Numba is recommended for speed in vectorized loops.

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
    * **Regime Scaling:** Implement \`Effective_IV = Realized_IV * Regime_Multiplier\` (e.g., using a VIX proxy or ATR-based regime filter).
* **Output:** A series of \`sigma\` values for the BS engine.

### Step 4: Numerical Stability (The T-Floor)
* **Task:** Implement a safe time-to-expiry calculation.
* **Logic:** Black-Scholes numerical stability fails as $T \to 0$.
* **Implementation:** 
    \`T_eff = max(T_calculated, 1 / (252 * 6.5 * 60))\` (Floor at 1 minute or ~10 minutes).
* **Context:** Essential for 0DTE trades entering late in the session.

---

## Phase 3: Selection Logic (Delta-to-Strike)

### Step 5: Sign-Aware Delta Solver
* **Task:** Convert absolute target delta (e.g., 0.20) to a specific strike $K$.
* **Critical Fix:** Define explicit delta conventions:
    * **Calls:** $\Delta \in (0, 1)$. Formula: $\Phi(d_1) = \Delta_{target}$.
    * **Puts:** $\Delta \in (-1, 0)$. Formula: $\Phi(d_1) - 1 = \Delta_{target}$ (where $\Delta_{target}$ is negative, e.g., -0.20).
* **Function:** \`solve_strike_from_delta(S, delta, T_eff, sigma, r)\`
* **Abstraction:** Keep this function separate from the pricing logic to allow for future skew modeling.

### Step 6: Synthetic Premium Estimation
* **Task:** Calculate theoretical credit at entry using the solved strike.
* **Function:** \`bs_price_given_strike(S, K, T_eff, sigma, r, type)\`

---

## Phase 4: Strategy & Spread Construction

### Step 7: Credit Spread Logic
* **Task:** Define the "Short Leg" and "Long Leg" parameters.
* **Logic:** 
    * \`Net_Credit = Premium_Short - Premium_Long\`
    * \`Width = |Strike_Short - Strike_Long|\`
* **Output:** A data structure (or multi-indexed DataFrame) containing Entry Price, Strikes, Credit, and Max Risk per trade.

---

## Phase 5: Settlement & Payoff Engine

### Step 8: Explicit Settlement Policy
* **Task:** Define how "Expiration Price" ($S_{settle}$) is calculated.
* **Enum Policy:**
    * \`CLOSE\`: Settlement at bar close.
    * \`MID_HL\`: Average of High and Low.
    * \`WORST_CASE\`: Low for Puts, High for Calls (Conservative).
* **Context:** This ensures research consistency across different risk appetites.

### Step 9: Capped Payoff Logic
* **Task:** Calculate final PnL per trade, ensuring no "infinite" losses or gains.
* **Logic:**
    1. \`Intrinsic_Short = max(0, Strike_Short - S_settle)\` (for Puts)
    2. \`Intrinsic_Long = max(0, Strike_Long - S_settle)\` (for Puts)
    3. \`Raw_Loss = max(0, Intrinsic_Short - Intrinsic_Long)\`
    4. \`Final_Loss = min(Width, Raw_Loss)\`
    5. **\`PnL = Net_Credit - Final_Loss\`**

---

## Phase 6: VectorBT Integration

### Step 10: Cash-Flow Injection (Avoid from_signals)
* **Task:** Map the calculated PnL into VectorBT.
* **Technique:** Do **not** use \`Portfolio.from_signals\`. Instead, use:
    * \`vbt.Portfolio.from_orders\` with custom cash flows.
    * OR manually construct an equity curve from the trade-level PnL series.
* **Reasoning:** 0DTE options are "cash-settled" instruments; you are not buying/selling the underlying shares, just injecting EOD cash flows.

### Step 11: Capital & Margin Requirements
* **Task:** Calculate margin required per trade.
* **Margin:** \`Required_Capital = Width - Net_Credit\`.
* **Context:** Use this to scale position sizing within VectorBT.

---

## Phase 7: Validation & Refinement

### Step 12: Statistical Sanity Check
* **Task:** Validate Win Rate vs. Delta.
* **Assertion:** A 20-delta strategy should win ~80% of the time. If the win rate is significantly different, re-check the Settlement Policy and Delta Sign conventions.

### Step 13: Optional Enhancements Hook
* **Probabilistic Breach:** Implement a "Phase 2" hook where settlement isn't binary ITM/OTM but includes a probability of breach based on \`Distance_to_Strike / Bar_Range\`.
* **Parameter Sweep:** Use VectorBT's \`vbt.Param\` to grid search:
    * \`Short_Delta\` (0.05 to 0.30)
    * \`Spread_Width\` (Fixed points vs % of Spot)
    * \`Vol_Window\` (10 to 60 periods)\`.`
};

export const projects = [
  {
    id: "t2i-dashboard",
    title: "T2I Trading Dashboard",
    category: "Fintech / UI Design",
    thumbnail: "projects/t2i/dashbaord_final.JPG",
    description: "End-to-end design and engineering of a custom trading dashboard using Electron and Gains.trade API.",
    details: {
      story: "This project started with a vision for a comprehensive trading interface. Using a text-to-image implementation workflow, I iterated on the design using AI prompts before building the final electron application.",
      tech: ["Electron", "React", "Node.js", "Gains.trade API", "TwelveData"],
      gallery: [
        {
          type: "Phase 1",
          title: "Prompt Iteration 1",
          align: "left",
          image: "projects/t2i/Image_fx (34).jpg",
          text: "Initial Concept Generation: Defining the modular wireframe and data density. I started by asking for a layout inspired by Raydium and TradeStation.",
          visualContent: t2iPrompts.p34, // Full text for modal
          textContent: t2iPrompts.p34 // Also allow reading prompt from text side
        },
        {
          type: "Phase 2",
          title: "Refining Aesthetics",
          align: "right",
          image: "projects/t2i/Image_fx (35).jpg",
          text: "Refining the layout with neon glow accents and glassmorphic styles. I pushed for a darker, more premium look.",
          visualContent: t2iPrompts.p34, // Similar prompt
          textContent: t2iPrompts.p34
        },
        {
          type: "Phase 3",
          title: "Alternative Concepts",
          align: "left",
          image: "projects/t2i/Image_fx (37).jpg",
          text: "Exploring a more 'DeFi' aesthetic with rounded cards and softer shadows.",
          visualContent: t2iPrompts.p37,
          textContent: t2iPrompts.p37
        },
        {
          type: "Final Build",
          title: "Production Implementation",
          align: "center",
          image: "projects/t2i/dashbaord_final.JPG",
          text: "The final application delivered a pixel-perfect implementation of the generated designs, complete with real-time WebSocket data feeds and a fully functional backtesting interface.",
          visualContent: "Full tech stack: Electron, React, Node, Gains SDK..."
        }
      ]
    }
  },
  {
    id: "viral-automation",
    title: "Viral Automation Workflow",
    category: "Automation / AI",
    thumbnail: "projects/viral/finalvideo.JPG",
    description: "Interactive CLI workflow automating YouTube to TikTok video clipping with AI transcription.",
    details: {
      story: "A Python-based automation tool that takes long-form content and converts it into viral short-form clips using WhisperX for transcription and Gemini API for trend analysis.",
      tech: ["Python", "ffmpeg", "WhisperX", "Gemini API", "CLI"],
      gallery: [
        {
          type: "Step 1",
          title: "CLI Initialization",
          image: "projects/viral/step1.JPG",
          text: "The workflow begins by initializing the video processing engine."
        },
        {
          type: "Step 2",
          title: "Segment Analysis",
          image: "projects/viral/step2.JPG",
          text: "The AI analyzes video segments and timestamps for viral potential."
        },
        {
          type: "Step 3",
          title: "Transcription",
          image: "projects/viral/step3.JPG",
          text: "Generating frame-perfect subtitles using WhisperX."
        },
        {
          type: "Final Output",
          title: "Rendered Clip",
          image: "projects/viral/finalvideo.JPG",
          text: "Final Output: A trendy, captioned short video ready for upload."
        }
      ]
    }
  },
  {
    id: "specs-ai",
    title: "Specs Driven AI Dev",
    category: "AI Engineering",
    thumbnail: "projects/specs/specsdriven.JPG",
    description: "Agentic workflow for generating robust technical specifications via AI chat iterations.",
    details: {
      story: "A meta-project demonstrating how to collaborate with LLMs to produce implementation-grade specifications. This process ensures high-quality code generation and architectural soundness.",
      tech: ["LLM Agents", "RAG", "Prompt Engineering"],
      gallery: [
        {
          type: "Step 1",
          title: "User Idea & Constraints",
          align: "left",
          visualType: "text-card",
          visualContent: specsContent.response1,
          text: "Initial prompting for budget-conscious options backtesting. I provided specific constraints about using VectorBT and lacking ORATS data.",
          textContent: specsContent.prompt1
        },
        {
          type: "Step 2",
          title: "Implementation Planning",
          align: "left",
          visualType: "text-card",
          visualContent: specsContent.response2,
          text: "Asking the agent to break down the first draft into a step-by-step execution plan for an engineer.",
          textContent: specsContent.prompt2
        },
        {
          type: "Step 3",
          title: "Agentic Critique",
          align: "left",
          visualType: "text-card",
          visualContent: specsContent.response3,
          text: "Self-correction phase. I asked a secondary agent to critique the plan, which identified critical numerical stability issues with 0DTE options.",
          textContent: specsContent.prompt3
        },
        {
          type: "Final Artifact",
          title: "The Master Plan",
          align: "center",
          visualType: "text-card",
          visualContent: specsContent.finalPlan,
          text: "The comprehensive implementation guide (Markdown) covering Phase 1 to Phase 7, ready for code generation.",
          textContent: null
        }
      ]
    }
  }
];
