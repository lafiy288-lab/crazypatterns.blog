// Seeds PatternNest with 6 categories, 15 designers, 60 products, 30 reviews,
// 8 articles, default settings and the admin account. Safe to re-run: it wipes
// the catalogue tables first.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generateAvatar, generatePlaceholders } from "./placeholders";

const prisma = new PrismaClient();

// Deterministic pseudo-random numbers so every seed run produces the same data.
let state = 42;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CATEGORIES = [
  { key: "crochet", name: "Crochet", description: "Amigurumi friends, cosy blankets, flowers and wearables made with a hook.", subs: ["Amigurumi", "Blankets", "Flowers", "Bags", "Wearables"] },
  { key: "knitting", name: "Knitting", description: "Sweaters, socks, shawls and accessories for every needle size.", subs: ["Sweaters", "Socks", "Shawls", "Hats", "Baby"] },
  { key: "sewing", name: "Sewing", description: "Beginner-friendly sewing patterns for bags, clothing and home décor.", subs: ["Bags", "Dresses", "Kids", "Home", "Accessories"] },
  { key: "crafts", name: "Crafts", description: "Paper, macramé, decorations and gifts you can make in an afternoon.", subs: ["Paper", "Macramé", "Decorations", "Gifts"] },
  { key: "felting", name: "Felting", description: "Needle and wet felting projects from tiny animals to cosy slippers.", subs: ["Needle felting", "Wet felting", "Animals", "Decor"] },
  { key: "embroidery", name: "Embroidery", description: "Hoop art, cross stitch and modern embroidery designs.", subs: ["Hoop art", "Cross stitch", "Botanical", "Lettering"] },
] as const;

const DESIGNERS = [
  ["Mira Holloway", "Mira designs playful amigurumi with clear photo tutorials for every round."],
  ["Jonas Feldmann", "Knitwear designer focused on seamless top-down sweaters and colourwork."],
  ["Aiko Tanabe", "Minimalist embroidery inspired by botanical sketches and Japanese stitching."],
  ["Lena Vossberg", "Sewing teacher with a love for practical bags and beginner-friendly garments."],
  ["Priya Raman", "Colourful crochet blankets and granny squares with modern palettes."],
  ["Oskar Lindqvist", "Needle-felted woodland creatures and seasonal decorations."],
  ["Clara Bennett", "Cosy socks and shawls with easy-to-memorise lace repeats."],
  ["Theo Marchetti", "Upcycled sewing projects and zero-waste pattern layouts."],
  ["Hana Kowalska", "Crochet flowers and bouquets that last forever."],
  ["Ruth Okafor", "Bold modern cross stitch and lettering samplers."],
  ["Elise Durand", "Paper crafts, macramé and handmade gift ideas."],
  ["Sami Virtanen", "Wet-felted slippers, bowls and textured wall pieces."],
  ["Nora Albrecht", "Baby knits and heirloom blankets with step-by-step videos."],
  ["Felix Ward", "Structured bags, pouches and accessories with pro finishing tips."],
  ["Ivy Castellano", "Whimsical wearables and accessories in crochet and knit."],
] as const;

const TITLES: Record<string, string[]> = {
  crochet: ["Sleepy Fox Amigurumi", "Sunburst Granny Blanket", "Everlasting Crochet Tulips", "Market Day Mesh Bag", "Cloud Cardigan", "Tiny Octopus Keyring", "Wildflower Crochet Bouquet", "Chunky Ribbed Beanie", "Honeycomb Baby Blanket", "Little Bee Amigurumi"],
  knitting: ["Fjord Colourwork Sweater", "Weekend Ribbed Socks", "Seaside Lace Shawl", "Pinecone Cable Hat", "First Steps Baby Cardigan", "Brioche Cowl Duo", "Harbour Fisherman Sweater", "Twisted Stitch Mittens", "Meadow Striped Scarf", "Cosy Bed Socks"],
  sewing: ["Everyday Tote Bag", "Linen Wrap Dress", "Kids' Reversible Apron", "Quilted Pot Holders", "Zip Pouch Trio", "Patchwork Cushion Cover", "Gathered Summer Skirt", "Bucket Hat for All Ages", "Roll-Top Backpack", "Fabric Storage Baskets"],
  crafts: ["Paper Lantern Garland", "Macramé Plant Hanger", "Pressed Flower Bookmarks", "Woven Wall Hanging", "Handmade Gift Boxes", "Origami Star Mobile", "Clay Bead Necklace", "Scandinavian Paper Stars", "Felt Advent Calendar", "Rope Coasters Set"],
  felting: ["Needle-Felted Hedgehog", "Wet-Felted Slippers", "Felted Mushroom Village", "Tiny Felted Bunny", "Felted Pebble Bowl", "Woodland Fox Brooch", "Felted Christmas Robin", "Felt Ball Garland", "Sleeping Kitten Figurine", "Felted Succulent Pot"],
  embroidery: ["Botanical Hoop Sampler", "Moonlit Garden Hoop", "Modern Alphabet Cross Stitch", "Lavender Sprig Embroidery", "Mountain Sunset Hoop", "Wildflower Collar Embroidery", "Lettering 'Home' Sampler", "Folk Floral Cross Stitch", "Mini Cactus Hoops", "Ocean Waves Embroidery"],
};

