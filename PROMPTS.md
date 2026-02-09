# BullCheck – PROMPTS.md

This document describes how AI-assisted development was used to build **BullCheck**, including prompting strategy, architectural reasoning, and key challenges encountered during development.

Rather than listing every prompt verbatim, this file focuses on representative prompts and the reasoning behind them. The goal was to use AI as a collaborative engineering partner: first for exploration and design, then for structured implementation once decisions were finalized.

---

## Development Approach

My typical workflow:

1. **Design the frontend first** to clearly understand the UX and interaction flow.
2. **Design backend and data flow** once the UX is clear.
3. Use AI in two modes:
   - **Exploratory mode** for architecture and design discussions
   - **Deterministic implementation mode** once decisions are finalized

This approach prevents unintended architectural decisions while still benefiting from AI speed and creativity.

---

## Frontend

When prompting for the frontend, I initially give the AI a high degree of creative freedom. This tends to produce stronger visual concepts and layout ideas. I then iteratively refine the result to match my vision.

I start by providing context about the product and its purpose. The more context the agent has, the better the design output tends to be.

### Example Prompt (Frontend)

> “Hey, I am building an AI chatbot called BullCheck that answers user questions solely using data from trusted statistical databases.
>
> Let’s start by building the start page for the chat UI. I want a dark theme that blends well with the brand logo (see logo.png in the assets folder).
>
> In the upper middle of the page, display the logo. Under it, add the label: ‘Committed to the truth, the whole truth, and nothing but the truth.’
>
> Below that, the user should be able to enter their question. Let’s start there.
>
> Make the most polished site you can. Feel free to be creative with design and animations. Write clean, well-structured code and follow best practices.”

After generating the initial version, I iterated manually and with AI. For example, I later switched from a dark theme to a light theme after evaluating UX and branding.

---

## Backend

### Architecture Design

For backend work, I use AI more like a technical collaborator. In a separate session, I discuss architecture, data flow, and trade-offs before implementation begins. This mirrors how I would work with a colleague: propose a design, evaluate pros and cons, then refine.

In this phase, we decide on infrastructure, orchestration, and tooling.

### Example Architecture Prompt

> “I am building an AI-powered chatbot that answers user questions solely using data from trusted statistical databases. The stack will be hosted on Cloudflare.
>
> Proposed stack:
>
> - SvelteKit hosted on Cloudflare Workers
> - Tailwind CSS
> - Better Auth for authentication
> - Cloudflare Agent SDK for agent orchestration
> - Cloudflare AI Gateway for caching, rate limiting, and token tracking
> - Cloudflare KV for API response caching
> - Cloudflare D1 as the SQL database
> - Drizzle ORM
>
> What do you think about this stack? Do you have any recommendations for improvements or changes?”

This type of prompt helps validate architecture before implementation begins.

---

### Data Flow Design

> “The system should:
>
> 1. Accept a user question
> 2. Fetch relevant data from trusted statistical databases (e.g., SCB API)
> 3. Generate an answer based only on that data
>
> The application should also store chat history and understand previous messages.
>
> How would you recommend structuring this flow?”

Because I had limited prior experience building agent-based systems, I remained open to suggestions and used AI to explore orchestration patterns.

---

## Implementation Phase

Once architecture and flow were finalized, I switched to a more deterministic prompting style.

At this stage:

- I asked the AI to generate a **step-by-step implementation plan**
- Prompts included detailed requirements so the agent would not make architectural decisions independently
- I required the agent to **test features before marking tasks complete**

This ensured consistency between intended architecture and implemented code.

---

## Challenges

The most significant challenge was integrating with the **Statistics Sweden (SCB) API**.

### Problem 1: API Usability

Initially, the agent struggled to navigate the SCB API structure.  
**Solution:** I created a tool abstraction to simplify API interaction and enable structured querying.

### Problem 2: Table Selection

The agent often selected incorrect statistical tables based on user questions.

**Mitigation approach:**

- Imported a subset of relevant tables into Cloudflare D1
- Added keywords to each table
- Implemented a selection step where the agent chooses the most relevant table before querying SCB

This improved accuracy but is not perfect. As the number of tables grows, scaling challenges will appear.

Potential future improvements:

- Weighted keyword scoring

For this MVP, the current approach provides acceptable performance.

---

## Summary

AI was used throughout this project as:

- A **creative partner** for UI exploration
- An **architectural sounding board**
- A **deterministic implementation tool** once designs were finalized

AI-assisted development works best when:

- Context is provided early
- Architecture is decided collaboratively
- Implementation prompts are highly specific
- The developer remains responsible for final decisions and validation
