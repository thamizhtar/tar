

## Realtime AI Website Builder (Phone-Only)

### 1. Overview
Create and edit storefront websites entirely from a mobile device. Users interact via AI chat or manual UI controls, with all changes instantly synced and previewed. No desktop/web app required.

---

### 2. User Experience & Flow
**Step 1: Access Editor Link**
- Receive a unique website editor link (QR code or direct link).
- Open the link on phone browser (mobile web app/PWA).

**Step 2: AI Chat Editing**
- In-app AI chat for change requests (e.g., "Add hero section", "Show products grid", "Change background to blue").
- AI interprets requests, updates site structure/content/styles in real time.

**Step 3: Manual Style Editing**
- UI controls for colors, fonts, spacing, images, layout, etc.
- Drag-and-drop for section order, block addition/removal.
- All changes instantly reflected in live preview.

**Step 4: Live Preview & Publish**
- Preview updates as edits are made.
- Publish the site instantly.

---

### 3. InstantDB Schema Plan
```ts
// Storefronts
storefronts: {
  id: string,
  ownerId: string,
  name: string,
  theme: string,
  published: boolean,
  updatedAt: date
}

// Pages
pages: {
  id: string,
  storefrontId: string,
  title: string,
  blocks: Block[], // see below
  updatedAt: date
}

// Blocks (Sections/Elements)
blocks: {
  id: string,
  pageId: string,
  type: string, // e.g. 'hero', 'productGrid', 'testimonial', etc.
  content: json, // AI-generated or user-edited
  style: json, // colors, fonts, spacing, etc.
  order: number
}

// Themes/Styles
themes: {
  id: string,
  name: string,
  variables: json // CSS variables or style tokens
}
```

---

### 4. Standard Homepage Blocks
Universal, best-practice blocks for professional, conversion-optimized homepages. Can be auto-generated or manually built, customized, and rearranged:

- **Hero Section:** Banner with headline, subheadline, call-to-action, background image/video.
- **Navigation Bar:** Logo, menu links, search, user actions.
- **Features/Benefits:** Grid/list of key features/services/benefits.
- **Product/Service Showcase:** Featured products/categories/services with images/descriptions.
- **Testimonials/Reviews:** Customer feedback, ratings, social proof.
- **Call to Action (CTA):** Button/section for sign-up, purchase, contact.
- **About/Story:** Company/brand story, mission, values.
- **Gallery/Media:** Image/video gallery for work, products, events.
- **Contact/Location:** Contact form, address, map, social links.
- **Footer:** Legal, privacy, terms, navigation, social media links.

Blocks are available in the section library. AI assistant can suggest or auto-generate blocks based on business type/goals.

---

### 5. App Design & UI
**Main Screens:**
- Storefront Dashboard (list/manage sites)
- Website Editor (live preview, drag-and-drop, style controls)
- AI Chat (floating/tabbed, natural language editing)
- Style Customizer (color picker, font selector, spacing sliders)
- Section Library (add new blocks/sections)

**UI Elements:**
- Mobile-first, touch-friendly controls
- Real-time preview pane
- AI chat input (text, voice)
- Block/section drag handles
- Style toolbars (color, font, layout)
- Publish button

---

### 6. Technical Architecture
- **InstantDB:** Real-time sync for all edits, multi-user collaboration.
- **Mobile Web App/PWA:** Responsive, installable, offline support.
- **AI Service:** Integrates with OpenAI or similar for section/content generation and style suggestions.
- **Frontend Framework:** React Native Web, Expo, or similar for mobile-first experience.
- **Authentication:** User login, link sharing, permissions.

---

### 7. Milestones (Development Flow)
1. Define and implement InstantDB schemas for storefronts, pages, blocks, themes.
2. Build mobile web app shell (dashboard, editor, preview).
3. Integrate AI chat for section/content generation and editing.
4. Develop manual style editing UI (color, font, layout tools).
5. Implement drag-and-drop and block management.
6. Enable live preview and instant publishing.
7. Add authentication and link sharing.

---

### 8. Style Editor Tool: Plan & Design

**Purpose:**
Enable users to customize the appearance of any block/element (e.g., hero, product grid, button) in real time, directly from their phone.

**Key Features:**
- Select any block/element on the page.
- Edit styles: colors, fonts, spacing, borders, backgrounds, images, shadows, etc.
- See changes instantly in live preview.
- Save style presets or themes.
- Option to reset to default or apply universal styles.

**UI Design:**
Style Editor Panel (Bottom Sheet or Side Drawer):
- Block Selector: Tap to select a block/element (highlighted in preview).
- Tabs/Sections:
  - Colors (background, text, border)
  - Typography (font family, size, weight, line height)
  - Spacing (margin, padding)
  - Borders & Radius
  - Shadows
  - Images/Media (upload, crop, fit)
  - Layout (width, alignment, flex/grid options)
- Live Preview: Changes reflected instantly.
- Presets/Themes: Apply saved styles or global theme.
- Reset/Undo: Revert changes or undo last action.

**Example UI Flow:**
1. Tap a block in the preview.
2. Style editor panel slides up.
3. Select “Colors” tab, pick a new background color.
4. Switch to “Typography” tab, change font.
5. Preview updates instantly.
6. Save as preset or apply to other blocks.

**Technical Implementation:**
- Each block has a `style` JSON object in InstantDB.
- UI controls map directly to style properties (CSS-in-JS or style tokens).
- Changes are synced in real time and reflected in preview.
- Presets/themes stored as reusable style objects.

---


### 9. Notes
- All editing (AI and manual) is mobile-first and real-time.
- No desktop/web app required; everything works on phone browser.
- Designed for speed, simplicity, and instant results.

---

### 10. Efficiency & Enhancement Ideas

- Onboarding wizard and contextual help for new users.
- Duplicate, hide, lock, and group blocks for easier management.
- Bulk style editing and smart grouping for collective changes.
- AI-powered undo/redo and design suggestions.
- Multi-user collaboration and device preview modes.
- Shareable style presets/themes and instant theme switching.
- Optimize for low-bandwidth and accessibility.
- Scheduled publishing and social media preview generation.
- Basic analytics and user feedback for continuous improvement.
