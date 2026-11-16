# PatternNest admin guide

Sign in at **/admin** with the admin email and password (see the README). The left sidebar has every tool;
badges show unread messages and reviews waiting for moderation. Every change you save goes live on the public
site immediately.

---

## Adding a product

1. Go to **Products → New product**.
2. **Basics** — enter the title. The URL slug is generated from the title (you can override it). The SKU must be
   unique; a suggestion is pre-filled.
3. **Description** — use the editor toolbar for headings, lists, bold/italic, quotes and links. Formatting is
   cleaned automatically when you save.
4. **Images** — drag & drop files onto the upload area (or click *Choose files*). Each image is optimised into
   three WebP sizes automatically. Drag thumbnails to reorder; the **first image is the cover** (or click *Cover*
   on any thumbnail).
5. **Organisation** — choose category, subcategory, designer and difficulty; toggle the languages; set the file
   format. Optionally paste an external **“Get Pattern” link** (e.g. the designer’s shop). Without a link,
   visitors see a request form and their message arrives in **Messages**.
6. **Pricing** — set the price. To show a sale, enter a higher **Old price**: the discount % is calculated
   automatically. Ticking **Free** in the Flags box sets the price to 0.
7. **Flags** (right column) — Free, Bestseller, New, Sponsored, Featured, Video tutorial. These drive the homepage
   sections, badges and filters.
8. **SEO** — meta title and description are optional; sensible defaults are generated if left empty.
9. Check the **Live card preview**, then click **Publish** (or **Save as draft** to keep it hidden).

Other actions on the edit page: **View** (opens the public page), **Duplicate** (creates a draft copy with a new
SKU — handy for pattern variations), **Delete**.

### Managing many products at once

On **Products**, search by title/SKU/designer, filter by status, category, free/paid/on sale and flag, and sort by
clicking column headers. Tick rows (or the header checkbox for the whole page) and use the bulk bar to
**publish, unpublish, delete, change category, set a discount %** (0 removes discounts) or **add/remove a flag**.

---

## Importing a CSV

Use this for hundreds or thousands of products. Go to **Bulk import**.

1. **Download the template** (*CSV template* button) or try the *Sample (20 rows)* first. Columns:

   | Column | Notes |
   | --- | --- |
   | `sku` | **Required**, unique. Used to detect duplicates |
   | `title` | **Required** |
   | `description` | Plain text or simple HTML |
   | `category`, `subcategory` | Category name; **missing categories are created automatically** |
   | `designer` | Designer name; **missing designers are created automatically** |
   | `price`, `old_price`, `currency` | Numbers like `4.95`; currency `USD` or `EUR`. Old price > price = sale |
   | `is_free`, `has_video`, `is_bestseller`, `is_new`, `is_sponsored` | `true/false`, `yes/no` or `1/0` |
   | `difficulty` | `beginner`, `intermediate` or `advanced` |
   | `language` | One or more, separated by `|` (e.g. `English|German`) |
   | `file_format` | e.g. `PDF` |
   | `image_urls` | One or more image URLs separated by `|` |
   | `get_pattern_url` | Optional external link |
   | `status` | `published` or `draft` |
   | `rating`, `review_count` | Optional numbers |

2. **Upload** — drag your CSV, XLSX or JSON file (max 20 MB) onto the drop zone.
3. **Map columns** — columns are matched automatically (also common alternative names). Fix any mapping with
   the dropdowns; unmapped optional fields are simply left empty.
4. **Validate** — the first 50 rows are shown with problems highlighted in red. Click **Error report (CSV)**
   for a list of every problem in the whole file. Rows with errors are not imported (they count as *failed*);
   fix them and re-upload if needed.
5. **Options**
   - **Duplicates:** *Skip* rows whose SKU already exists, or *Update existing* products (matched by SKU, then slug).
   - **Import as draft:** everything is created hidden, so you can review before publishing.
   - **Images ZIP (optional):** upload a ZIP whose image file names match the SKU — `SKU.jpg`, `SKU-2.jpg`,
     `SKU_3.png`. ZIP images take priority over `image_urls` for that SKU.
6. **Run** — the import runs in the background in batches of 100 rows. You can watch the progress bar (and
   leave the page; progress continues). At the end you get a summary: **created, updated, skipped, failed**, plus a
   list of any images that could not be downloaded (they are retried 3 times first).

**Import history** (bottom of the page) lists every import. **Rollback** undoes a whole import: products it
created are deleted, products it updated are restored to their previous values, and categories/designers it
created are removed if they are now empty.

Tips:
- Image URLs must be publicly reachable `https://` links (private/internal addresses are blocked for security).
- Very large catalogues: split into files of ~5,000 rows for easier error handling.

---

## Managing the homepage

Go to **Homepage**.

- **Hero** — edit the headline and subtitle shown at the top of the site.
- **Free patterns banner** — title (e.g. “4,300+ Free Patterns”) and text.
- **Counters** — the four “Why PatternNest” numbers (e.g. `117,900+`, `53M+`, `4.8★`); they animate on the site.
- **Sections** — for Craft Highlights, Current Bestsellers, On Sale, New Arrivals, Sponsored Products and Free
  Patterns, click **Add** to search and pick published products. Drag the handle or use the arrows to reorder,
  ✕ to remove. If you pick fewer products than the section shows (8, or 4 for On Sale/Free), the remaining
  slots are filled automatically from products with the matching flag — so a section is never empty.

Click **Save homepage**; the changes are live immediately.

---

## Everything else

- **Categories** — create/edit/reorder categories (lower *Order* shows first), their subcategories (comma
  separated) and image. A category can only be deleted when it has no products.
- **Designers** — name, bio and avatar. Only designers without products can be deleted.
- **Articles** — write guides with the same editor, add a cover image, publish or keep as draft.
- **Reviews** — new visitor reviews wait in *Pending*. **Approve** publishes the review and updates the product’s
  rating; **Reject** deletes it; **Unpublish** moves an approved review back to pending.
- **Subscribers** — newsletter sign-ups; **Export CSV** for your email tool.
- **Messages** — contact form and pattern requests. Click a message to read it (marks it read), reply by email,
  mark unread or delete.
- **Settings** — site name, tagline, logo, brand colors (with preview and reset) and footer columns/links.
