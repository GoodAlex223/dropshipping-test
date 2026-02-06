// Review seed data - only for DELIVERED orders

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const reviews = [
  // Reviews for order ORD-2026-0001 (John Smith - headphones, USB cables)
  {
    customerEmail: "customer@example.com",
    productSku: "ELEC-001",
    orderNumber: "ORD-2026-0001",
    rating: 5,
    comment:
      "Absolutely love these headphones! The noise cancellation is incredible - I can't hear anything around me when I'm working. Battery life is exactly as advertised. Highly recommend!",
    adminReply:
      "Thank you so much for your glowing review, John! We're thrilled the noise cancellation is working perfectly for you. Enjoy your music!",
    adminRepliedAt: daysAgo(40),
    createdAt: daysAgo(42),
  },
  {
    customerEmail: "customer@example.com",
    productSku: "ELEC-003",
    orderNumber: "ORD-2026-0001",
    rating: 4,
    comment:
      "Good quality cables that charge fast. The braided design feels durable. Only wish the 6ft one was a bit longer, but overall great value for a 2-pack.",
    createdAt: daysAgo(43),
  },

  // Reviews for order ORD-2026-0002 (Sarah Wilson - dress, bag)
  {
    customerEmail: "sarah.wilson@example.com",
    productSku: "CLOTH-003",
    orderNumber: "ORD-2026-0002",
    rating: 5,
    comment:
      "This dress is even prettier in person! The fabric is so soft and flows beautifully. I wore it to a garden party and got so many compliments. Fits true to size.",
    adminReply:
      "We're so happy you love the dress, Sarah! Thank you for sharing - you must have looked gorgeous at the party! 🌸",
    adminRepliedAt: daysAgo(33),
    createdAt: daysAgo(35),
  },
  {
    customerEmail: "sarah.wilson@example.com",
    productSku: "CLOTH-005",
    orderNumber: "ORD-2026-0002",
    rating: 4,
    comment:
      "Beautiful bag with nice leather quality. The strap is comfortable and adjustable. Took off one star because it's slightly smaller than I expected, but it still fits my essentials.",
    createdAt: daysAgo(34),
  },

  // Reviews for order ORD-2026-0003 (Mike Johnson - dumbbells, yoga mat)
  {
    customerEmail: "mike.johnson@example.com",
    productSku: "SPORT-001",
    orderNumber: "ORD-2026-0003",
    rating: 5,
    comment:
      "Game changer for my home gym! The dial system is smooth and easy to adjust between exercises. Build quality is solid and they look great. Worth every penny.",
    adminReply:
      "Awesome to hear the dumbbells are elevating your home workouts, Mike! Thanks for the detailed review. Keep crushing those gains! 💪",
    adminRepliedAt: daysAgo(25),
    createdAt: daysAgo(27),
  },
  {
    customerEmail: "mike.johnson@example.com",
    productSku: "SPORT-002",
    orderNumber: "ORD-2026-0003",
    rating: 3,
    comment:
      "The mat is decent quality and the thickness is nice for floor exercises. However, it has a slight rubbery smell that took about a week to go away. The carrying strap is useful.",
    createdAt: daysAgo(26),
  },

  // Reviews for order ORD-2026-0004 (Emily Chen - armchair, plant pots)
  {
    customerEmail: "emily.chen@example.com",
    productSku: "HOME-001",
    orderNumber: "ORD-2026-0004",
    rating: 4,
    comment:
      "Really comfortable chair with a mid-century look I was going for. Assembly took about 30 minutes. The sage green color is beautiful. Only complaint is the instructions could be clearer.",
    adminReply:
      "Thank you for your feedback, Emily! We're glad you love the chair. We've noted your suggestion about the instructions for improvement.",
    adminRepliedAt: daysAgo(20),
    createdAt: daysAgo(22),
  },
  {
    customerEmail: "emily.chen@example.com",
    productSku: "HOME-003",
    orderNumber: "ORD-2026-0004",
    rating: 5,
    comment:
      "These pots are exactly what I needed for my plant collection! The matte finish looks so elegant, and I love that they have drainage holes. Already ordered another set!",
    createdAt: daysAgo(21),
  },
];
