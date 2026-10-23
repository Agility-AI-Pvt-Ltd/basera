import { MaterialSymbol } from '../MaterialSymbol';

const REVIEWS = [
  {
    quote:
      '“Adopted our Indie puppy Sheru through Tailz. The post-adoption 30-day check-in helped us with separation anxiety and crate training so gently!”',
    name: 'Aarav & Meera M.',
    place: 'Noida Sector 76',
    tag: 'Indie Parent',
    tagClass: 'bg-surface-container-high text-primary',
  },
  {
    quote:
      '“The vaccination scheduler sends WhatsApp alerts and keeps Dr. Gupta’s prescriptions handy when travelling between Delhi and Chandigarh.”',
    name: 'Sunita R.',
    place: 'South Extension, Delhi',
    tag: 'Beagle Mom',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
  },
  {
    quote:
      '“The Bandra pet meetup group formed through Tailz is now 80 dogs strong. Weekend morning Carter Road walks are pure joy.”',
    name: 'Rohan K.',
    place: 'Bandra West, Mumbai',
    tag: 'Pack Host',
    tagClass: 'bg-surface-container-high text-primary',
  },
  {
    quote:
      '“We tagged 18 stray dogs in our layout with Tailz QR tags. Two lost dogs were reunited within 40 minutes when a delivery partner scanned them!”',
    name: 'Vinay P.',
    place: 'Whitefield Resident',
    tag: 'Colony Feeder',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
  },
  {
    quote:
      '“Customised nutrition plan for our senior Lab who had arthritis. His mobility and morning energy levels have skyrocketed.”',
    name: 'Tanya S.',
    place: 'Golf Course Road, GGN',
    tag: 'Senior Pet Parent',
    tagClass: 'bg-surface-container-high text-primary',
  },
  {
    quote:
      '“Transparent adoption process. No murky middlemen, just pure love and complete health history from genuine animal foster heroes.”',
    name: 'Farhan A.',
    place: 'Jubilee Hills, HYD',
    tag: 'Cat Parent',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
  },
] as const;

function Stars() {
  return (
    <div className="flex items-center gap-1 text-secondary mb-space-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialSymbol key={i} name="star" size={18} fill />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="w-full py-space-xl bg-surface-container-lowest">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="text-center max-w-xl mx-auto mb-space-xl">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
            Community Voices
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
            Loved by pet parents across India
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            From Whitefield to Bandra, here is how The Tailz Club keeps homes, rescuers, and street
            animals connected.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-lg">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="p-space-lg rounded-2xl bg-surface shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <Stars />
                <p className="font-body-md text-body-md text-on-surface italic">{r.quote}</p>
              </div>
              <div className="pt-space-md mt-space-md border-t border-surface-container-high flex items-center justify-between">
                <div>
                  <p className="font-title-md text-title-md text-on-surface">{r.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{r.place}</p>
                </div>
                <span
                  className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full ${r.tagClass}`}
                >
                  {r.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
