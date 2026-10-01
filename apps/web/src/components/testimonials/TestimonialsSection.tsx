import { PawIcon, SparkMarks } from '../about/AboutIcons';
import './testimonials.css';

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'priya',
    quote:
      'Basera made the adoption process so much easier. We found our perfect companion and the guidance along the way was incredible!',
    name: 'Priya Sharma',
    role: 'Pet parent · Noida',
  },
  {
    id: 'rahul',
    quote:
      'The training tips are simple, practical and actually work. My puppy has become much calmer and happier. The daily reminders really help!',
    name: 'Rahul Mehta',
    role: 'Dog parent · Delhi',
  },
  {
    id: 'ananya',
    quote:
      "I love the community feature. It's great to connect with other pet parents, share experiences and get advice from people who truly care.",
    name: 'Ananya Singh',
    role: 'Cat parent · Gurgaon',
  },
  {
    id: 'meera',
    quote:
      'Nutrition plans and health reminders keep us on track. Basera feels like a companion app, not just another pet listing site.',
    name: 'Meera Kapoor',
    role: 'Pet parent · Mumbai',
  },
  {
    id: 'arjun',
    quote:
      'Meetups helped us find dog parks and friends nearby. RSVPs and check-ins make weekend walks so much easier to plan.',
    name: 'Arjun Patel',
    role: 'Dog parent · Bengaluru',
  },
  {
    id: 'neha',
    quote:
      'From application to handover, adoption felt transparent and supportive. We always knew what step came next.',
    name: 'Neha Reddy',
    role: 'Adopter · Hyderabad',
  },
];

const ROW_ONE = TESTIMONIALS;
const ROW_TWO = [...TESTIMONIALS.slice(3), ...TESTIMONIALS.slice(0, 3)];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function Stars() {
  return (
    <span className="testimonial-card__stars" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" width="16" height="16" aria-hidden>
          <path
            fill="currentColor"
            d="M10 1.6l2.4 5.1 5.6.8-4 4 1 5.6L10 14.8 5 17.1l1-5.6-4-4 5.6-.8L10 1.6z"
          />
        </svg>
      ))}
    </span>
  );
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article className="testimonial-card">
      <Stars />
      <p className="testimonial-card__quote-text">“{item.quote}”</p>
      <div className="testimonial-card__person">
        <span className="testimonial-card__avatar" aria-hidden>
          {initials(item.name)}
        </span>
        <div>
          <strong>{item.name}</strong>
          <span className="testimonial-card__role">{item.role}</span>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({
  items,
  reverse = false,
  offset = false,
}: {
  items: Testimonial[];
  reverse?: boolean;
  offset?: boolean;
}) {
  const track = [...items, ...items];

  return (
    <div
      className={`testimonials-marquee${reverse ? ' testimonials-marquee--reverse' : ''}${offset ? ' testimonials-marquee--offset' : ''}`}
    >
      <div className="testimonials-marquee__track">
        {track.map((item, index) => (
          <TestimonialCard key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="testimonials" id="testimonials" aria-labelledby="testimonials-heading">
      <div className="testimonials__bg" aria-hidden />

      <div className="testimonials__inner">
        <span className="testimonials__eyebrow">
          <PawIcon className="testimonials__eyebrow-icon" />
          Pet parents say
        </span>

        <h2 className="testimonials__heading" id="testimonials-heading">
          <span className="testimonials__heading-line">
            Loved by pets.
            <SparkMarks color="orange" />
          </span>
          <span className="testimonials__heading-line testimonials__heading-line--orange">
            Trusted by their people.
          </span>
        </h2>

        <p className="testimonials__lead">
          Real experiences from the Basera community, building happier and healthier lives for pets.
        </p>
      </div>

      <div className="testimonials__marquee-band" aria-label="Scrolling testimonials">
        <MarqueeRow items={ROW_ONE} />
        <MarqueeRow items={ROW_TWO} reverse offset />
      </div>
    </section>
  );
}
