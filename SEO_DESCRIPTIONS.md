# SEO Meta Descriptions Guide

## What I've Implemented

### 1. Global Site Description
Added to `config.toml`:
```toml
description = "Erika Urano is a filmmaker and artist specializing in narrative films and production design. Explore her portfolio of films, art, and creative work."
```

### 2. Template Logic
Added to `baseof.html` that automatically:
- Uses page-specific `description` if available
- Falls back to page `summary` (truncated to 160 chars)
- Uses global site description as final fallback

### 3. Dynamic Page Titles
- Homepage: "Erika Urano"
- Other pages: "Page Title | Erika Urano"

## How to Add Page-Specific Descriptions

### For Section Pages (e.g., /films/, /art/, /about/)
Add `description` to your content files:

```markdown
---
title: "Films"
description: "Watch Erika Urano's narrative films including 'Nowhere to Hide', 'The Room without Walls', and other directorial works."
---
```

### For Individual Film Pages
```markdown
---
title: "Nowhere to Hide"
description: "A 2023 narrative film directed and written by Erika Urano. Watch the full film and explore behind-the-scenes content."
year: "2023"
roles: ["Director", "Writer"]
---
```

### Best Practices for Meta Descriptions

#### Length Guidelines:
- **Optimal**: 150-160 characters
- **Maximum**: 160 characters (Google truncates after this)
- **Minimum**: 120 characters for good coverage

#### Content Guidelines:
- **Include target keywords** naturally
- **Make it compelling** (encourage clicks)
- **Be specific** about the page content
- **Include a call-to-action** when appropriate
- **Avoid keyword stuffing**

#### Example Descriptions by Page Type:

**Homepage:**
```
"Erika Urano is a filmmaker and artist specializing in narrative films and production design. Explore her portfolio of films, art, and creative work."
```

**Films Section:**
```
"Watch Erika Urano's narrative films including 'Nowhere to Hide', 'The Room without Walls', and other directorial works spanning 2021-2023."
```

**About Page:**
```
"Learn about filmmaker and artist Erika Urano's background in directing, writing, and production design. Connect with her work and creative journey."
```

**Art Section:**
```
"Explore Erika Urano's art portfolio featuring production design, visual art, and creative projects alongside her filmmaking work."
```

**Individual Film:**
```
"'Nowhere to Hide' (2023) - A narrative film directed and written by Erika Urano. Watch the full film and explore the creative process."
```

## Current Status

✅ **Global description** set in config.toml
✅ **Template logic** implemented in baseof.html
✅ **Homepage description** added to content/_index.md
✅ **Dynamic titles** implemented

## Next Steps

1. Add descriptions to section pages:
   - `content/films/_index.md`
   - `content/art/_index.md`
   - `content/about/_index.md`

2. Add descriptions to individual content files as needed

3. Test with `hugo server` and check source code for meta tags

## Testing

After adding descriptions, verify they appear in:
1. **View source** → Look for `<meta name="description" content="...">`
2. **Google Search Console** → Check how pages appear in search
3. **Social media sharing** → Verify correct descriptions appear
4. **PageSpeed Insights** → Should resolve the "missing meta description" warning

## SEO Impact

- ✅ Resolves PageSpeed "missing meta description" warning
- 🎯 Improves search result click-through rates
- 📱 Better social media sharing appearance
- 🔍 Helps search engines understand page content 
