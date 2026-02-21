import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Built-in starter templates
const BUILT_IN_TEMPLATES = [
  {
    slug: "saas-landing",
    name: "SaaS Landing Page",
    description: "Modern landing page with hero, features, pricing, and CTA sections",
    category: "saas" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/e710dd179056247.Y3JvcCw2MTM2LDQ4MDAsMTM2LDA.png",
    prompt: "Build a modern SaaS landing page with a hero section, features grid, pricing table with 3 tiers, testimonials, and a CTA section. Use a professional blue/indigo color scheme.",
    files: {
      "App.tsx": `export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-xl font-bold text-indigo-600">SaaSify</span>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Get Started</button>
        </div>
      </nav>
      <section className="px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Build Better Products<br/>Ship Faster</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">The all-in-one platform to streamline your workflow and boost productivity.</p>
        <div className="flex gap-4 justify-center">
          <button className="rounded-lg bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700">Start Free Trial</button>
          <button className="rounded-lg border border-gray-300 px-8 py-3 text-gray-700 font-medium hover:bg-gray-50">Live Demo</button>
        </div>
      </section>
      <section id="features" className="px-6 py-20 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {["Analytics Dashboard", "Team Collaboration", "API Integrations"].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 mb-4" />
              <h3 className="font-semibold mb-2">{f}</h3>
              <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}`,
    },
  },
  {
    slug: "dashboard",
    name: "Admin Dashboard",
    description: "Full dashboard with sidebar, charts, tables, and stats cards",
    category: "dashboard" as const,
    type: "app" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/87a08b167464553.Y3JvcCwyNDI0LDE4OTYsMCww.png",
    prompt: "Build an admin dashboard with a sidebar navigation, top stats cards showing revenue/users/orders, a line chart, and a recent orders table.",
    files: {
      "App.tsx": `import { useState } from 'react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const stats = [
    { label: "Revenue", value: "$45,231", change: "+20.1%" },
    { label: "Users", value: "2,350", change: "+15.3%" },
    { label: "Orders", value: "1,247", change: "+8.2%" },
    { label: "Active Now", value: "573", change: "+4.1%" },
  ];
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={sidebarOpen ? "w-64 bg-gray-900 text-white p-4 shrink-0" : "w-16 bg-gray-900 text-white p-2 shrink-0"}>
        <h2 className={sidebarOpen ? "text-lg font-bold mb-8" : "text-xs font-bold mb-8 text-center"}>Dashboard</h2>
        {["Overview", "Analytics", "Customers", "Products", "Settings"].map((item) => (
          <button key={item} className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white mb-1">
            <div className="h-4 w-4 rounded bg-gray-700" />
            {sidebarOpen && <span>{item}</span>}
          </button>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg border px-3 py-1.5 text-sm">Toggle Sidebar</button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
              <p className="text-xs text-green-600 mt-1">{s.change} from last month</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Recent Orders</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="pb-2">Order</th><th className="pb-2">Customer</th><th className="pb-2">Status</th><th className="pb-2 text-right">Amount</th></tr></thead>
            <tbody>
              {[["#3210","Olivia Martin","Shipped","$42.25"],["#3209","Ava Johnson","Processing","$74.99"],["#3208","Michael Wilson","Delivered","$129.00"]].map(([id,name,status,amt]) => (
                <tr key={id} className="border-b last:border-0"><td className="py-3 font-medium">{id}</td><td>{name}</td><td><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{status}</span></td><td className="text-right">{amt}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}`,
    },
  },
  {
    slug: "ecommerce",
    name: "E-Commerce Store",
    description: "Product grid with cart, filters, and checkout flow",
    category: "ecommerce" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/80e774240152341.Y3JvcCwyNjg0LDIxMDAsNTksMA.jpg",
    prompt: "Build a simple e-commerce store with a product grid showing 6 products with images, prices, and add-to-cart buttons. Include a shopping cart sidebar.",
    files: {
      "App.tsx": `import { useState } from 'react';

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const products = [
    { id: 1, name: "Classic T-Shirt", price: 29.99, image: "https://placehold.co/300x300/e2e8f0/475569?text=T-Shirt" },
    { id: 2, name: "Denim Jacket", price: 89.99, image: "https://placehold.co/300x300/dbeafe/3b82f6?text=Jacket" },
    { id: 3, name: "Running Shoes", price: 119.99, image: "https://placehold.co/300x300/dcfce7/22c55e?text=Shoes" },
    { id: 4, name: "Leather Bag", price: 149.99, image: "https://placehold.co/300x300/fef3c7/f59e0b?text=Bag" },
    { id: 5, name: "Sunglasses", price: 59.99, image: "https://placehold.co/300x300/fce7f3/ec4899?text=Glasses" },
    { id: 6, name: "Watch", price: 199.99, image: "https://placehold.co/300x300/f3e8ff/a855f7?text=Watch" },
  ];
  const addToCart = (p) => { setCart([...cart, p]); setCartOpen(true); };
  const total = cart.reduce((s, i) => s + i.price, 0);
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-xl font-bold">Store</span>
        <button onClick={() => setCartOpen(!cartOpen)} className="relative rounded-lg border px-4 py-2 text-sm">
          Cart ({cart.length})
        </button>
      </nav>
      <div className="flex">
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Products</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
                <img src={p.image} alt={p.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-lg font-bold text-gray-900 mt-1">\${p.price}</p>
                  <button onClick={() => addToCart(p)} className="mt-3 w-full rounded-lg bg-black py-2 text-sm text-white hover:bg-gray-800">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </main>
        {cartOpen && (
          <aside className="w-80 border-l p-4 bg-gray-50">
            <h2 className="font-bold mb-4">Shopping Cart</h2>
            {cart.length === 0 ? <p className="text-sm text-gray-500">Cart is empty</p> : cart.map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b text-sm"><span>{item.name}</span><span>\${item.price}</span></div>
            ))}
            {cart.length > 0 && <div className="mt-4 pt-4 border-t"><div className="flex justify-between font-bold"><span>Total</span><span>\${total.toFixed(2)}</span></div><button className="mt-4 w-full rounded-lg bg-black py-2 text-white text-sm">Checkout</button></div>}
          </aside>
        )}
      </div>
    </div>
  );
}`,
    },
  },
  {
    slug: "portfolio",
    name: "Personal Portfolio",
    description: "Clean portfolio with hero, projects, about, and contact sections",
    category: "portfolio" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/c9d2f2220955701.67cc14442a970.jpg",
    prompt: "Build a personal portfolio website with a hero section, projects grid, about section, and contact form.",
    files: {
      "App.tsx": `export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold">John Doe</span>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#work" className="hover:text-gray-900">Work</a>
          <a href="#about" className="hover:text-gray-900">About</a>
          <a href="#contact" className="hover:text-gray-900">Contact</a>
        </div>
      </nav>
      <section className="px-6 py-32 max-w-3xl mx-auto">
        <p className="text-sm text-indigo-600 font-medium mb-4">Full-Stack Developer</p>
        <h1 className="text-5xl font-bold leading-tight mb-6">I build digital experiences that matter.</h1>
        <p className="text-xl text-gray-600">Crafting web applications with clean code and thoughtful design.</p>
      </section>
      <section id="work" className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Selected Work</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {["E-Commerce Platform", "Dashboard App", "Mobile Banking", "AI Chat Tool"].map((p, i) => (
              <div key={i} className="group rounded-xl overflow-hidden border bg-white hover:shadow-lg transition-shadow">
                <div className={"h-48 " + ["bg-indigo-100","bg-emerald-100","bg-amber-100","bg-rose-100"][i]} />
                <div className="p-5"><h3 className="font-semibold text-lg">{p}</h3><p className="text-sm text-gray-500 mt-1">React, TypeScript, Tailwind CSS</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="contact" className="px-6 py-20 max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
        <p className="text-gray-600 mb-8">Interested in working together? Let's chat.</p>
        <a href="mailto:hello@johndoe.com" className="rounded-lg bg-gray-900 px-8 py-3 text-white font-medium hover:bg-gray-800 inline-block">Send Email</a>
      </section>
    </div>
  );
}`,
    },
  },
  {
    slug: "blog",
    name: "Blog",
    description: "Clean blog layout with post list, categories, and article view",
    category: "blog" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/493c7a71486237.Y3JvcCwxNTM0LDEyMDAsMTEsMC.png",
    prompt: "Build a blog with a post list, category filters, and article reading view.",
    files: {
      "App.tsx": `import { useState } from 'react';

export default function App() {
  const [selected, setSelected] = useState(null);
  const posts = [
    { id: 1, title: "Getting Started with React", category: "Tutorial", date: "Dec 15, 2024", excerpt: "Learn the fundamentals of React including components, state, and hooks.", content: "React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small, isolated pieces of code called components..." },
    { id: 2, title: "Tailwind CSS Best Practices", category: "Design", date: "Dec 10, 2024", excerpt: "Tips and tricks for writing clean, maintainable Tailwind CSS.", content: "Tailwind CSS is a utility-first framework that provides low-level utility classes. Here are some best practices for keeping your code clean..." },
    { id: 3, title: "Building REST APIs with Node", category: "Backend", date: "Dec 5, 2024", excerpt: "A comprehensive guide to building production-ready APIs.", content: "Node.js makes it easy to build fast, scalable network applications. Express.js is the most popular framework for building REST APIs..." },
  ];
  if (selected) {
    const post = posts.find(p => p.id === selected);
    return (
      <div className="min-h-screen bg-white"><nav className="border-b px-6 py-4"><button onClick={() => setSelected(null)} className="text-sm text-indigo-600 hover:underline">&larr; Back</button></nav>
        <article className="max-w-2xl mx-auto px-6 py-12"><span className="text-xs text-indigo-600 font-medium">{post.category}</span><h1 className="text-4xl font-bold mt-2 mb-4">{post.title}</h1><p className="text-sm text-gray-500 mb-8">{post.date}</p><p className="text-gray-700 leading-relaxed">{post.content}</p></article>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4"><span className="text-xl font-bold">Blog</span></nav>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Latest Posts</h1>
        <div className="space-y-6">
          {posts.map(p => (
            <article key={p.id} onClick={() => setSelected(p.id)} className="cursor-pointer rounded-xl border p-6 hover:shadow-md transition-shadow">
              <span className="text-xs text-indigo-600 font-medium">{p.category}</span>
              <h2 className="text-xl font-semibold mt-1">{p.title}</h2>
              <p className="text-gray-600 text-sm mt-2">{p.excerpt}</p>
              <p className="text-xs text-gray-400 mt-3">{p.date}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}`,
    },
  },
  {
    slug: "agency",
    name: "Agency Website",
    description: "Creative agency site with portfolio showcase and team section",
    category: "landing" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/d37a67182633761.Y3JvcCwzMDY4LDI0MDAsNjgsMA.png",
    prompt: "Build a creative agency website with a bold hero, portfolio grid, team section, and contact form.",
    files: {},
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    description: "Restaurant website with menu, reservations, and gallery",
    category: "landing" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/4ad23f169134857.Y3JvcCwyMzAxLDE4MDAsNTEsMA.png",
    prompt: "Build a restaurant website with a hero image, food menu with categories, reservation form, and photo gallery.",
    files: {},
  },
  {
    slug: "fitness",
    name: "Fitness App",
    description: "Fitness tracking app with workout plans and progress dashboard",
    category: "dashboard" as const,
    type: "app" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/345528227343721.Y3JvcCwyNzk4LDIxODksMCww.jpg",
    prompt: "Build a fitness app dashboard with workout plans, progress charts, and activity tracking.",
    files: {},
  },
  {
    slug: "travel-blog",
    name: "Travel Blog",
    description: "Travel blog with photo stories, destination guides, and maps",
    category: "blog" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/f8475d199001215.Y3JvcCwzMDY4LDI0MDAsODMsMA.png",
    prompt: "Build a travel blog with featured destinations, photo stories, and a world map.",
    files: {},
  },
  {
    slug: "music-platform",
    name: "Music Platform",
    description: "Music streaming interface with playlists and player controls",
    category: "other" as const,
    type: "app" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/808031207595367.Y3JvcCwzMDY4LDI0MDAsNjgsMA.jpg",
    prompt: "Build a music streaming platform with playlists, album art, and a bottom player bar.",
    files: {},
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description: "Property listings with search, filters, and detail views",
    category: "ecommerce" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/127f27223628637.Y3JvcCwzNjAwLDI4MTUsMCww.jpg",
    prompt: "Build a real estate platform with property listings, search filters, and property detail pages.",
    files: {},
  },
  {
    slug: "ai-startup",
    name: "AI Startup",
    description: "Modern AI startup landing page with demos and pricing",
    category: "saas" as const,
    type: "website" as const,
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/b08ad3230975049.Y3JvcCw0NTE0LDM1MzEsMTQ1LDA.png",
    prompt: "Build an AI startup landing page with a futuristic hero, product demo section, features, and pricing.",
    files: {},
  },
];

export async function GET() {
  const builtIn = BUILT_IN_TEMPLATES.map((t) => ({
    ...t,
    id: t.slug,
    isBuiltIn: true,
  }));

  // Try to also load user-created templates from DB
  let dbEntries: Record<string, unknown>[] = [];
  try {
    const dbTemplates = await db.select().from(templates).orderBy(templates.createdAt);
    dbEntries = dbTemplates.map((t) => ({
      ...t,
      files: JSON.parse(t.files),
      type: "website",
      isBuiltIn: false,
    }));
  } catch {
    // DB might not have templates table yet — just return built-in
  }

  return Response.json({ templates: [...builtIn, ...dbEntries] });
}
