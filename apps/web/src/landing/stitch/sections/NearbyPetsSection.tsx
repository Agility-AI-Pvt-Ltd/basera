import { LANDING_IMG } from '../landingAssets';
import { MaterialSymbol } from '../MaterialSymbol';

const PETS = [
  {
    name: 'Kulfi',
    meta: '2 yrs • Indie Mix',
    badge: 'Urgent Foster',
    badgeClass: 'bg-error text-on-error',
    distance: '1.8 km away • Indiranagar, BLR',
    blurb:
      'Extremely gentle, house-trained, and adores car rides. Loves curling up beside you while you work from home.',
    tags: [
      { label: 'Fully Vaccinated', className: 'bg-surface-container-high text-primary' },
      { label: 'Neutered', className: 'bg-secondary-fixed text-on-secondary-fixed' },
      { label: 'Leash Pro', className: 'bg-surface-container text-on-surface-variant' },
    ],
    foster: 'Foster: Ananya R.',
    image: LANDING_IMG.petKulfi,
    alt: 'Indie pup Kulfi in a sunlit veranda garden in Bengaluru',
  },
  {
    name: 'Simba',
    meta: '1 yr • Tabby',
    badge: 'Ready to Adopt',
    badgeClass: 'bg-primary text-on-primary',
    distance: '3.2 km away • Bandra West, BOM',
    blurb:
      'Affectionate lap cat with zero aggression. Loves laser chases, purrs constantly, and gets along well with calm dogs.',
    tags: [
      { label: 'Dewormed', className: 'bg-surface-container-high text-primary' },
      { label: 'Litter Trained', className: 'bg-secondary-fixed text-on-secondary-fixed' },
      { label: 'Indoor Only', className: 'bg-surface-container text-on-surface-variant' },
    ],
    foster: 'Shelter: CatCafe BLR',
    image: LANDING_IMG.petSimba,
    alt: 'Tabby kitten Simba on a pastel cushion',
  },
  {
    name: 'Leo',
    meta: '8 mos • Golden / Lab',
    badge: 'Shelter Star',
    badgeClass: 'bg-secondary text-on-secondary',
    distance: '4.5 km away • Sec 45, Gurgaon',
    blurb:
      'Friendly with children, enthusiastic fetch player, responds to basic hand commands, and loves meeting new humans.',
    tags: [
      { label: 'Vaccinated', className: 'bg-surface-container-high text-primary' },
      { label: 'Kid Friendly', className: 'bg-secondary-fixed text-on-secondary-fixed' },
      { label: 'Microchipped', className: 'bg-surface-container text-on-surface-variant' },
    ],
    foster: 'Foster: Amit K.',
    image: LANDING_IMG.petLeo,
    alt: 'Labrador mix Leo during outdoor park training',
  },
] as const;

export function NearbyPetsSection() {
  return (
    <section className="w-full py-space-xl bg-surface-container-lowest" id="adopt-listings">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Verified Listings
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
              Pets, shown the way the app shows them
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-xl">
              Direct from verified rescuers, independent foster parents, and vetted shelters across
              your city.
            </p>
          </div>
          <a
            className="inline-flex items-center gap-space-xs font-label-lg text-label-lg text-primary hover:text-primary-container transition-colors shrink-0"
            href="#adopt"
          >
            <span>View 120+ pets near you</span>
            <MaterialSymbol name="arrow_forward" size={18} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
          {PETS.map((pet) => (
            <div
              key={pet.name}
              className="group bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={pet.alt}
                  src={pet.image}
                />
                <div
                  className={`absolute top-3 left-3 font-label-sm text-label-sm px-space-sm py-1 rounded-full shadow-sm ${pet.badgeClass}`}
                >
                  {pet.badge}
                </div>
                <button
                  type="button"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center text-on-surface hover:text-error transition-colors"
                >
                  <MaterialSymbol name="favorite" size={18} />
                </button>
                <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-space-sm py-0.5 rounded-full font-label-sm text-label-sm text-on-surface flex items-center gap-1 shadow-sm">
                  <MaterialSymbol name="near_me" size={14} className="text-secondary" />
                  <span>{pet.distance}</span>
                </div>
              </div>
              <div className="p-space-lg flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {pet.name}
                    </h3>
                    <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                      {pet.meta}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs line-clamp-2">
                    {pet.blurb}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-space-md">
                    {pet.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${tag.className}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-space-md mt-space-md flex items-center justify-between">
                  <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                    <MaterialSymbol name="verified_user" size={16} className="text-primary" />
                    <span>{pet.foster}</span>
                  </div>
                  <button
                    type="button"
                    className="px-space-md py-1.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
