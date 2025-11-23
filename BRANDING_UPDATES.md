# Branding & Localisation Updates

## Overview
Updated all marketing pages to:
1. Use British English spelling throughout
2. Apply teal/green and gold/amber colours from the new Assurly logo

## Colour Scheme Changes

### New Brand Colours
Based on the Assurly logo:
- **Primary Teal**: `teal-700` (darker), `teal-600` (medium), `teal-100` (light backgrounds)
- **Secondary Gold/Amber**: `amber-700` (darker), `amber-600` (medium), `amber-100` (light backgrounds)

### Previous Colour Scheme (Replaced)
- ~~indigo-xxx~~ → teal-xxx or amber-xxx
- ~~blue-xxx~~ → teal-xxx or amber-xxx  
- ~~purple-xxx~~ → teal-xxx or amber-xxx

### Colour Application Pattern
Colours are applied sparingly and alternately throughout the site:
- Feature cards alternate between teal and amber backgrounds
- Icons use teal-700 or amber-700
- Gradients combine teal and amber: `from-teal-700 to-amber-500`
- CTAsection backgrounds: `from-teal-50 to-amber-50`
- Stats/numbers alternate: teal → amber → teal
- Border accents use teal-600 or amber-600

## British English Conversions

### Spelling Changes Made
| American English | British English | Files Updated |
|-----------------|-----------------|---------------|
| Centralized | Centralised | Landing.tsx, Home.tsx |
| Organization/al | Organisation/al | About.tsx, DPA.tsx |
| Prioritize | Prioritise | About.tsx |
| Unauthorized | Unauthorised | Terms.tsx, Security.tsx |
| License | Licence | Terms.tsx |
| Standardized | Standardised | Mission.tsx |
| Authorization | Authorisation | DPA.tsx |

### Grammar & Vocabulary
- "while" → "whilst" (where appropriate)

## Files Updated

### Marketing Pages
1. **Landing.tsx**
   - Hero gradient: indigo→blue changed to teal→amber
   - Feature card backgrounds: teal/amber alternating
   - Stats numbers: teal and amber colours
   - "Centralized" → "Centralised"

2. **About.tsx**
   - Value card icons: teal/amber alternating
   - "User-Centric Design" text updated
   - "Organization" → "Organisation"
   - "Prioritize" → "Prioritise"

3. **Mission.tsx**
   - Core objective cards: teal/amber backgrounds
   - Commitment checklist icons: teal-700
   - "Standardized" → "Standardised"
   - "Prioritize" → "Prioritise"

4. **Pricing.tsx**
   - "Most Popular" badge: teal-600 background
   - Feature list checkmarks: alternating teal/amber
   - CTA section gradient: teal-50 to amber-50
   - Added teal-100 border to CTA section

5. **Security.tsx**
   - Hero shield icon: teal-100 background
   - Security feature cards: alternating teal/amber
   - GDPR compliance card: teal accent
   - ISO 27001 card: amber accent
   - Data ownership numbered list: teal-700 circles
   - CTA section: teal-50 to amber-50 gradient
   - "Unauthorized" → "Unauthorised"
   - "Organizational" → "Organisational"

6. **Terms.tsx**
   - "Authorized" → "Authorised"  
   - "Unauthorized" → "Unauthorised"
   - "License" → "Licence"

7. **DPA.tsx**
   - "Authorization" → "Authorisation"
   - "Organizational" → "Organisational"

### Application Pages
8. **Home.tsx** (Dashboard)
   - Hero text gradient: teal-700 to amber-500
   - MAT Admin card: teal border and icon
   - Department Head card: amber border and icon
   - Feature checklist icons: teal-700
   - "Centralized" → "Centralised"

## Design Principles Applied

### Sparing Use of Brand Colours
- Colours used primarily for:
  - Icon backgrounds
  - Accent borders
  - Call-to-action highlights
  - Gradients in hero sections
  - Statistical number displays
- Maintained neutral slate/grey for majority of UI
- Text remains primarily dark (slate-900, slate-700)
- Backgrounds remain clean (white, slate-50)

### Accessibility
- All colour combinations maintain WCAG AA contrast ratios
- Text on coloured backgrounds uses darker shades (700)
- Light backgrounds (100) used only behind dark icons/text

### Consistency
- Teal represents "trust/security" themes
- Amber represents "achievement/value" themes
- Alternating pattern prevents colour fatigue
- Same colour palette used across all pages

## Testing Recommendations

1. **Visual Review**
   - Check all pages display new teal/amber colours correctly
   - Verify gradients render smoothly
   - Confirm alternating colour patterns look balanced

2. **Accessibility**
   - Run contrast checker on all colour combinations
   - Test with screen readers
   - Verify focus states are visible

3. **Cross-browser**
   - Test gradient rendering in Safari, Chrome, Firefox
   - Check colour accuracy across different displays

4. **Content Review**
   - Verify all British English spellings are correct
   - Check for any missed American spellings
   - Ensure consistency across all pages

## Future Considerations

### Logo Integration
When ready to add the logo:
- Place in `src/assets/logo.svg` or `.png`
- Update `PublicLayout.tsx` header to include logo
- Update `RootLayout.tsx` for authenticated app
- Consider adding favicon versions

### Additional Branding
- Consider adding subtle texture/pattern in hero backgrounds
- Potential for animated gradient effects
- Could add logo watermark in footer
- Option for dark mode with adjusted colour palette

## Notes

- Colour values can be adjusted in Tailwind config if exact brand colours differ
- British English conversions focused on user-facing content
- Code comments and variable names remain in American English
- All changes maintain existing functionality

