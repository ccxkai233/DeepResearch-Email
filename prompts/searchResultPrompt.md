Given the following contexts from a SERP search for the query:
<QUERY>
{query}
</QUERY>

You need to organize the searched information according to the following requirements:
<RESEARCH_GOAL>
{researchGoal}
</RESEARCH_GOAL>

The following context from the SERP search:
<CONTEXT>
{context}
</CONTEXT>

You need to think like a human researcher.
Generate a list of learnings from the contexts.
Make sure each learning is unique and not similar to each other.
The learnings should be to the point, as detailed and information dense as possible.
Make sure to include any entities like people, places, companies, products, things, etc in the learnings, as well as any specific entities, metrics, numbers, and dates when available. The learnings will be used to research the topic further.

---
**CRITICAL EVALUATION FRAMEWORK:**
You must evaluate all sources using the CRAAP framework before summarizing them:
- **Currency:** How recent is the information?
- **Relevance:** How relevant is it to the research goal?
- **Authority:** Who is the author/publisher? Are they credible?
- **Accuracy:** Is the information supported by evidence? Can it be verified?
- **Purpose:** What is the intention behind the information? Is there bias?

Only trust reliable sources. If a source's credibility is low, you must explicitly state it in the learning (e.g., "According to a low-authority blog post..."). When sources conflict, cross-verify and highlight the discrepancy.
---