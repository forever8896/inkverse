# Lesson Content Guide for Contributors

## Overview

MonstersInk! uses a clean HTML-based content system with automatic styling. **Contributors write simple HTML** —the platform handles all styling automatically.

## Basic HTML Elements

### Text & Typography

```html
<h1>Main Title</h1>
<h2>Section Heading</h2>
<h3>Subsection</h3>
<p>Regular paragraph text.</p>
<strong>Bold text</strong>
<em>Italic text</em>
```

### Lists

```html
<ul>
  <li>Unordered list item</li>
  <li>Another item</li>
</ul>

<ol>
  <li>Ordered list item</li>
  <li>Second item</li>
</ol>
```

### Code

```html
<code>inline code</code>
```

### Links

```html
<a href="https://example.com" target="_blank">External link</a>
```

---

## Special Components

Use the `data-component` attribute for styled boxes and blocks.

### Info Box (Gray)
Use for: General information, explanations, neutral content

```html
<div data-component="info-box">
Your content here with <strong>formatting</strong> and <code>code</code>
</div>
```

**Preview:** Gray background with slate border

---

### Success Box (Green)
Use for: Achievements, positive messages, real-world applications

```html
<div data-component="success-box">
<strong>Real-World Applications:</strong><br><br>
💰 <strong>DeFi</strong> - Lending without banks<br>
🎮 <strong>Gaming</strong> - Tradeable items
</div>
```

**Preview:** Green background with emerald border

---

### Warning Box (Orange)
Use for: Important notes, cautions, things to remember

```html
<div data-component="warning-box">
<strong>⚠️ Important:</strong> Always test your contracts before deploying!
</div>
```

**Preview:** Orange background with orange border

---

### Highlight Box (Purple)
Use for: Key concepts, rewards, special announcements

```html
<div data-component="highlight-box">
<strong>🎨 One Creature, One Journey</strong><br><br>
Your creature evolves with each lesson completion.
</div>
```

**Preview:** Purple background with purple border

---

### Code Block
Use for: Larger code examples, multi-line snippets

```html
<div data-component="code-block">
#[ink(storage)]
pub struct Flipper {
    value: bool,
}
</div>
```

**Preview:** Dark code block with monospace font

---

## Tables

Tables are automatically styled. Just use standard HTML:

```html
<table>
  <tr>
    <th>Feature</th>
    <th>ink!</th>
    <th>Solidity</th>
  </tr>
  <tr>
    <td>Safety</td>
    <td>Memory safe</td>
    <td>Runtime errors</td>
  </tr>
</table>
```

---

## Complete Example

```html
<h1>Storage: Contract Memory 💾</h1>

<p>Storage is your contract's permanent memory on the blockchain.</p>

<h2>What is Storage?</h2>
<div data-component="info-box">
Think of storage like a <strong>hard drive</strong>:<br><br>
✅ Persists forever<br>
✅ Costs gas to write<br>
✅ Free to read
</div>

<h2>Example Code</h2>
<div data-component="code-block">
#[ink(storage)]
pub struct Creature {
    is_awake: bool,
}
</div>

<div data-component="highlight-box">
<strong>💡 Key Takeaway:</strong> Storage = data your contract remembers!
</div>

<p><strong>Next:</strong> Learn about constructors!</p>
```

---

## Best Practices

### ✅ DO:
- Use semantic HTML (`<h1>`, `<h2>`, `<p>`, etc.)
- Use `data-component` for special boxes
- Keep content concise and focused
- Use emojis sparingly for visual interest
- Break complex topics into steps

### ❌ DON'T:
- Use inline `style` attributes (e.g., `style="color: red;"`)
- Create custom CSS classes
- Use complex HTML structures
- Over-nest elements
- Use deprecated HTML tags

---

## Styling Reference

### Automatic Colors

| Element | Color | Usage |
|---------|-------|-------|
| `<h1>` | Purple | Main headings |
| `<h2>` | Purple (lighter) | Section headings |
| `<h3>` | Cyan | Subsections |
| `<code>` | Purple on dark bg | Inline code |
| `<strong>` | White | Emphasis |
| `<a>` | Cyan | Links |

### Component Colors

| Component | Background | Border | Usage |
|-----------|------------|--------|-------|
| `info-box` | Slate | Gray | Information |
| `success-box` | Emerald | Green | Success, examples |
| `warning-box` | Orange | Orange | Warnings |
| `highlight-box` | Purple | Purple | Key concepts |
| `code-block` | Dark slate | Gray | Code samples |

---

## Content Structure for Lessons

### Recommended Step Structure:

```html
<!-- 1. Main heading with emoji -->
<h1>Topic Name 🚀</h1>

<!-- 2. Opening paragraph -->
<p>Brief introduction to the concept.</p>

<!-- 3. Section heading -->
<h2>What is This?</h2>

<!-- 4. Explanation box -->
<div data-component="info-box">
Clear, simple explanation
</div>

<!-- 5. Details -->
<p>More detailed explanation with <strong>emphasis</strong> and <code>code</code>.</p>

<!-- 6. Optional list -->
<ul>
  <li>Key point one</li>
  <li>Key point two</li>
</ul>

<!-- 7. Code example if relevant -->
<div data-component="code-block">
Code example here
</div>

<!-- 8. Key takeaway -->
<div data-component="highlight-box">
<strong>💡 Remember:</strong> The most important concept.
</div>

<!-- 9. Next step -->
<p><strong>Next:</strong> Brief preview of what's coming.</p>
```

---

## Testing Your Content

1. Save your lesson JSON file
2. View in the lesson interface
3. Check that all components render correctly
4. Verify readability and flow
5. Test on different screen sizes

---

## Questions?

- **Styling not working?** Make sure you're using `data-component`, not `class` or `style`
- **Need a new component type?** Open an issue to discuss with maintainers
- **Unsure about structure?** Look at existing lessons for examples

**Remember:** Focus on content quality. The platform handles the design! 🎨
