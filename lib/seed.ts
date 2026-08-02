export interface SeedQuestionSet {
  code: string;
  title: string;
  description: string;
  questions: Array<{ title: string; detail: string }>;
}

export const seedQuestionSets: SeedQuestionSet[] = [
  {
    code: "KNW",
    title: "Sensemaking, strategy & knowledge",
    description:
      "How you discover, structure, generate, judge, and preserve understanding.",
    questions: [
      { title: "Discovery and inquiry", detail: "Noticing weak signals; curiosity; question formation; research planning; source discovery; finding primary sources; recognizing missing information." },
      { title: "Problem framing", detail: "Defining the real problem; separating symptoms from causes; interrogating premises; identifying stakeholders, boundaries, and constraints; reframing." },
      { title: "Decomposition", detail: "Breaking systems into useful parts; finding stable boundaries; dependency analysis; volatility analysis; requirements decomposition; abstraction tuning." },
      { title: "Modeling and reasoning", detail: "Systems thinking; causal reasoning; first-principles reasoning; critical thinking; scenario modeling; probabilistic and quantitative reasoning; strategic foresight." },
      { title: "Synthesis and abstraction", detail: "Pattern recognition; cross-domain synthesis; analogy; conceptual compression; transferring models between fields; finding unifying principles; naming concepts." },
      { title: "Ontology and information architecture", detail: "Taxonomies; ontologies; bounded contexts; category design; relationship modeling; schema design; navigation structures; contract and interface design." },
      { title: "Ideation and invention", detail: "Divergent ideation; novel combinations; speculative thinking; alternative generation; greenfield invention; naming; conceptual prototyping." },
      { title: "Judgment and taste", detail: "Recognizing quality; coherence judgment; prioritization; trade-offs; aesthetic and editorial judgment; detecting subtle errors; attention to detail." },
      { title: "Knowledge stewardship", detail: "Capturing knowledge; source evaluation; curation; note-making; organizing; retrieval design; maintenance; distillation; citation discipline; documentation." },
    ],
  },
  {
    code: "EXE",
    title: "Executive functioning & self-direction",
    description:
      "The performance substrate that turns intention into sustained, completed action.",
    questions: [
      { title: "Direction", detail: "Forming goals; choosing priorities; identifying the next action; separating important from urgent; staying connected to intent." },
      { title: "Scope", detail: "Defining boundaries; maintaining fixed scope; resisting feature creep; simplifying requirements; identifying the smallest useful outcome; MVP compression." },
      { title: "Planning", detail: "Task decomposition; sequencing; dependency planning; estimation; scheduling; contingency planning; resource allocation." },
      { title: "Initiation", detail: "Starting promptly; overcoming activation friction; working without external pressure; resuming interrupted work; overcoming procrastination." },
      { title: "Attention", detail: "Sustained attention; resisting distraction; working memory; keeping context active; noticing attention drift; deep work." },
      { title: "Switching and organization", detail: "Context switching; recovering context; managing parallel commitments; calendar use; task capture; organizing materials; tracking dependencies." },
      { title: "Follow-through", detail: "Remembering commitments; following up with people; maintaining recurring responsibilities; persistence through boredom; closing open loops." },
      { title: "Completion and stopping", detail: "Finishing; shipping; accepting good enough; stopping polishing; recognizing diminishing returns; handing work off cleanly." },
      { title: "Regulation", detail: "Emotional regulation; frustration and stress tolerance; ambiguity tolerance; impulse inhibition; adapting when plans fail." },
      { title: "Energy and rhythm", detail: "Sleep-aware planning; pacing; recovery; routine formation; habit maintenance; matching tasks to energy; preventing burnout." },
    ],
  },
  {
    code: "REL",
    title: "Communication, relationships & coordination",
    description:
      "How you understand people, transmit meaning, build trust, and coordinate action.",
    questions: [
      { title: "Interpersonal perception", detail: "Listening; empathy; perspective-taking; reading emotional cues and group dynamics; understanding incentives; noticing unstated needs." },
      { title: "Clear expression", detail: "Clear and concise writing; speaking clearly; audience adaptation; information sequencing; storytelling; presentation design; public speaking." },
      { title: "Dialogue and feedback", detail: "Asking useful questions; receiving criticism; giving feedback; clarifying misunderstandings; difficult conversations; communicating uncertainty." },
      { title: "Influence and negotiation", detail: "Persuasion; advocacy; objection handling; negotiation; assertiveness; boundary-setting; gaining commitment without coercion." },
      { title: "Conflict and trust", detail: "De-escalation; conflict resolution; repair; accountability; apologizing; rebuilding trust; confidentiality; psychological safety." },
      { title: "Teaching and facilitation", detail: "Explaining; tutoring; coaching; mentoring; meeting facilitation; workshop design; group decision-making; synthesizing discussion." },
      { title: "Relationship building", detail: "Initiating relationships; networking; maintaining friendships and professional relationships; hosting; reciprocity; community participation." },
      { title: "Leadership and coordination", detail: "Setting direction; clarifying roles; delegating; motivating; managing performance; organizing groups; interviewing; hiring judgment; event management." },
    ],
  },
  {
    code: "LIFE",
    title: "Personal life & stewardship",
    description:
      "The practical capabilities that keep a human life healthy, safe, solvent, and supported.",
    questions: [
      { title: "Health management", detail: "Recognizing health problems; finding appropriate care; communicating with clinicians; appointments; treatment adherence; medication administration; health records." },
      { title: "Physical capacity and recovery", detail: "Sleep; exercise programming; mobility; physical conditioning; pain and injury management; pacing; recovery; body awareness." },
      { title: "Mental and emotional wellbeing", detail: "Recognizing emotional states; stress management; asking for support; therapeutic self-work; avoiding harmful coping; maintaining supportive practices." },
      { title: "Food", detail: "Nutrition; meal planning; grocery shopping; cooking; food storage; food safety; cooking efficiently for others." },
      { title: "Household", detail: "Cleaning; laundry; organization; inventory; furnishing; routine maintenance; minor repairs; coordinating contractors; preventing deterioration." },
      { title: "Personal finance", detail: "Budgeting; cash-flow management; bills; taxes; credit; debt; insurance; investing; retirement planning; large-purchase decisions." },
      { title: "Administration and logistics", detail: "Records; forms; identity documents; government services; benefits; contracts; scheduling; transportation; bookings; travel planning; moving." },
      { title: "Safety and digital stewardship", detail: "First aid; emergency planning; scam detection; password security; privacy; backups; device maintenance; identity-theft response." },
      { title: "Care, community and recreation", detail: "Caregiving; supporting family; celebrations; gifts; social planning; hosting; community contribution; hobbies; leisure; restorative play." },
    ],
  },
  {
    code: "BUS",
    title: "Entrepreneurship & business",
    description:
      "The end-to-end capabilities required to discover, create, sell, govern, and operate a venture.",
    questions: [
      { title: "Opportunity and strategy", detail: "Opportunity sensing; business ideation; market selection and research; competitive analysis; segmentation; ICP definition; differentiation; business models; strategic positioning." },
      { title: "Customer and problem discovery", detail: "Recruiting interviewees; customer interviews; listening without leading; identifying jobs and pains; problem validation; willingness-to-pay discovery; synthesizing evidence." },
      { title: "Product strategy and shaping", detail: "Value proposition; product vision and strategy; requirements; prioritization; roadmap; MVP definition; fixed scope; prototyping; product taste; UX judgment." },
      { title: "Validation and experimentation", detail: "Hypothesis design; cheap tests; experiment design; success criteria; instrumentation; product analytics; statistics; interpreting ambiguous results; killing weak ideas." },
      { title: "Marketing and market creation", detail: "Brand strategy; positioning; messaging; copywriting; content; SEO; channel selection; campaigns; demand generation; lifecycle marketing; growth loops; attribution." },
      { title: "Sales and commercial exchange", detail: "Prospecting; qualification; discovery calls; demonstrations; proposals; pricing conversations; objection handling; negotiation; closing; pipeline management; forecasting." },
      { title: "Customers and retention", detail: "Onboarding; customer communication; support; customer success; account management; expectation-setting; retention; expansion; handling dissatisfied customers." },
      { title: "Partnerships and ecosystem", detail: "Networking; business development; partner selection; alliance design; negotiating partnerships; channel partnerships; community building; maintaining partner relationships." },
      { title: "Economics and finance", detail: "Pricing; unit economics; budgeting; runway; forecasting; management accounting; bookkeeping oversight; FinOps; capital allocation; financial controls." },
      { title: "Fundraising and investor relations", detail: "Fundraising strategy; pitch construction; investor outreach; pitching; due diligence; term evaluation; investor updates; board communication." },
      { title: "Legal, compliance and risk", detail: "Contracts; corporate structure; intellectual property; employment law; privacy; regulatory analysis; insurance; compliance; risk; knowing when counsel is necessary." },
      { title: "Revenue operations", detail: "CRM design; pipeline stages; lead routing; sales data quality; forecasting systems; quoting; contracting flow; billing handoff; compensation; revenue reporting." },
      { title: "Company operations", detail: "Process design; SOPs; project and program management; vendor selection; procurement; documentation; operational metrics; event production." },
      { title: "Organization and people", detail: "Role design; recruiting; interviewing; hiring; onboarding; delegation; management; leadership; performance; compensation; culture; organizational design." },
    ],
  },
  {
    code: "SWE",
    title: "Software & AI engineering",
    description:
      "The capabilities needed to shape, build, evolve, deliver, secure, and operate software systems.",
    questions: [
      { title: "Product and requirements engineering", detail: "Translating needs into software; requirements discovery; specifications; acceptance criteria; scope control; product judgment; UX collaboration; accessibility." },
      { title: "Domain and system modeling", detail: "Domain modeling; data modeling; schemas; bounded contexts; API design; interface contracts; dependency analysis; state-machine design." },
      { title: "Architecture", detail: "System architecture; decomposition; modularity; coupling and cohesion; distributed-system design; architecture trade-offs; build versus buy; evolutionary architecture." },
      { title: "Implementation", detail: "Language fluency; algorithms; data structures; frontend; backend; mobile and desktop; databases; integrations; concurrency; implementation speed." },
      { title: "Code quality and evolution", detail: "Readability; naming; refactoring; automated testing; test design; debugging; code review; performance; documentation; technical-debt management." },
      { title: "Developer experience", detail: "Git; development environments; build systems; dependency management; local tooling; automation; CI design; reproducibility; developer onboarding." },
      { title: "Delivery and infrastructure", detail: "Cloud architecture; infrastructure as code; networking; containers; Kubernetes; CI/CD; deployments; release management; configuration; environment promotion." },
      { title: "Reliability and operations", detail: "SRE; availability; observability; logs; metrics; traces; alerting; capacity planning; incidents; disaster recovery; postmortems; operational cost." },
      { title: "Security and privacy", detail: "Threat modeling; secure coding; authentication; authorization; IAM; secrets; dependency security; vulnerability response; privacy engineering; security operations." },
      { title: "Data engineering and analytics", detail: "SQL; data modeling; ETL and ELT; pipelines; analytics engineering; data quality; dashboards; experimentation infrastructure; governance." },
      { title: "Statistics and machine learning", detail: "Descriptive statistics; inference; experimental design; feature engineering; classical ML; deep learning; model evaluation; bias; interpretability." },
      { title: "LLM and agent engineering", detail: "Prompting; context engineering; retrieval; tool use; agent architecture; memory; orchestration; evaluation design; safety; production monitoring." },
      { title: "Production AI", detail: "Dataset construction; training pipelines; model serving; MLOps; evaluation drift; latency and cost trade-offs; model observability; human review." },
    ],
  },
  {
    code: "CRAFT",
    title: "Embodied, practical & creative craft",
    description:
      "Skills expressed through perception, the body, tools, media, and deliberate practice.",
    questions: [
      { title: "Spatial and sensory judgment", detail: "Spatial reasoning; visual perception; proportion; color; sound discrimination; physical situational awareness." },
      { title: "Manual and mechanical ability", detail: "Fine-motor control; tool use; assembly; repair; fabrication; diagnosing physical systems; learning hands-on procedures." },
      { title: "Gross-motor ability", detail: "Coordination; balance; endurance; strength; movement learning; sports; dance." },
      { title: "Visual design", detail: "Layout; typography; color; visual hierarchy; illustration; photography; interaction design; art direction." },
      { title: "Writing and editing", detail: "Expository, technical, persuasive, and literary writing; editing; voice; rhythm; structure." },
      { title: "Performance and production", detail: "Speaking; acting; music; recording; video; live production; stagecraft; event production." },
      { title: "Practice and mastery", detail: "Imitation; deliberate practice; accepting correction; repetition; procedural memory; developing physical intuition." },
    ],
  },
  {
    code: "SELF",
    title: "Self-knowledge & development",
    description:
      "How accurately you understand yourself and deliberately change future capability.",
    questions: [
      { title: "Introspection", detail: "Recognizing thoughts, feelings, motives, needs, defenses, and recurring patterns." },
      { title: "Metacognition", detail: "Monitoring reasoning; recognizing confusion; detecting bias; knowing what you know; noticing when a model is failing." },
      { title: "Values and preference articulation", detail: "Explaining what matters; distinguishing values from impulses; articulating taste; identifying trade-offs and non-negotiables." },
      { title: "Limits and help-seeking", detail: "Recognizing weak competence; admitting uncertainty; asking for help; accepting complementarity; knowing when expert support is needed." },
      { title: "Learning design", detail: "Choosing learning methods; deliberate and retrieval practice; seeking feedback; transferring learning; calibrating difficulty." },
      { title: "Behavior change", detail: "Habit design; environmental modification; incentives; commitment devices; tracking; relapse recovery; replacing ineffective strategies." },
      { title: "Identity and direction", detail: "Maintaining a coherent self-model; revising identity with evidence; aligning goals with values; separating aspiration from demonstrated reality." },
    ],
  },
  {
    code: "EVT",
    title: "Explorers, Villagers & Town Planners",
    description:
      "Your ability and affinity for different evolutionary modes of work—not a fixed personality label.",
    questions: [
      { title: "Explorer: discovering", detail: "Operating under ambiguity; sensing weak signals; generating hypotheses; combining unrelated ideas; pursuing novel possibilities." },
      { title: "Explorer: experimenting", detail: "Rapid prototyping; cheap failure; exploring without premature structure; learning from failure; abandoning dead ends." },
      { title: "Villager: selecting", detail: "Recognizing which experiments have value; listening to users; choosing what deserves investment; rejecting novelty without utility." },
      { title: "Villager: productizing", detail: "Simplifying; defining an MVP; applying feedback; improving usability; making bespoke work repeatable; developing a coherent product." },
      { title: "Villager: transferring", detail: "Documentation; teaching others; creating standards; cleaning interfaces; packaging knowledge; preparing operational handoffs." },
      { title: "Town Planner: industrializing", detail: "Standardization; automation; reliability; efficiency; cost reduction; capacity planning; operational controls." },
      { title: "Town Planner: maintaining", detail: "Routine operation; metrics; governance; compliance; incremental improvement; maintenance; reducing variance." },
      { title: "Handoffs", detail: "Giving up ownership; accepting unfinished explorer work; translating between modes; preventing premature industrialization; returning operational feedback upstream." },
      { title: "Evolution judgment", detail: "Recognizing capability maturity; choosing build, buy, partner, or outsource; applying stage-appropriate methods; noticing inertia." },
    ],
  },
];
