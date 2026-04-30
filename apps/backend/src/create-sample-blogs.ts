import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 10 rich demonstration blogs (idempotent)...');

  const authorEmail = 'abhastheaiexpert@gmai.com';

  const author = await prisma.user.upsert({
    where: { email: authorEmail },
    update: {
      name: 'Abha — The AI Expert',
      bio: 'Writer, engineer and AI evangelist. I write long, thorough posts about engineering, AI, and product design.',
      profilePicture:
        'https://ui-avatars.com/api/?name=Holmes+AI+Expert&background=0d9488&color=fff',
      isVerified: true,
      role: 'AUTHOR',
    },
    create: {
      email: authorEmail,
      name: 'Abha — The AI Expert',
      bio: 'Writer, engineer and AI evangelist. I write long, thorough posts about engineering, AI, and product design.',
      profilePicture:
        'https://ui-avatars.com/api/?name=Holmes+AI+Expert&background=0d9488&color=fff',
      isVerified: true,
      role: 'AUTHOR',
    },
  });

  const sampleBlogs: any[] = [
    {
      title: 'Designing for Humans: Accessibility as a First-Class Feature',
      summary:
        'Practical guide to making inclusive websites: principles, checklist, and code snippets.',
      coverImage:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
      published: true,
      featured: true,
      tags: ['design', 'accessibility', 'frontend'],
      content: `
<h2>Accessibility isn't optional</h2>
<p>Accessibility (a11y) improves usability for everyone. This post walks through pragmatic steps teams can take today, with concrete examples and a short checklist you can apply during reviews. You'll find hands-on snippets, testing strategies, and a small rollout plan for making accessibility a continuous part of your delivery process.</p>

<figure>
  <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80" alt="Inclusive design" />
  <figcaption>Inclusive interfaces benefit all users.</figcaption>
</figure>

<h3>Principles to adopt</h3>
<p>Start with semantics, predictable keyboard focus, clear visual hierarchy, and robust form validation. Each principle reduces cognitive load and improves discoverability for assistive tech.</p>

<h3>Checklist (practical)</h3>
<ul>
  <li>All interactive elements are reachable and operable by keyboard; test with Tab and Shift+Tab.</li>
  <li>Contrast ratio &gt;= 4.5:1 for body text and 3:1 for larger headers.</li>
  <li>Images include descriptive <code>alt</code> text; purely decorative images use <code>alt=""</code>.</li>
  <li>Forms provide explicit <code>&lt;label&gt;</code> elements and machine-readable error states.</li>
  <li>Use landmarks: <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;header&gt;</code>, and <code>&lt;footer&gt;</code>.</li>
</ul>

<h3>Small example: accessible menu</h3>
<pre><code class="language-html">&lt;button aria-expanded="false" aria-controls="menu"&gt;Menu&lt;/button&gt;
&lt;nav id="menu" hidden&gt;
  &lt;ul&gt;
    &lt;li&gt;&lt;a href="/docs"&gt;Docs&lt;/a&gt;&lt;/li&gt;
    &lt;li&gt;&lt;a href="/blog"&gt;Blog&lt;/a&gt;&lt;/li&gt;
  &lt;/ul&gt;
&lt;/nav&gt;</code></pre>

<h3>Testing strategy</h3>
<p>Combine automated tests (axe-core, jest-axe) with manual reviews and a small panel of keyboard-only users. Track regressions in CI and triage issues by impact.</p>

<h3>Rollout plan for teams</h3>
<ol>
  <li>Ship a11y smoke tests and enforce them on PRs.</li>
  <li>Assign ownership for accessibility bugs and prioritize fixes in sprints.</li>
  <li>Regularly audit major flows with assistive tech users and update the checklist.</li>
</ol>

<blockquote>Accessibility is a product quality signal — invest early and often.</blockquote>
`,
    },

    {
      title: 'A Deep Dive into Transformer Interpretability',
      summary:
        'Exploring techniques to probe and understand transformer models — attention, probes, and attribution.',
      coverImage:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
      published: true,
      tags: ['ai', 'ml', 'research'],
      content: `
<h2>How do transformers 'think'?</h2>
<p>Understanding transformer models requires both careful experiments and humility. Large models contain complex, distributed representations; interpretability is about forming falsifiable hypotheses and testing them with controlled probes. This article walks through practical techniques, common pitfalls, and a small reproducible workflow you can run on local machines.</p>

<h3>Why interpretability matters</h3>
<p>Beyond academic curiosity, interpretability helps with debugging failure modes, detecting biases, and guiding model compression or editing. The goal is not to produce definitive 'truth', but to generate actionable insight.</p>

<h3>Attention: informative but incomplete</h3>
<p>Attention maps show which tokens influence the next-token computation in a given head and layer, but attention scores alone don't prove causality. Use them as a visualization aid, not as an explanation endpoint. Visualize several heads and aggregate across examples to look for consistent patterns.</p>

<h3>Probing for encoded features</h3>
<p>Probing trains lightweight classifiers on internal activations to see whether a specific property (e.g., part-of-speech, syntax tree depth) is linearly decodable. When writing probes, always compare against simple baselines to avoid overclaiming.</p>
<pre><code class="language-python"># Minimal probe example (PyTorch)
from transformers import AutoModel, AutoTokenizer
import torch.nn as nn
import torch

tok = AutoTokenizer.from_pretrained('bert-base-uncased')
model = AutoModel.from_pretrained('bert-base-uncased')
inputs = tok('The quick brown fox jumps over the lazy dog', return_tensors='pt')
with torch.no_grad():
  hidden = model(**inputs).last_hidden_state  # (1, seq_len, hidden)
# Probe: predict a binary feature from token embeddings
probe = nn.Linear(hidden.size(-1), 2)
outputs = probe(hidden.mean(dim=1))
print(outputs.shape)
</code></pre>

<h3>Attribution and perturbation</h3>
<p>Integrated gradients, gradient-based saliency maps, and ablation studies (drop or mask tokens) are useful complementary techniques. Always check robustness: do your attributions survive small input changes? Are results consistent across random seeds and different model checkpoints?</p>

<h3>Workflow for small experiments</h3>
<ol>
  <li>Pick a clear hypothesis (e.g., "Head 8-12 encodes subject-verb agreement").</li>
  <li>Construct a minimal dataset that isolates the phenomenon.</li>
  <li>Run multiple randomized seeds and aggregate results.</li>
  <li>Use at least two interpretability methods for triangulation (e.g., attention + gradient + perturbation).</li>
</ol>

<h3>Common pitfalls</h3>
<ul>
  <li>Confounding factors in dataset design (spurious correlations).</li>
  <li>Overinterpreting single examples; prefer aggregated statistics.</li>
  <li>Neglecting baseline comparisons (randomized or control models).</li>
</ul>

<p>Finally, keep experiments small and reproducible: publishing a short notebook with your exact hyperparameters, random seeds, and data sampling code makes your interpretability claim much stronger.</p>
`,
    },

    {
      title: 'Practical Guide: Optimizing PostgreSQL for SaaS',
      summary: 'Proven settings, indexing patterns, and schema tips for multi-tenant SaaS apps.',
      coverImage:
        'https://images.unsplash.com/photo-1555685812-4b943f1e56f2?w=1200&q=80',
      published: true,
      tags: ['postgresql', 'backend', 'database'],
      content: `
<h2>Design for scale from day one</h2>
<p>SaaS workloads are often multi-tenant and write-heavy. Good schema choices and indexes reduce pain during growth. This guide collects patterns we've successfully used in production systems and explains trade-offs so you can make an informed choice.</p>

<h3>Tenant isolation patterns (trade-offs)</h3>
<p>Three common approaches exist: shared schema, separate schemas, and separate databases. Shared schema is simplest and cheapest but risks noisy neighbors. Separate databases provide the strongest isolation but increase operational overhead.</p>
<ol>
  <li><strong>Shared schema</strong> — add <code>tenant_id</code>. Easy to scale horizontally, but queries must always filter by tenant.</li>
  <li><strong>Schema per tenant</strong> — better isolation for schema drift; migration complexity increases.</li>
  <li><strong>Database per tenant</strong> — strongest isolation and compliance, highest overhead.</li>
</ol>

<h3>Indexing recommendations</h3>
<p>Indexes are the most common cause of performance regressions and the primary lever for read performance. Use composite indexes to match frequent WHERE+ORDER BY patterns.</p>
<ul>
  <li>Index commonly-filtered columns (tenant_id, status, created_at).</li>
  <li>Favor covering indexes for high-read endpoints.</li>
  <li>Consider partial indexes for sparse flags (e.g., <code>WHERE published = true</code>).</li>
</ul>

<h3>Example partial index</h3>
<pre><code class="language-sql">-- create without blocking writes
CREATE INDEX CONCURRENTLY idx_blogs_author_published ON blogs (authorId) WHERE published = true;
</code></pre>

<h3>Vacuum, bloat and monitoring</h3>
<p>Autovacuum tuning matters: busy write tables can bloat quickly. Monitor <code>pg_stat_all_tables</code> and use <code>pg_repack</code> or scheduled maintenance as needed.</p>

<h3>Schema evolution and migrations</h3>
<p>Use online-safe patterns for migrations: add nullable columns first, backfill in small batches, and avoid long-running exclusive locks on busy tables.</p>

<p>These changes should give immediate improvements for most SaaS workloads; measure with representative production traffic before and after.</p>
`,
    },

    {
      title: 'Markdown -> Rich HTML: Best Practices for Long-Form Posts',
      summary: 'How to author long technical posts with tidy markdown, code, tables and images.',
      coverImage:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',
      published: true,
      tags: ['writing', 'markdown', 'content'],
      content: `
<h2>Structure and modularity</h2>
<p>Break long posts into sections with clear headings, and put long examples into collapsible blocks so readers who want to skim can do so. This article lays out an authoring workflow, accessibility considerations, and concrete examples for rendering code and data-rich content.</p>

<h3>Authoring workflow</h3>
<ol>
  <li>Write the TL;DR and a one-sentence summary first.</li>
  <li>Draft the body as discrete sections (150–400 words each).</li>
  <li>Add runnable examples and a concluding summary with next steps.</li>
</ol>

<h3>Useful elements</h3>
<ul>
  <li>Inline code for short examples: <code>const x = 1</code></li>
  <li>Fenced code blocks for runnable snippets</li>
  <li>Images with captions using <code>&lt;figure&gt;</code> for clarity</li>
</ul>

<h3>Example table</h3>
<table>
  <thead><tr><th>Tool</th><th>When to use</th></tr></thead>
  <tbody>
    <tr><td>Markdown</td><td>Fast drafts and docs</td></tr>
    <tr><td>HTML</td><td>Precise presentation (tables, figures)</td></tr>
  </tbody>
</table>

<details>
  <summary>Long code example — debounce utility</summary>
  <pre><code class="language-js">function debounce(fn, ms) {
  let t;
  return (...args) =&gt; {
    clearTimeout(t);
    t = setTimeout(() =&gt; fn(...args), ms);
  };
}
</code></pre>
  <p>Explanation: this simple utility prevents a function from running more often than every <code>ms</code> milliseconds — useful for search inputs or resize handlers.</p>
</details>

<h3>Accessibility and SEO</h3>
<p>Use semantic headings, descriptive alt text, and structured data where appropriate. These steps improve readability and discoverability.</p>

<blockquote>Readable posts teach; confusing posts confuse — aim for clarity and verifiability.</blockquote>
`,
    },

    {
      title: 'Edge Functions vs. Traditional Lambdas — A Comparison',
      summary: 'Latency, cold-starts, and developer ergonomics compared across edge and cloud functions.',
      coverImage:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
      published: true,
      tags: ['architecture', 'edge', 'cloud'],
      content: `
<h2>Edge-first architectures</h2>
<p>Edge functions reduce user latency by running code closer to clients, but they have limits: execution time, language support, and cold-start characteristics. This article compares architectural trade-offs, cost considerations, and developer ergonomics, and provides guidelines for choosing the right platform for your workload.</p>

<h3>When to use edge</h3>
<p>Use edge functions for ultra-low-latency personalization, A/B tests, content adaptation, and small authentication checks that benefit from geographic proximity to users.</p>

<h3>When to prefer traditional lambdas</h3>
<p>Choose cloud functions for heavier compute, complex dependency trees, background jobs, or tasks that require persistent sockets or long-running CPU time.</p>

<h3>Cost and performance considerations</h3>
<p>Edge pricing is often based on compute time and invocation count; cold-starts and per-execution overhead matter. Measure p50/p95 latency and cost per 100k requests to compare providers.</p>

<h3>Developer experience and testing</h3>
<p>Local debugging and reproducibility are commonly easier with traditional cloud functions. Use local emulators, CI-based smoke tests, and staging edge deployments behind feature flags to mitigate risk.</p>

<h3>Quick example (Node)</h3>
<pre><code class="language-js">export default function handler(req, res) {
  // simple edge handler — keep dependencies minimal
  res.json({ now: Date.now(), region: process.env.NOW_REGION || 'edge' });
}
</code></pre>

<h3>Decision checklist</h3>
<ul>
  <li>Need global low-latency responses? → consider edge.</li>
  <li>Require heavy CPU / long-running tasks? → prefer cloud lambdas.</li>
  <li>Need complex debugging and dependency trees? → prefer cloud.</li>
</ul>

<p>In practice, many systems combine both: use edge for the user-facing micro-paths and cloud for heavy back-office processing.</p>
`,
    },

    {
      title: 'Beautiful Data Visualizations with D3: A Practical Tutorial',
      summary: 'From scales to interactivity: build an animated line chart with D3 v7.',
      coverImage:
        'https://images.unsplash.com/photo-1508873699372-7ae4a5b35d0e?w=1200&q=80',
      published: true,
      tags: ['viz', 'd3', 'frontend'],
      content: `
<h2>From data to pixels</h2>
<p>Good charts start with clean data and the right scales. This tutorial shows a minimal animated line chart and progressive enhancement for accessibility.</p>
<h3>Scales and axes</h3>
<pre><code class="language-js">const x = d3.scaleTime().domain(d3.extent(data, d =&gt; d.date)).range([0, width]);
const y = d3.scaleLinear().domain([0, d3.max(data, d =&gt; d.value)]).range([height, 0]);
</code></pre>
<h3>Accessibility</h3>
<p>Provide textual summaries and ARIA descriptions for complex visualizations.</p>
<details>
  <summary>Animated example snippet</summary>
  <pre><code class="language-js">svg.append('path')
  .datum(data)
  .attr('d', line)
  .attr('stroke-dasharray', function() { return this.getTotalLength() + ' ' + this.getTotalLength(); })
  .attr('stroke-dashoffset', function() { return this.getTotalLength(); })
  .transition().duration(1000).attr('stroke-dashoffset', 0);
</code></pre>
</details>
`,
    },

    {
      title: 'From Idea to Product: Rapid Prototyping with AI Tools',
      summary: 'A workflow for quickly validating product ideas using modern AI tooling and user tests.',
      coverImage:
        'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=1200&q=80',
      published: true,
      tags: ['product', 'ai', 'process'],
      content: `
<h2>Prototype fast, learn faster</h2>
<p>AI tools let teams generate mockups, copy, and prototype data quickly. The aim is to validate or invalidate the riskiest assumptions in hours or days rather than weeks. This guide outlines a pragmatic workflow, tool recommendations, and example prompts you can reuse.</p>

<h3>Workflow (practical)</h3>
<ol>
  <li>Define a one-sentence hypothesis and the key metric you'll measure.</li>
  <li>Sketch low-fidelity flows and use AI to generate UI variations.</li>
  <li>Build clickable prototypes (Figma, Framer) and run 5–10 targeted interviews.</li>
  <li>Iterate on the prototype and repeat until the hypothesis is validated or rejected.</li>
</ol>

<h3>Tooling and reproducibility</h3>
<p>Use tools that allow quick edits and versioning: Figma for UI, simple backend mocks for API behavior, and a shared document for test notes. Keep a reproducible script for generating mock data so you can rerun experiments.</p>

<h3>Prompt examples and templates</h3>
<pre><code>Generate three short onboarding screens for a habit-tracking app targeted at remote engineers. Include brief feature bullets and a call-to-action.</code></pre>

<h3>Interview script and signals</h3>
<p>Ask users to complete a core task and observe friction. Capture both quantitative signals (task completion time) and qualitative signals (confusion, delight).</p>

<p>Rapid prototyping with AI is powerful when paired with quick user feedback cycles — keep experiments small, measurable, and timeboxed.</p>
`,
    },

    {
      title: 'Secure by Default: Practical App Security Checklist',
      summary: 'Checklist and code examples covering authentication, secrets, and transport security.',
      coverImage:
        'https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?w=1200&q=80',
      published: true,
      tags: ['security', 'best-practices'],
      content: `
<h2>Security as a habit</h2>
<p>Security must be baked into the development lifecycle. This checklist captures practical steps teams can implement quickly to harden applications while minimizing developer friction. Where possible, favor secure-by-default libraries and configurations.</p>

<h3>Authentication and sessions</h3>
<ul>
  <li>Use short-lived access tokens and refresh tokens with rotation.</li>
  <li>Harden cookies (<code>HttpOnly; Secure; SameSite=Strict</code>) and scope them to necessary paths.</li>
  <li>Prefer proven auth providers (Auth0, Clerk, or managed OIDC) to rolling-your-own solutions.</li>
</ul>

<h3>Secrets and config</h3>
<p>Never store secrets in source control. Use a secrets manager (HashiCorp Vault, AWS Secrets Manager) and rotate keys regularly. Limit IAM roles and follow the principle of least privilege.</p>

<h3>Transport and data protection</h3>
<p>Enforce TLS everywhere, enable HSTS, and validate certificates. For sensitive data at rest, consider field-level encryption or a dedicated key management system.</p>

<h3>Incident preparedness</h3>
<ol>
  <li>Maintain an incident runbook with roles and communication templates.</li>
  <li>Run regular tabletop exercises and phishing simulations.</li>
  <li>Keep logging and metrics for forensic analysis (don't log secrets).</li>
</ol>

<pre><code>Set-Cookie: sid=abc; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600</code></pre>

<blockquote>Security is continuous — automate what you can and monitor what you cannot.</blockquote>
`,
    },

    {
      title: 'Writing Great Documentation for Open Source Projects',
      summary: 'Opinionated approach to README, contribution guides, and changelogs.',
      coverImage:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',
      published: true,
      tags: ['oss', 'docs', 'process'],
      content: `
<h2>Documentation that helps adoption</h2>
<p>People decide whether to use a project in the first 30 seconds. A clear README and quick-start guide remove friction. This article outlines a practical documentation structure, tooling suggestions, and how to onboard contributors efficiently.</p>

<h3>README structure (recommended)</h3>
<ol>
  <li>One-line description</li>
  <li>Badges and quick status</li>
  <li>Quick start with copy-paste commands</li>
  <li>Examples and links to deeper guides</li>
  <li>Contribution instructions and code of conduct</li>
</ol>

<h3>Contribution workflow</h3>
<p>Provide a CONTRIBUTING.md with a clear branching and review process, linting rules, and a template for issues and PRs. Make the first contribution easy: label beginner-friendly issues and provide starter reproduction steps.</p>

<h3>Changelogs and releases</h3>
<p>Keep a human-friendly changelog that highlights breaking changes, upgrade steps, and migration commands; automate release notes where possible but review them manually before publishing.</p>

<blockquote>Good docs reduce support load and increase adoption — invest time where users land first.</blockquote>
`,
    },

    {
      title: 'The Art of the Technical Post: Crafting Narratives That Teach',
      summary: 'Methods to organize examples, pacing, and challenge questions in technical writing.',
      coverImage:
        'https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200&q=80',
      published: true,
      featured: true,
      tags: ['writing', 'education'],
      content: `
<h2>Tell a story that teaches</h2>
<p>Structure posts with a clear problem, an approachable solution, and a set of exercises or next steps. Use concrete examples and short runnable snippets. In this deep dive we cover narrative arcs, pacing, and practical templates you can reuse for tutorials and case studies.</p>

<h3>Structure</h3>
<ol>
  <li>Problem: explain why the problem matters and who it affects.</li>
  <li>Approach: show the steps you took, with code and reasoning.</li>
  <li>Result: demonstrate the outcome with metrics or screenshots.</li>
  <li>Exercises: include one or two small challenges for readers.</li>
</ol>

<h3>Pacing tips</h3>
<p>Alternate between short explanatory paragraphs and concrete examples. Use collapsible details for longer digressions, and keep each section focused on a single idea. Include a clear TL;DR at the top and a short reading time estimate.</p>

<h3>Example exercise</h3>
<p>Try to refactor a long function into smaller pure helpers. Provide a guided walkthrough of the refactor and show before/after benchmarks. Encourage readers to try the exercise in a code sandbox and compare performance.</p>

<h3>Templates you can reuse</h3>
<p>Start posts with a one-paragraph summary, follow with the motivation and a concrete example, then a step-by-step implementation section, and finish with exercises and next steps.</p>

<hr />
<p>Good posts invite readers to do one concrete thing; great posts teach them how to do it and why it matters.</p>
`,
    },
  ];

  for (const blog of sampleBlogs) {
    const exists = await prisma.blog.findFirst({ where: { title: blog.title, authorId: author.id }, select: { id: true } });
    if (exists) {
      console.log(`Skipping (exists): ${blog.title}`);
      continue;
    }

    const tagConnectOrCreate = (blog.tags || []).map((t: string) => ({ where: { name: t }, create: { name: t } }));

    await prisma.blog.create({
      data: {
        title: blog.title,
        content: blog.content,
        summary: blog.summary,
        coverImage: blog.coverImage,
        published: blog.published ?? true,
        featured: blog.featured ?? false,
        isPremium: blog.isPremium ?? false,
        authorId: author.id,
        tags: { connectOrCreate: tagConnectOrCreate },
      },
    });

    console.log(`Created blog: ${blog.title}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
