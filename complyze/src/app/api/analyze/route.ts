import { NextResponse } from 'next/server'
import { comprehensiveRedact } from '@/lib/redactUtils'

// Use OpenRouter API key and endpoint
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function optimizePrompt(prompt: string): Promise<string> {
  const systemPrompt = `**Rationale:** The structure above is carefully designed to cover all best practices. We begin by assigning the AI a **specific role** ("Prompt Optimization Assistant"), which helps set the context for the task and ensure the model responds in the correct capacity. Next, we present a **numbered list of instructions** (Steps 1–11) that the model should follow. Using a step-by-step list makes the requirements unambiguous and easy to verify. Each step in this list corresponds to a best-practice technique:

- *Step 1 (Preserve intent)* – Ensures no loss of meaning from the original query, addressing the core user needs. This prevents the optimizer from introducing irrelevant content or omitting details inadvertently. Clarity is useless if the prompt doesn't ask exactly what the user wants, so preserving intent is listed first as a priority.
- *Step 2 (Replace redacted tokens)* – Implements the placeholder-preservation rule. By converting [REDACTED_EMAIL] to <email>, for example, we keep the prompt safe while still indicating the type of information. This draws from privacy best practices for redaction and ensures the model treats redacted info as a variable to retain (instead of ignoring it or attempting to fill it in).
- *Step 3 (Add missing context or role)* – Incorporates the advice to provide context and role information to the model. If the user prompt lacks clarity about *who* the assistant should be or *why* the task is being done, the optimizer will add it. For example, if the user just says "Explain how airplanes fly," the optimized prompt might prepend "You are an aerospace engineer. Explain how airplanes fly to a general audience." Adding such context can dramatically improve relevance and correctness.
- *Step 4 (Clarify and specify)* – Directly addresses ambiguity. This is informed by OpenAI and MIT Sloan recommendations to be as specific as possible about what is being asked. Here the optimizer will tighten any fuzzy wording. For instance, *"Tell me about recent technology"* could be refined to *"Give an overview of 3 recent advancements in AI technology (from 2023-2025) and their impacts."* This step also suggests breaking a broad query into sub-questions if needed, ensuring the model can focus on each part without hallucinating or wandering off-topic.
- *Step 5 (Structure logically)* – Reflects the importance of organized prompts. We instruct the optimizer to use lists, sections, or other formatting to clearly delineate different parts of the prompt. For example, if the task involves multiple requirements (*"Summarize the text and then critique it"*), the improved prompt might explicitly enumerate these as "1. Summary, 2. Critique." We also advise separating any user-provided content (like a passage to summarize or data to use) from the instructions, using quotes or code blocks. This prevents the model from confusing task instructions with input data.
- *Step 6 (Define output format and length)* – Draws on the guidance to articulate the desired output format in the prompt. The optimizer will add specifics about how the answer should look: e.g., "Provide the answer as bullet points" or "Output a JSON object with these fields...". If the original prompt already specifies a format, the optimizer might still refine it (turning a vague "short response" into "a single paragraph of 3-5 sentences" for precision). This ensures the resulting prompt gives the answering model a clear idea of the expected answer structure.
- *Step 7 (Positive phrasing for constraints)* – Applies OpenAI's best practice of telling the model what to do instead of just what **not** to do. This step makes the prompt more **LLM-aligned** by removing potential confusion. For example, "Don't use first person" would be rewritten as "Write in the third person." This way the model is guided constructively, reducing the chance it inadvertently does the forbidden action or gets stuck on a negation.
- *Step 8 (Encourage grounded answers)* – This step is motivated by the need to reduce hallucinations. By explicitly instructing the model to stick to known information or provided context, the prompt helps the answering model stay factual. For instance, adding "cite the article above and do not add info beyond it" if summarizing a text, or "if you don't know the answer, say so" for a Q&A prompt. This aligns with recommended techniques to improve truthfulness in AI outputs.
- *Step 9 (Include reasoning if needed)* – Incorporates the chain-of-thought idea from Anthropic and others. If a query likely needs reasoning (e.g. solving a math word problem or making a complex inference), the optimizer can inject a prompt like "Let's think step by step" or ask for an explanation before the final answer. This has been shown to improve complex problem solving. The instruction is conditional ("if needed") so that simpler prompts won't get an unnecessary verbose treatment.
- *Step 10 (Maintain tone and guidelines)* – A reminder to keep the prompt polite and policy-compliant. This is partly an alignment measure: ensuring the prompt doesn't encourage the model to produce disallowed content or tone. It also means if the user had a certain tone in their prompt (e.g. "explain *nicely*"), the optimizer should maintain that. OpenAI advises specifying tone with adjectives like formal or friendly, so the optimizer will explicitly mention any intended tone.
- *Step 11 (Final output instruction)* – Tells the model how to deliver the result: by outputting only the optimized prompt. This is crucial for usability. We don't want extra commentary or apologies from the model; we just want the cleaned-up prompt text that can be passed on to another LLM. By stating "output only the optimized prompt text and nothing else," we make it clear that the final answer should be the reformulated prompt itself, ready for use.

After the instruction list, the template shows how the user's original prompt will be provided (delimited in a block for clarity), and where the model should write the optimized version. We used a **placeholder {{USER_PROMPT}}** to indicate insertion of the actual user prompt at runtime. In practice, your system would replace {{USER_PROMPT}} with the real prompt content. The model is then expected to produce everything under the "Optimized Reformulation" block as the output. We explicitly format the example with markers to avoid any ambiguity for the model about what to rewrite and where to put its answer.

This final prompt is designed to be **general-purpose**. Whether the user's original prompt is asking for a summary, a piece of code, a translation, a creative story, or a factual Q&A, the optimizer's instructions adapt the query to be clearer and more effective for an LLM. Because we've incorporated universal best practices (clarity, context, format specification, etc.), the improved prompt should help any advanced model – from GPT-4 to Claude or Google's Gemini – understand exactly what is needed and respond with minimal confusion or guesswork. By preserving redacted placeholders and adding alignment-friendly phrasing, we also ensure the prompt remains safe and compliant across different AI systems.

In summary, the optimized-prompt template above encapsulates the collective wisdom on prompt engineering: it **grounds the model with context**, **clarifies the task**, **sets explicit instructions and format**, and **steers the model away from pitfalls** like ambiguity or hallucination. Using this template in your backend, you can automatically transform user submissions into high-quality prompts that consistently yield better AI responses. The included rationale and structure are backed by practices from OpenAI, Anthropic, MIT and others, ensuring that the approach is well-founded in the latest research and guidance on effective prompt design.

**Step 3: Scoring**
Return these scores:
- Clarity Score (1–5): Is the prompt clear, specific, and actionable?
- Risk Level: Low / Moderate / High — based on presence of sensitive data or misuse potential

---

**Step 4: Compliance Mapping**
Map the redacted and optimized prompt to relevant security/privacy controls:
- Use control tags (e.g., NIST.SC-28, HIPAA.164.308(a)(1)(ii)(A))
- Return up to 5 relevant tags
- If no controls apply, return: []

**Step 1: Redaction**
Identify and redact any sensitive data using the following types:
- Personally Identifiable Information (PII): names, emails, phone numbers, SSNs, IPs, etc.
- Protected Health Information (PHI)
- Payment data (credit cards, account numbers)
- Confidential business data (internal URLs, compensation, unreleased product details)
- Private links, internal tool names, or document references

Replace redacted items with [REDACTED:<TYPE>], e.g., [REDACTED:EMAIL], [REDACTED:URL].

---
---

**Step 5: Suggestions**
If any redactions or risky patterns were detected, provide clear, actionable suggestions to improve compliance.

---

## you can also perform the scoring

---
**Output Format:**
Return ONLY the optimized prompt as a single markdown code block, and nothing else. Do not include any commentary, rationale, or instructions. The code block should contain only the improved prompt, ready for use.

For example:
[Optimized prompt goes here]
`;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];
  console.log('Sending to OpenRouter:', JSON.stringify({
    model: 'google/gemini-2.5-flash-preview-05-20:thinking',
    messages,
    max_tokens: 2048,
    temperature: 0.3
  }, null, 2));
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview-05-20:thinking',
      messages,
      max_tokens: 2048,
      temperature: 0.3
    })
  });
  const data = await response.json();
  console.log('OpenRouter response:', JSON.stringify(data, null, 2));
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Redact known PII/sensitive data
    const redactionResult = await comprehensiveRedact(prompt);
    const redacted_prompt = redactionResult.redactedText;

    // 2. Optimize the redacted prompt
    const optimized_prompt = await optimizePrompt(redacted_prompt);

    // 3. Placeholder scoring logic
    const clarity_score = 75; // TODO: Replace with real scoring
    const risk_level = 'medium'; // TODO: Replace with real risk analysis
    const control_tags: string[] = []; // TODO: Replace with real control mapping

    return NextResponse.json({
      redacted_prompt,
      optimized_prompt,
      clarity_score,
      risk_level,
      control_tags
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze and optimize prompt' },
      { status: 500 }
    );
  }
} 