import {
  CalendarDays,
  Check,
  Droplets,
  Dumbbell,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  PawPrint,
  Pill,
  Scissors,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { StoreBadges } from '../components/StoreBadges';
import { CONTACT_EMAIL, PLAY_STORE_URL } from '../config';
import './landing.css';

const NAV = [
  { href: '#adopt', label: 'Adopt' },
  { href: '#care', label: 'Care' },
  { href: '#community', label: 'Community' },
  { href: '/tag', label: 'Collar tags' },
] as const;

const PETS = [
  {
    name: 'Golden Retriever',
    meta: '♂ 2 years · Friendly',
    distance: '2 km away',
    src: '/images/golden-retriever.jpg',
    position: 'center 18%',
  },
  {
    name: 'Beagle',
    meta: '♀ 3 years · Calm',
    distance: '5 km away',
    src: '/images/beagle.jpg',
    position: 'center 40%',
  },
  {
    name: 'Siberian Husky',
    meta: '♂ 1 year · Curious',
    distance: '4 km away',
    src: '/images/husky.jpg',
    position: 'center 30%',
  },
] as const;

const ADOPT_STEPS = [
  {
    title: 'Find a pet that fits your home',
    body: 'Browse dogs, cats, birds, fish, and rabbits near you. Listings can come from a home, a rescue, a foster, or someone caring for a stray.',
  },
  {
    title: 'Apply and talk it through',
    body: 'Send an application, then message the person listing the pet. Share whether you have an apartment, other animals, or children at home.',
  },
  {
    title: 'Meet, check, and agree',
    body: 'Move through a meet and greet and a home check when the listing asks for them, and sign an adoption agreement before handover.',
  },
  {
    title: 'Come home, then check in',
    body: 'After handover, Basera keeps the follow-up on the record — including check-ins at day 7, 30, and 90.',
  },
] as const;

type CareId = 'health' | 'training' | 'nutrition';

const CARE_TABS: { id: CareId; label: string; kicker: string; body: string }[] = [
  {
    id: 'health',
    label: 'Health',
    kicker: 'Visits, medicine, papers',
    body: 'Keep vet visits, grooming, medicine, and vaccinations on one schedule. Store rabies and other certificates on the pet’s profile so you know what is verified, expiring, or still pending.',
  },
  {
    id: 'training',
    label: 'Training',
    kicker: 'A routine for this pet',
    body: 'Set what you want to practice, then follow a daily task list. Mark a session done and see how the week is going without a separate training notebook.',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    kicker: 'Meals, water, treats',
    body: 'Build a feeding plan around your pet, then tick off morning, afternoon, and evening meals. Log water and treats beside the day’s food diary.',
  },
];

const HEALTH_ROWS = [
  { title: 'Rabies booster', when: 'Friday', tone: 'mint', Icon: Syringe },
  { title: 'Bath and nails', when: 'Saturday', tone: 'honey', Icon: Scissors },
  { title: 'Monthly tablet', when: 'Tonight', tone: 'sky', Icon: Pill },
  { title: 'Annual checkup', when: '12 Nov', tone: 'blush', Icon: Stethoscope },
] as const;

const PACK_POINTS = [
  {
    title: 'Packs',
    body: 'Join or start a local group. Share posts, follow friends, and keep the conversation with people who live near the same parks.',
    Icon: Users,
  },
  {
    title: 'Meetups',
    body: 'Host a dog walk, playdate, training session, or adoption event. Neighbours can mark that they’re coming.',
    Icon: CalendarDays,
  },
  {
    title: 'Neighbours',
    body: 'See pet parents around your locality, so the first walk together is with someone a few streets away.',
    Icon: MapPin,
  },
] as const;

const STORIES = [
  {
    quote:
      'Basera made the adoption process so much easier. We found our perfect companion and the guidance along the way was incredible!',
    name: 'Priya Sharma',
    role: 'Pet parent · Noida',
  },
  {
    quote:
      'The training tips are simple, practical and actually work. My puppy has become much calmer and happier. The daily reminders really help!',
    name: 'Rahul Mehta',
    role: 'Dog parent · Delhi',
  },
  {
    quote:
      'I love the community feature. It’s great to connect with other pet parents, share experiences and get advice from people who truly care.',
    name: 'Ananya Singh',
    role: 'Cat parent · Gurgaon',
  },
  {
    quote:
      'Nutrition plans and health reminders keep us on track. Basera feels like a companion for the life after adoption.',
    name: 'Meera Kapoor',
    role: 'Pet parent · Mumbai',
  },
  {
    quote:
      'Meetups helped us find dog parks and friends nearby. Planning a weekend walk is finally something we look forward to.',
    name: 'Arjun Patel',
    role: 'Dog parent · Bengaluru',
  },
  {
    quote:
      'From application to handover, adoption felt transparent and supportive. We always knew what step came next.',
    name: 'Neha Reddy',
    role: 'Adopter · Hyderabad',
  },
] as const;

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function PawMark() {
  return (
    <span className="lp-brand__mark" aria-hidden>
      <PawPrint size={18} strokeWidth={2.4} />
    </span>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [care, setCare] = useState<CareId>('health');
  const year = new Date().getFullYear();
  const activeCare = CARE_TABS.find((tab) => tab.id === care) ?? CARE_TABS[0];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="lp" id="top">
      <header className="lp-header">
        <a className="lp-brand" href="#top" onClick={closeMenu}>
          <PawMark />
          Basera
        </a>

        <button
          type="button"
          className="lp-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="lp-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
          <span className="lp-sr">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav id="lp-nav" className={`lp-nav${menuOpen ? ' is-open' : ''}`} aria-label="Page">
          {NAV.map((item) =>
            item.href.startsWith('/') ? (
              <Link key={item.href} to={item.href} onClick={closeMenu}>
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ),
          )}
          <a className="lp-nav__download" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
            Get the app
          </a>
        </nav>

        <a className="btn btn--primary btn--sm lp-header__cta" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
          Get the app
        </a>
      </header>

      <main>
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-wrap lp-hero__grid">
            <div className="lp-hero__copy">
              <p className="lp-kicker">
                <PawPrint size={14} aria-hidden />
                Adoption, care, and community
              </p>
              <h1 id="lp-hero-title">
                Bring a pet home.
                <span> Stay for the everyday.</span>
              </h1>
              <p className="lp-lead">
                Find a pet nearby, follow the adoption from application to handover, and keep
                health, training, and meals in the same place as your local pack.
              </p>
              <ul className="lp-species" aria-label="Animals you can browse">
                {['Dogs', 'Cats', 'Birds', 'Fish', 'Rabbits'].map((species) => (
                  <li key={species}>{species}</li>
                ))}
              </ul>
              <div className="lp-hero__actions">
                <StoreBadges />
                <Link className="lp-btn-soft" to="/tag">
                  <ShieldCheck size={18} aria-hidden />
                  Look up a collar
                </Link>
              </div>
            </div>

            <div className="lp-hero__stage">
              <img
                className="lp-hero__mascot"
                src="/landing-page/hero_img.png"
                alt="A beagle and a grey cat resting side by side"
                width={1601}
                height={982}
              />
              <article className="lp-float lp-float--pet">
                <img src="/images/golden-retriever.jpg" alt="" width={56} height={56} />
                <div>
                  <strong>Golden Retriever</strong>
                  <span>♂ 2 yrs · Friendly</span>
                </div>
                <span className="lp-distance">
                  <MapPin size={12} aria-hidden />
                  2 km
                </span>
              </article>
              <article className="lp-float lp-float--health">
                <span className="lp-float__icon" aria-hidden>
                  <Syringe size={20} strokeWidth={2.25} />
                </span>
                <div>
                  <strong>Rabies booster</strong>
                  <span>On the health schedule · Friday</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="nearby-heading">
          <div className="lp-wrap">
            <div className="lp-section__head">
              <p className="lp-kicker">Home</p>
              <h2 id="nearby-heading">Pets, shown the way the app shows them</h2>
              <p>
                Distance, age, and temperament on every card — sample profiles in the same shape as
                Adopt on your home screen.
              </p>
            </div>
            <ul className="lp-pets">
              {PETS.map((pet) => (
                <li key={pet.name} className="lp-pet">
                  <div className="lp-pet__photo">
                    <img
                      src={pet.src}
                      alt=""
                      style={{ objectPosition: pet.position }}
                    />
                    <span className="lp-pet__heart" aria-hidden>
                      <Heart size={16} />
                    </span>
                    <span className="lp-pet__distance">
                      <MapPin size={12} aria-hidden />
                      {pet.distance}
                    </span>
                  </div>
                  <h3>{pet.name}</h3>
                  <p>{pet.meta}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section lp-section--adopt" id="adopt" aria-labelledby="adopt-heading">
          <div className="lp-wrap lp-split">
            <div>
              <p className="lp-kicker">Adopt</p>
              <h2 id="adopt-heading">A path from “interested” to a key on the collar</h2>
              <p className="lp-lead">
                Basera treats adoption as a sequence you can both see: application, conversation,
                meeting, home check, agreement, handover, and the check-ins that follow.
              </p>
              <ol className="lp-steps">
                {ADOPT_STEPS.map((step, index) => (
                  <li key={step.title}>
                    <span>{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <figure className="lp-phone">
              <img
                src="/landing-page/adoption_page.png"
                alt="Basera Adopt screen with featured pets and ways to browse"
                width={984}
                height={1599}
              />
            </figure>
          </div>
        </section>

        <section className="lp-section" id="care" aria-labelledby="care-heading">
          <div className="lp-wrap">
            <div className="lp-section__head lp-section__head--center">
              <p className="lp-kicker">Pets</p>
              <h2 id="care-heading">Health, training, and meals on the pet’s own profile</h2>
              <p>Open a pet and switch tabs. The plan stays attached to that animal, not to a generic checklist.</p>
            </div>

            <div className="lp-care">
              <div className="lp-care__tabs" role="tablist" aria-label="Pet care">
                {CARE_TABS.map((tab) => {
                  const selected = tab.id === care;
                  const Icon = tab.id === 'health' ? Stethoscope : tab.id === 'training' ? Dumbbell : Utensils;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      id={`care-tab-${tab.id}`}
                      aria-selected={selected}
                      aria-controls={`care-panel-${tab.id}`}
                      className={selected ? 'is-selected' : undefined}
                      onClick={() => setCare(tab.id)}
                    >
                      <Icon size={18} aria-hidden />
                      <span>
                        <strong>{tab.label}</strong>
                        {tab.kicker}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="lp-care__panel"
                role="tabpanel"
                id={`care-panel-${activeCare.id}`}
                aria-labelledby={`care-tab-${activeCare.id}`}
              >
                <div className="lp-care__copy">
                  <h3>{activeCare.label}</h3>
                  <p>{activeCare.body}</p>
                  {care === 'health' ? (
                    <ul className="lp-schedule">
                      {HEALTH_ROWS.map((row) => (
                        <li key={row.title}>
                          <span className={`lp-schedule__icon lp-schedule__icon--${row.tone}`} aria-hidden>
                            <row.Icon size={16} />
                          </span>
                          <span>{row.title}</span>
                          <time>{row.when}</time>
                        </li>
                      ))}
                      <li className="lp-schedule__doc">
                        <Check size={16} aria-hidden />
                        Rabies certificate · verified on the profile
                      </li>
                    </ul>
                  ) : null}
                  {care === 'nutrition' ? (
                    <ul className="lp-pills">
                      <li>
                        <Utensils size={14} aria-hidden /> Meals
                      </li>
                      <li>
                        <Droplets size={14} aria-hidden /> Water
                      </li>
                      <li>
                        <Heart size={14} aria-hidden /> Treats
                      </li>
                    </ul>
                  ) : null}
                </div>

                {care === 'health' ? (
                  <div className="lp-care-card" aria-hidden>
                    <p>A sample day</p>
                    <strong>2 of 4 done</strong>
                    <div className="lp-meter">
                      <span style={{ width: '50%' }} />
                    </div>
                    <p className="lp-care-card__note">Grooming and the vet visit are still open.</p>
                  </div>
                ) : (
                  <figure className="lp-phone lp-phone--care">
                    <img
                      src={
                        care === 'training'
                          ? '/landing-page/training_page.png'
                          : '/landing-page/nutrition_page.png'
                      }
                      alt={
                        care === 'training'
                          ? 'Training routine in the Basera app'
                          : 'Nutrition plan in the Basera app'
                      }
                      width={984}
                      height={1599}
                    />
                  </figure>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--community" id="community" aria-labelledby="community-heading">
          <div className="lp-wrap lp-split lp-split--flip">
            <div>
              <p className="lp-kicker">Community</p>
              <h2 id="community-heading">Packs, meetups, and the people next door</h2>
              <p className="lp-lead">
                The community tab is local on purpose. You can also open the feed in the browser and
                post from here.
              </p>
              <ul className="lp-points">
                {PACK_POINTS.map(({ title, body, Icon }) => (
                  <li key={title}>
                    <span aria-hidden>
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link className="btn btn--primary" to="/community">
                <MessageCircle size={18} aria-hidden />
                Open the community
              </Link>
            </div>
            <figure className="lp-phone">
              <img
                src="/landing-page/community_page.png"
                alt="Basera community screen with groups and posts from pet parents"
                width={984}
                height={1599}
              />
            </figure>
          </div>
        </section>

        <section className="lp-section" id="collar" aria-labelledby="collar-heading">
          <div className="lp-wrap">
            <div className="lp-collar">
              <div>
                <p className="lp-kicker lp-kicker--light">Collar tags</p>
                <h2 id="collar-heading">A code on the collar, a caregiver on the other end</h2>
                <p>
                  Community dogs and cats in the collar program wear a reflective tag. Look up the
                  code to see vaccination status and reach the person who feeds and cares for them —
                  without crowding the animal.
                </p>
                <Link className="lp-btn-light" to="/tag">
                  <ShieldCheck size={18} aria-hidden />
                  Verify a tag
                </Link>
              </div>
              <div className="lp-tag" aria-hidden>
                <ShieldCheck size={28} />
                <strong>BAS-001</strong>
                <span>Rabies · on record</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" id="stories" aria-labelledby="stories-heading">
          <div className="lp-wrap">
            <div className="lp-section__head">
              <p className="lp-kicker">Pet parents</p>
              <h2 id="stories-heading">What changes after the first week</h2>
            </div>
            <ul className="lp-stories">
              {STORIES.map((story) => (
                <li key={story.name}>
                  <p>“{story.quote}”</p>
                  <div className="lp-stories__person">
                    <span aria-hidden>{initials(story.name)}</span>
                    <div>
                      <strong>{story.name}</strong>
                      <em>{story.role}</em>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section lp-section--tight" aria-labelledby="download-heading">
          <div className="lp-wrap">
            <div className="lp-download">
              <div>
                <h2 id="download-heading">Keep the leash, the calendar, and the pack in one app.</h2>
                <p>Google Play is coming soon.</p>
                <StoreBadges />
              </div>
              <img
                className="lp-download__cat"
                src="/landing-page/cat.png"
                alt="A sleeping tabby kitten"
                width={720}
                height={240}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer__grid">
          <div>
            <a className="lp-brand" href="#top">
              <PawMark />
              Basera
            </a>
            <p>A home for the pet you adopt, and the one already asleep on the sofa.</p>
          </div>
          <div>
            <p className="lp-footer__label">Explore</p>
            <a href="#adopt">Adopt</a>
            <a href="#care">Care</a>
            <Link to="/community">Community</Link>
            <Link to="/tag">Collar tags</Link>
          </div>
          <div>
            <p className="lp-footer__label">Say hello</p>
            {CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            ) : null}
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              Get it on Google Play
            </a>
          </div>
        </div>
        <div className="lp-wrap lp-footer__bar">
          <p>© {year} Basera · Made for pet parents in India</p>
        </div>
      </footer>
    </div>
  );
}