const LANG_SETS = [["English"], ["English", "German"], ["English", "French"], ["English", "Spanish"], ["English", "German", "Dutch"], ["English", "Italian"]];

const description = (title: string, cat: string, difficulty: string) => `
<p>${title} is ${difficulty === "beginner" ? "a" : "an"} ${difficulty}-friendly ${cat.toLowerCase()} pattern written with clear, step-by-step instructions and plenty of process photos.</p>
<h3>What's included</h3>
<ul>
  <li>Printable PDF with written instructions${cat === "Knitting" || cat === "Crochet" ? " and charts" : ""}</li>
  <li>Materials list, sizing notes and finishing tips</li>
  <li>Photo tutorial for the trickiest steps</li>
</ul>
<h3>Skills you'll practise</h3>
<p>Each section builds on the previous one, so you can follow along even if this is your first project of this kind. Experienced makers will enjoy the thoughtful details and finishing techniques.</p>
<p><em>Digital pattern only. No physical item will be shipped.</em></p>`;

const REVIEW_TEXTS = [
  "Clear instructions and lovely photos. My first try came out exactly like the picture!",
  "The video made all the difference. I finally understand how to do this stitch.",
  "Beautiful design and very well written. Already planning my second one.",
  "Perfect weekend project. The materials list was spot on.",
  "Great pattern for beginners, I learned a lot of new techniques.",
  "The finishing tips are gold. My project looks so professional now.",
  "I made three of these as gifts and everyone loved them.",
  "Well structured and easy to follow, even with my limited experience.",
  "Such a fun pattern! The designer clearly tested it carefully.",
  "Charts and written instructions both included — exactly what I needed.",
];
const REVIEWERS = ["Anna K.", "Marco P.", "Sophie L.", "Grace T.", "Daniel R.", "Emma W.", "Yuki S.", "Laura M.", "Ben H.", "Olivia F.", "Fatima A.", "Chloe D.", "Noah B.", "Isla G.", "Hannah V."];

const ARTICLES = [
  { title: "10 Crochet Stitches Every Beginner Should Know", excerpt: "Master these foundation stitches and you can follow almost any crochet pattern." },
  { title: "How to Choose the Right Yarn Weight", excerpt: "From lace to super bulky: a friendly guide to yarn weights and when to use them." },
  { title: "Reading Knitting Charts Without the Stress", excerpt: "Charts look intimidating, but they are just a picture of your knitting. Here's how to read them." },
  { title: "Your First Sewing Machine Project", excerpt: "A simple tote bag is the perfect way to get comfortable with your machine." },
  { title: "Needle Felting 101: Tools and Safety", excerpt: "Everything you need to start needle felting safely and confidently." },
  { title: "Embroidery Hoop Art: Framing Your Finished Piece", excerpt: "Give your stitching a clean, gallery-ready finish with these simple steps." },
  { title: "Organising Your Craft Stash", excerpt: "Practical storage ideas so you can always find the right yarn, fabric or floss." },
  { title: "Gift Ideas You Can Make in a Weekend", excerpt: "Quick, thoughtful handmade gifts for birthdays, holidays and hosts." },
];

const articleContent = (title: string) => `
<p>Whether you're just getting started or looking to sharpen your skills, ${title.toLowerCase()} is a topic that comes up again and again in our community. In this guide we break it down into small, practical steps.</p>
<h2>Start with the basics</h2>
<p>Gather your materials before you begin and give yourself a calm, well-lit space to work. Small preparations like these make the learning curve much gentler.</p>
<ul><li>Choose materials you enjoy touching and looking at</li><li>Keep a notebook for gauge, sizes and changes</li><li>Take photos of your progress — it's motivating!</li></ul>
<h2>Practise in short sessions</h2>
<p>Twenty focused minutes a day beats a frantic weekend marathon. Muscle memory builds quickly when you repeat a technique often.</p>
<blockquote>Every expert maker once struggled with their very first stitch.</blockquote>
<h2>Where to go next</h2>
<p>Browse our free patterns to put your new skills into practice, and look for patterns marked with the video badge if you prefer to learn by watching.</p>`;

