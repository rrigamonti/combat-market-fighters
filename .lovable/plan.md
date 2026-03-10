

## Update FAQ Section with Official Content

Replace the current 4 FAQ items in `src/pages/LandingV2.tsx` with all 17 questions from the uploaded PDF document.

### Changes

**File: `src/pages/LandingV2.tsx`** (lines 43-60)

Replace the `faqItems` array with 17 items extracted from the PDF:

1. What is Combat Market?
2. How do I get invited?
3. What brands can I add to my storefront?
4. How do earnings work?
5. How do I get paid?
6. Do I need to change the products I use?
7. Is this just another affiliate program?
8. Can I refer other fighters and earn commission?
9. How do I promote my storefront?
10. Do I need to constantly sell to make money?
11. Who handles brand negotiations?
12. Do I get ongoing support?
13. Do I receive products?
14. How much does it cost to join?
15. How do you know what products I use?
16. Is Combat Market a sponsorship?
17. Can I still work with other brands and sponsors?

Each answer will be condensed into a clean 1-3 sentence format suitable for the accordion UI, preserving the key message from the PDF while keeping it scannable. The `FAQSchema` structured data will automatically pick up the new items since it already reads from this array.

No new files or database changes needed.

