# Synthetic Delta-Based Options Backtesting Requirements

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

It is suitable to be handed directly to an LLM or developer as **full implementation context**.
I’ve created a full, implementation-grade requirements document in the canvas that captures everything needed to build a synthetic, delta-based 0DTE options backtester in VectorBT under real-world data constraints.

Why this document works well for your use case

LLM-ready: It’s structured so you can hand it to another LLM and it will immediately understand:

The why (budget + ORATS constraints)

The what (delta-based synthetic spreads)

The how (math, payoff logic, VectorBT architecture)

The order of operations (build sequence)

Explicit assumptions: No hidden realism traps—every simplification is documented

Statistically grounded: Delta ≈ probability framing is front and center

VectorBT-compatible: No per-trade loops, EOD cash-settled mindset

Correct mental model for 0DTE: Focuses on payoff distribution, not intraday option price fantasy

Key strengths of this approach (important for your confidence)

You are not trying to “fake” option prices

You are modeling payoff distributions, which is exactly what matters for:

Short premium

Spread expectancy

Tail risk frequency

This is much closer to how professional research desks prototype ideas before paying for data

Where this will shine especially well

Ranking:

Delta pairs (0.15/0.05 vs 0.20/0.10)

Volatility regimes

Entry timing rules

Stress testing:

Conservative vs optimistic OHLC assumptions

IV sensitivity

Discovering robust strategy shapes, not curve-fit executions