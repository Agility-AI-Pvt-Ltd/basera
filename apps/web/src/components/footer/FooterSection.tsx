import { CONTACT_EMAIL, PLAY_STORE_URL } from '../../config';
import './footer.css';

export function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-end" id="contact">
      <div className="site-end__banner">
        <div className="site-end__paws" aria-hidden />

        <div className="site-end__inner">
          <div className="site-end__copy">
            <div className="site-end__brand-row">
              <span className="site-end__avatar" aria-hidden>
                🐾
              </span>
              <div className="site-end__brand-meta">
                <span>Basera</span>
                <span>Adoption · Community · Care</span>
              </div>
            </div>

            <h2 className="site-end__title">Thanks for visiting!</h2>

            <div className="site-end__contacts">
              <p className="site-end__contacts-label">Get in touch:</p>
              <a className="site-end__contact" href={`mailto:${CONTACT_EMAIL}`}>
                <span className="site-end__contact-icon" aria-hidden>
                  ✉
                </span>
                {CONTACT_EMAIL}
              </a>
              <a
                className="site-end__contact"
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="site-end__contact-icon" aria-hidden>
                  ▶
                </span>
                Get it on Google Play
              </a>
            </div>
          </div>

          <img
            className="site-end__cat"
            src="/landing%20page/cat_footer.png"
            alt="Cat holding a phone"
            width={560}
            height={560}
            loading="lazy"
          />
        </div>
      </div>

      <div className="site-end__bar">
        <p className="site-end__bar-title">Basera — your pet community, adoption &amp; care</p>
        <p className="site-end__bar-meta">Made for pet parents in India · {year}</p>
      </div>
    </footer>
  );
}