async function main() {
  console.log("Rendering placeholder artwork…");
  const art = await generatePlaceholders(6);

  console.log("Clearing catalogue tables…");
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.designer.deleteMany();
  await prisma.article.deleteMany();
  await prisma.importJob.deleteMany();

  console.log("Creating categories and designers…");
  const categories = [];
  for (const [i, c] of CATEGORIES.entries()) {
    categories.push(
      await prisma.category.create({
        data: { name: c.name, slug: c.key, description: c.description, image: art.categories[c.key], subcategories: JSON.stringify(c.subs), sortOrder: i },
      }),
    );
  }
  const designers = [];
  for (const [i, [name, bio]] of DESIGNERS.entries()) {
    const initials = name.split(" ").map((p) => p[0]).join("");
    const avatar = await generateAvatar(`avatar-${slugify(name)}.webp`, initials, i);
    designers.push(await prisma.designer.create({ data: { name, slug: slugify(name), bio, avatar } }));
  }

  console.log("Creating 60 products…");
  const products = [];
  let n = 0;
  for (const [ci, c] of CATEGORIES.entries()) {
    const category = categories[ci];
    for (const [ti, title] of TITLES[c.key].entries()) {
      n++;
      const imgs = art.products[c.key];
      const images = [0, 1, 2].map((k) => {
        const img = imgs[(ti + k) % imgs.length];
        return { url: img.url, thumb: img.url, medium: img.url, large: img.url, blur: img.blur, alt: `${title} – ${c.name} pattern photo ${k + 1}` };
      });
      const isFree = n % 6 === 0;
      const basePrice = isFree ? 0 : Number((3.95 + Math.floor(rand() * 9) + pick([0.45, 0.5, 0.95, 0.0])).toFixed(2));
      const onSale = !isFree && n % 5 === 1;
      const discount = onSale ? pick([10, 20, 30]) : 0;
      const price = onSale ? Number((basePrice * (1 - discount / 100)).toFixed(2)) : basePrice;
      const difficulty = (["beginner", "intermediate", "advanced"] as const)[(ti + ci) % 3];
      const designer = designers[(ci * 3 + ti) % designers.length];
      const createdAt = new Date(Date.now() - (60 - n) * 36 * 3600 * 1000 - Math.floor(rand() * 3600000));
      products.push(
        await prisma.product.create({
          data: {
            slug: slugify(title),
            sku: `PN-${c.key.slice(0, 3).toUpperCase()}-${String(ti + 1).padStart(3, "0")}`,
            title,
            description: description(title, c.name, difficulty).trim(),
            price,
            oldPrice: onSale ? basePrice : null,
            currency: "USD",
            discountPercent: discount,
            images: JSON.stringify(images),
            categoryId: category.id,
            subcategory: c.subs[ti % c.subs.length],
            designerId: designer.id,
            difficulty,
            languages: JSON.stringify(LANG_SETS[(ti + ci) % LANG_SETS.length]),
            fileFormat: "PDF",
            hasVideo: n % 3 === 0,
            isFree,
            isBestseller: n % 4 === 0 || n % 7 === 0,
            isNew: n > 44 || n % 9 === 0,
            isSponsored: n % 5 === 3,
            isFeatured: n % 4 === 1 || n % 11 === 0,
            rating: Number((4 + rand() * 1).toFixed(1)),
            reviewCount: 5 + Math.floor(rand() * 480),
            getPatternUrl: null,
            metaTitle: `${title} – ${c.name} Pattern`,
            metaDescription: `Download the ${title} ${c.name.toLowerCase()} pattern by ${designer.name}. Step-by-step PDF instructions${n % 3 === 0 ? " with video tutorial" : ""}.`,
            status: "published",
            createdAt,
          },
        }),
      );
    }
  }

  console.log("Creating 30 reviews…");
  for (let i = 0; i < 30; i++) {
    const product = products[(i * 7) % products.length];
    await prisma.review.create({
      data: {
        productId: product.id,
        name: REVIEWERS[i % REVIEWERS.length],
        rating: i % 6 === 5 ? 4 : 5,
        text: REVIEW_TEXTS[i % REVIEW_TEXTS.length],
        status: i < 26 ? "approved" : "pending",
        createdAt: new Date(Date.now() - i * 86400000),
      },
    });
  }

  console.log("Creating 8 articles…");
  for (const [i, a] of ARTICLES.entries()) {
    await prisma.article.create({
      data: {
        title: a.title,
        slug: slugify(a.title),
        excerpt: a.excerpt,
        cover: art.articles[i],
        content: articleContent(a.title).trim(),
        status: "published",
        createdAt: new Date(Date.now() - i * 4 * 86400000),
      },
    });
  }

  await prisma.setting.deleteMany({ where: { key: "homepage" } });

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && !(await prisma.admin.findUnique({ where: { email } }))) {
    await prisma.admin.deleteMany();
    await prisma.admin.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Admin account created for ${email}`);
  }

  console.log(`Done: ${categories.length} categories, ${designers.length} designers, ${products.length} products, 30 reviews, ${ARTICLES.length} articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
