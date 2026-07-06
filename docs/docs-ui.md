Design and build the public docs experience for a buyer help center and AI support assistant.

Product context:

- This is not a developer documentation site and not a deep game wiki.
- The site serves buyers of game accounts.
- The primary goal is to reduce repeated buyer questions before and after purchase.
- Content includes FAQ, purchase flow, account delivery, login issues, binding/unbinding guidance, after-sales rules, account safety notes, and a small amount of lightweight game tips.
- The admin app manages importing, editing, publishing, and indexing content. The docs app is public-facing and focused on reading, searching, and AI Q&A.

Style direction:

- Use a shadcn/ui official docs-inspired layout: calm, structured, readable, precise.
- Keep the visual tone closer to a modern help center than a gaming portal.
- Use neutral backgrounds, subtle borders, small radius, restrained shadows, and clear typography.
- Support light and dark mode.
- Use Tailwind CSS and shadcn/ui components only.
- Reuse the existing UI package when available.
- Use lucide icons for actions and navigation.
- Avoid neon gaming effects, flashy gradients, glassmorphism, oversized marketing heroes, decorative blobs, and heavy illustration-led layouts.
- Do not make the first screen a marketing landing page. Make search, categories, and AI help immediately usable.

Information architecture:

- Help Center Home
  - Top navigation with brand, search, AI assistant entry, and theme toggle.
  - Prominent search input for buyer questions.
  - Category grid for purchase flow, delivery, login, binding, after-sales, safety, FAQ, and game tips.
  - Popular questions section.
  - Recent or recommended articles.
  - Compact AI assistant panel or call-to-action.

- Category Page
  - Left or top category navigation depending on viewport.
  - Article list grouped by topic.
  - FAQ-style quick answers where useful.
  - Search and filtering by tags.

- Article Page
  - shadcn docs-style layout with left navigation, main article, and right table of contents on desktop.
  - On mobile, use a Sheet for navigation.
  - Article content should feel like a practical buyer guide.
  - Show related questions and related articles.
  - Include a contextual "Ask about this article" AI entry.
  - Use callouts for important rules, warnings, and contact-human moments.

- AI Ask Page
  - Chat interface optimized for short support answers.
  - Answers must include source references when available.
  - Show related articles under each answer.
  - Provide a clear human-support fallback when the answer requires order-specific, private, payment, dispute, inventory, or account-sensitive handling.
  - Include suggested question chips such as delivery time, login failure, binding, after-sales rules, and account safety.

- Search Experience
  - Use a command palette or dedicated search modal.
  - Search results should show title, category, excerpt, and type.
  - Prioritize FAQ and exact matches before long articles.

Recommended components:

- Button
- Input
- Textarea
- Card
- Badge
- Accordion
- Alert
- Dialog
- Sheet
- Tabs
- Command
- ScrollArea
- Separator
- Skeleton
- Tooltip

Layout requirements:

- Desktop:
  - Sticky header.
  - Left documentation navigation.
  - Main content column optimized for reading.
  - Right table of contents or related questions column.

- Mobile:
  - Sticky top bar.
  - Search remains easy to access.
  - Navigation opens in a Sheet.
  - AI assistant entry remains visible but unobtrusive.
  - Cards and article content must not overflow.

Content tone:

- Use concise buyer-support language.
- Avoid technical jargon.
- Make answers direct, reassuring, and operational.
- When uncertain, guide the user to contact human support instead of inventing details.
- The final UI copy should be in Simplified Chinese.

RAG and AI behavior hints for UI:

- Show source citations clearly.
- Distinguish "based on help center content" from uncertain responses.
- For private or order-specific questions, show a human-support fallback.
- Keep AI answers short by default, with an option to expand details.
- Surface related articles after AI responses.

Suggested routes:

- /kb/[kbSlug]
- /kb/[kbSlug]/categories/[categorySlug]
- /kb/[kbSlug]/docs/[docSlug]
- /kb/[kbSlug]/ask
- /search

Design outcome:

- The final result should feel like a polished shadcn-style help center for game account buyers.
- It should be practical, searchable, trustworthy, and easy to use on mobile.
- It should make common buyer questions answerable without requiring admin access or manual customer service every time.
