import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
// Imported directly rather than via the reviews barrel: the barrel also pulls
// in ReviewForm/ReviewList/ReviewSection and their dependencies, which a unit
// test rendering this component would otherwise have to load.
import { StarRating } from "@/components/reviews/StarRating";
import { FadeIn } from "@/components/common/FadeIn";
import { home } from "@/content/home";
import type { Testimonial } from "@/lib/review-queries";

interface TestimonialsProps {
  testimonials: Testimonial[];
}

/** Real reviews only. Omitted entirely when none qualify — a new store's state. */
export function Testimonials({ testimonials }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section className="container py-16">
      <FadeIn>
        <h2 className="font-heading text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {home.testimonials.title}
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover-lift" data-testid="testimonial-card">
              <CardContent className="p-6">
                <StarRating value={testimonial.rating} size="sm" />
                <p className="mt-4 text-sm leading-relaxed">{testimonial.comment}</p>
                <p className="mt-4 text-sm font-medium">{testimonial.authorName}</p>
                <Link
                  href={`/products/${testimonial.productSlug}`}
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  {testimonial.productName}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
