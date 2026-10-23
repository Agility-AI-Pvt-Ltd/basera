import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Compass,
  Eye,
  Heart,
  HeartHandshake,
  HelpCircle,
  Info,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import './collarTag.css';

type CommunityAnimal = {
  id: string;
  tag_code: string;
  name: string;
  species: string;
  gender: string | null;
  photo_url: string | null;
  territory: string;
  city: string;
  is_sterilized: boolean;
  ear_notched: boolean;
  caregiver_contact: string | null;
  status: 'unassigned' | 'active' | 'treatment' | 'missing' | 'adopted' | 'deceased';
  last_seen_location: string | null;
  last_seen_at: string | null;
  created_at: string;
};

type AnimalVaccination = {
  id: string;
  vaccine_name: string;
  administered_date: string;
  valid_until: string;
  batch_number: string | null;
  drive_name: string | null;
  notes: string | null;
};

type AnimalLog = {
  id: string;
  log_type: 'feeding' | 'sighting' | 'health_alert' | 'note';
  body: string;
  reporter_name: string | null;
  location_detail: string | null;
  created_at: string;
};

export function CollarTagPage() {
  const { tagCode } = useParams<{ tagCode?: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(tagCode || '');
  const [animal, setAnimal] = useState<CommunityAnimal | null>(null);
  const [vaccinations, setVaccinations] = useState<AnimalVaccination[]>([]);
  const [logs, setLogs] = useState<AnimalLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Field Pairing State (Phase 2 Option A)
  const [pairName, setPairName] = useState('');
  const [pairGender, setPairGender] = useState<'male' | 'female' | 'unknown'>('male');
  const [pairTerritory, setPairTerritory] = useState('');
  const [pairCity, setPairCity] = useState('Mumbai');
  const [pairSterilized, setPairSterilized] = useState(true);
  const [pairEarNotched, setPairEarNotched] = useState(true);
  const [pairCaregiver, setPairCaregiver] = useState('');
  const [pairPhotoUrl, setPairPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pairVaxName, setPairVaxName] = useState('Anti-Rabies Vaccine (ARV)');
  const [pairDriveName, setPairDriveName] = useState('Community Vaccination Drive');
  const [pairBatchNo, setPairBatchNo] = useState('');
  const [pairingSubmitting, setPairingSubmitting] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  // Client-side image compressor & preview generator
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoPreview(compressed);
        } else {
          setPhotoPreview(rawUrl);
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  // Community log form state
  const [logType, setLogType] = useState<AnimalLog['log_type']>('feeding');
  const [logBody, setLogBody] = useState('');
  const [logReporter, setLogReporter] = useState('');
  const [logLocation, setLogLocation] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  // New tag pairing state (allows feeding details for any scanned tag even if not pre-seeded)
  const [isPairingNew, setIsPairingNew] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const cleanCode = (tagCode || '').trim().toUpperCase();

  const fetchAnimalData = useCallback(async (code: string) => {
    if (!code) {
      setAnimal(null);
      setNotFound(false);
      setIsPairingNew(false);
      setDbError(null);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setIsPairingNew(false);
    setDbError(null);

    try {
      // 1. Fetch animal
      const { data: animalData, error: animalErr } = await supabase
        .from('community_animals')
        .select('*')
        .ilike('tag_code', code)
        .maybeSingle();

      if (animalErr) {
        setAnimal(null);
        setNotFound(true);
        if (animalErr.code === '42501') {
          setDbError('Database permission error: Please ensure GRANT ALL ON TABLE community_animals has been run in Supabase SQL editor.');
        } else {
          setDbError(animalErr.message);
        }
        setLoading(false);
        return;
      }

      if (!animalData) {
        setAnimal(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const parsedAnimal = animalData as CommunityAnimal;
      setAnimal(parsedAnimal);

      // Pre-fill pairing defaults
      setPairName(`Community Dog #${parsedAnimal.tag_code}`);
      if (parsedAnimal.territory) setPairTerritory(parsedAnimal.territory);
      if (parsedAnimal.city) setPairCity(parsedAnimal.city);

      // 2. Fetch vaccinations
      const { data: vaxData } = await supabase
        .from('community_animal_vaccinations')
        .select('*')
        .eq('animal_id', parsedAnimal.id)
        .order('administered_date', { ascending: false });

      setVaccinations((vaxData as AnimalVaccination[]) || []);

      // 3. Fetch logs
      const { data: logData } = await supabase
        .from('community_animal_logs')
        .select('*')
        .eq('animal_id', parsedAnimal.id)
        .order('created_at', { ascending: false });

      setLogs((logData as AnimalLog[]) || []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cleanCode) {
      setSearchInput(cleanCode);
      void fetchAnimalData(cleanCode);
    } else {
      setAnimal(null);
      setNotFound(false);
    }
  }, [cleanCode, fetchAnimalData]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const target = searchInput.trim().toUpperCase();
    if (target) {
      navigate(`/t/${target}`);
    }
  };

  // Phase 2 Option A: Field Volunteer Fast Pairing (works for unassigned AND new tags)
  const handlePairSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const activeCode = animal?.tag_code || cleanCode;
    if (!activeCode) return;

    setPairingSubmitting(true);
    setPairError(null);

    const today = new Date().toISOString().slice(0, 10);
    const validUntilDate = new Date();
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
    const validUntil = validUntilDate.toISOString().slice(0, 10);

    try {
      let finalPhotoUrl = pairPhotoUrl.trim() || null;

      if (photoPreview) {
        setPhotoUploading(true);
        try {
          const fileName = `${activeCode.toLowerCase()}_${Date.now()}.jpg`;
          const filePath = `community-animals/${fileName}`;

          const res = await fetch(photoPreview);
          const blob = await res.blob();

          const { error: uploadErr } = await supabase.storage
            .from('community-media')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadErr) {
            const { data: pubData } = supabase.storage
              .from('community-media')
              .getPublicUrl(filePath);
            finalPhotoUrl = pubData.publicUrl;
          } else {
            finalPhotoUrl = photoPreview;
          }
        } catch {
          finalPhotoUrl = photoPreview;
        } finally {
          setPhotoUploading(false);
        }
      }

      let targetAnimalId = animal?.id;

      if (targetAnimalId) {
        // 1a. Update existing unassigned animal
        const { error: animalErr } = await supabase
          .from('community_animals')
          .update({
            name: pairName.trim() || `Community Dog #${activeCode}`,
            gender: pairGender,
            territory: pairTerritory.trim(),
            city: pairCity.trim(),
            is_sterilized: pairSterilized,
            ear_notched: pairEarNotched,
            caregiver_contact: pairCaregiver.trim() || null,
            photo_url: finalPhotoUrl,
            status: 'active',
            last_seen_location: pairTerritory.trim() || null,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetAnimalId);

        if (animalErr) throw animalErr;
      } else {
        // 1b. Insert new animal record on the fly for this tag code!
        const { data: newAnimal, error: insertErr } = await supabase
          .from('community_animals')
          .insert({
            tag_code: activeCode,
            name: pairName.trim() || `Community Dog #${activeCode}`,
            gender: pairGender,
            territory: pairTerritory.trim(),
            city: pairCity.trim(),
            is_sterilized: pairSterilized,
            ear_notched: pairEarNotched,
            caregiver_contact: pairCaregiver.trim() || null,
            photo_url: finalPhotoUrl,
            status: 'active',
            last_seen_location: pairTerritory.trim() || null,
            last_seen_at: new Date().toISOString(),
          })
          .select('id, tag_code')
          .single();

        if (insertErr) throw insertErr;
        targetAnimalId = newAnimal.id;
      }

      // 2. Insert initial vaccination record
      if (pairVaxName.trim()) {
        const { error: vaxErr } = await supabase
          .from('community_animal_vaccinations')
          .insert({
            animal_id: targetAnimalId,
            vaccine_name: pairVaxName.trim(),
            administered_date: today,
            valid_until: validUntil,
            batch_number: pairBatchNo.trim() || null,
            drive_name: pairDriveName.trim() || 'Community ARV Drive',
          });

        if (vaxErr) throw vaxErr;
      }

      // 3. Log pairing activation
      await supabase.from('community_animal_logs').insert({
        animal_id: targetAnimalId,
        log_type: 'sighting',
        body: 'Collar tag fitted and vaccinated during community drive.',
        reporter_name: 'Drive Volunteer',
        location_detail: pairTerritory.trim() || pairCity.trim() || undefined,
      });

      // Reload
      setIsPairingNew(false);
      setNotFound(false);
      setPhotoPreview(null);
      setPairPhotoUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchAnimalData(activeCode);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not activate tag.';
      setPairError(message);
    } finally {
      setPairingSubmitting(false);
    }
  };

  const handleLogSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!animal || !logBody.trim()) return;

    setSubmittingLog(true);
    setLogMessage(null);

    const { error } = await supabase.from('community_animal_logs').insert({
      animal_id: animal.id,
      log_type: logType,
      body: logBody.trim(),
      reporter_name: logReporter.trim() || 'Local Resident',
      location_detail: logLocation.trim() || undefined,
    });

    if (error) {
      setLogMessage('Could not submit update. Please try again.');
    } else {
      setLogBody('');
      setLogLocation('');
      setLogMessage('Thank you! Community update logged successfully.');
      void fetchAnimalData(animal.tag_code);
    }
    setSubmittingLog(false);
  };

  // Check rabies validity
  const rabiesVax = vaccinations.find((v) =>
    v.vaccine_name.toLowerCase().includes('rabies'),
  );
  const isRabiesValid = rabiesVax
    ? new Date(rabiesVax.valid_until) >= new Date()
    : false;

  return (
    <div className="tag-page">
      {/* Top Navigation */}
      <header className="tag-nav">
        <div className="tag-nav__inner">
          <Link to="/" className="tag-nav__brand">
            <span>The Tailz Club</span>
          </Link>
          <div className="tag-nav__links">
            <Link to="/community" className="tag-nav__link">
              Community Feed
            </Link>
            <Link to="/" className="tag-nav__btn">
              About The Tailz Club
            </Link>
          </div>
        </div>
      </header>

      <main className="tag-container">
        {/* Compact Search Bar when viewing an animal, loading, or not found */}
        {(animal || notFound || loading) && (
          <form className="tag-lookup-bar" onSubmit={handleSearch}>
            <Search size={18} color="#6D28D9" aria-hidden />
            <input
              type="text"
              placeholder="Search collar tag code (e.g. BAS-001)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Lookup</button>
          </form>
        )}

        {/* Loading State */}
        {loading && (
          <div className="tag-empty-state">
            <Activity className="animate-spin" size={32} color="#7C3AED" />
            <h2>Loading Tag Details...</h2>
          </div>
        )}

        {/* Not Found State -> Now provides direct button to feed details! */}
        {!loading && notFound && !isPairingNew && (
          <div className="tag-empty-state">
            <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
              <span className="pill pill--sterilized">
                <Tag size={13} />
                <span>Collar Tag: {cleanCode}</span>
              </span>
            </div>
            <h2>Collar Tag Not Yet Registered</h2>
            <p>
              Tag <strong>"{cleanCode}"</strong> is not linked to an animal in our database yet.
              Fitting this collar during a vaccination drive? You can enter details and activate it live right now.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="tag-nav__btn"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                onClick={() => {
                  setPairName(`Community Dog #${cleanCode}`);
                  setIsPairingNew(true);
                  setNotFound(false);
                }}
              >
                <PlusCircle size={16} />
                <span>Feed Details & Register Animal</span>
              </button>
              <Link to="/tag" className="tag-nav__btn" style={{ background: '#475569' }}>
                Lookup Another Tag
              </Link>
            </div>
            {dbError && (
              <div style={{ marginTop: '1.5rem', textAlign: 'left', background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <p style={{ color: '#b91c1c', fontWeight: 600, margin: '0 0 0.4rem', fontSize: '0.9rem' }}>
                  Database Setup Required
                </p>
                <p style={{ color: '#7f1d1d', margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {dbError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty / Landing Search State - Sensitive, Pet-Friendly Mission & Lookup Hub */}
        {!loading && !notFound && !animal && (
          <div className="tag-landing">
            {/* Hero Section */}
            <section className="tag-landing-hero">
              <div className="tag-landing-badge">
                <ShieldCheck size={15} />
                <span>The Tailz Club Community Collar Initiative</span>
              </div>
              <h1 className="tag-landing-title">
                Every Collar Gives a Voice to a Community Animal
              </h1>
              <p className="tag-landing-lead">
                Street animals belong to our shared neighborhoods. We partner with local feeders,
                veterinarians, and animal welfare advocates to equip community dogs and cats with
                reflective, QR-linked collars during mass vaccination drives. A visible tag provides
                verifiable proof of rabies immunization, protects against wrongful relocation, and
                gives compassionate citizens direct access to their daily caregivers.
              </p>

              {/* Prominent Lookup Card */}
              <form className="tag-landing-search" onSubmit={handleSearch}>
                <div className="tag-landing-search__box">
                  <Search size={20} className="tag-landing-search__icon" aria-hidden />
                  <input
                    type="text"
                    id="tag-search-input"
                    aria-label="Enter Collar Tag Code"
                    placeholder="Enter 6-character tag code (e.g. BAS-001)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button type="submit" className="tag-landing-search__btn">
                    <span>Verify Tag</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="tag-landing-search__hints">
                  <span className="tag-hint-label">Try sample tags:</span>
                  <button
                    type="button"
                    className="tag-hint-chip"
                    onClick={() => navigate('/t/BAS-001')}
                  >
                    BAS-001 (Tommy - Active)
                  </button>
                  <button
                    type="button"
                    className="tag-hint-chip"
                    onClick={() => navigate('/t/BAS-002')}
                  >
                    BAS-002 (Bandit - St. Inez)
                  </button>
                  <button
                    type="button"
                    className="tag-hint-chip tag-hint-chip--intake"
                    onClick={() => navigate('/t/BAS-003')}
                  >
                    BAS-003 (Field Intake & Pairing)
                  </button>
                </div>

                <div className="tag-landing-search__note">
                  <Info size={15} className="tag-note-icon" />
                  <span>
                    The tag code is laser-marked directly beneath the QR code on the reflective band.
                    It can be read clearly from a respectful distance of 3-4 feet without stressing the animal.
                  </span>
                </div>
              </form>
            </section>

            {/* Why Every Tag Matters (The Case / Mission Grid) */}
            <section className="tag-section">
              <div className="tag-section-header">
                <span className="tag-section-tag">
                  <Heart size={14} />
                  <span>Why We Do This</span>
                </span>
                <h2>Transforming Neighborhood Coexistence</h2>
                <p>
                  Without visible identification, street animals face false rabies scares, illegal
                  relocations, road accidents, and uncoordinated care. Here is how verifiable collar
                  tags safeguard them every single day:
                </p>
              </div>

              <div className="tag-impact-grid">
                <div className="tag-impact-card">
                  <div className="tag-impact-icon-wrap tag-impact-icon-wrap--emerald">
                    <ShieldCheck size={22} />
                  </div>
                  <h3>Rabies Immunity & Public Safety</h3>
                  <p>
                    Eliminates panic and fear. Anyone in the neighborhood can scan the tag to see the
                    exact Anti-Rabies Vaccine (ARV) dates, batch numbers, and expiry countdown administered
                    by qualified veterinarians.
                  </p>
                </div>

                <div className="tag-impact-card">
                  <div className="tag-impact-icon-wrap tag-impact-icon-wrap--purple">
                    <MapPin size={22} />
                  </div>
                  <h3>Territory Defense & Legal Protection</h3>
                  <p>
                    Under Animal Birth Control (ABC) guidelines, sterilized street dogs cannot be relocated.
                    Visible ear-notching and collar records provide instant legal verification of their protected
                    home street.
                  </p>
                </div>

                <div className="tag-impact-card">
                  <div className="tag-impact-icon-wrap tag-impact-icon-wrap--amber">
                    <Phone size={22} />
                  </div>
                  <h3>Emergency Caregiver Hotline</h3>
                  <p>
                    In road accidents, severe illness, or extreme weather, good samaritans can directly contact
                    the animal's dedicated daily feeders and local rescue contacts in seconds.
                  </p>
                </div>

                <div className="tag-impact-card">
                  <div className="tag-impact-icon-wrap tag-impact-icon-wrap--blue">
                    <Users size={22} />
                  </div>
                  <h3>Community Feeding & Sighting Logs</h3>
                  <p>
                    Prevents missed meals and coordinates neighborhood stewardship. Local residents and feeders
                    crowdsource sighting updates, meal logs, and recovery notes in real time.
                  </p>
                </div>
              </div>
            </section>

            {/* Responsible Animal Interaction Guide (Sensitive & Pet-Friendly) */}
            <section className="tag-section tag-section--guide">
              <div className="tag-guide-banner">
                <div className="tag-guide-header">
                  <span className="tag-guide-pill">
                    <HeartHandshake size={14} />
                    <span>Pet-Friendly & Sensitive Care</span>
                  </span>
                  <h2>Approaching a Community Dog Responsibly</h2>
                  <p>
                    Street animals rely heavily on environmental cues and body language. Approaching an
                    unfamiliar animal requires patience, calm energy, and deep respect for their space.
                  </p>
                </div>

                <div className="tag-rules-grid">
                  <div className="tag-rule-card">
                    <div className="tag-rule-num">1</div>
                    <div className="tag-rule-content">
                      <h4>Never Corner, Chase, or Crowd</h4>
                      <p>
                        Always provide an open exit path. Avoid looming over them or making sudden gestures.
                        Crouch gently to their eye level at a safe distance and speak softly so they know
                        you have friendly intentions.
                      </p>
                    </div>
                  </div>

                  <div className="tag-rule-card">
                    <div className="tag-rule-num">2</div>
                    <div className="tag-rule-content">
                      <h4>Read the Tag from a Respectful Distance</h4>
                      <p>
                        Do not thrust a smartphone lens into an anxious dog's face. If the animal is timid,
                        read the large 6-character tag printed along the band (e.g. BAS-001) from 3 to 4 feet away
                        and enter it manually above.
                      </p>
                    </div>
                  </div>

                  <div className="tag-rule-card">
                    <div className="tag-rule-num">3</div>
                    <div className="tag-rule-content">
                      <h4>Observe Subtle Stress Signals</h4>
                      <p>
                        Tucked tails, rapid blinking, lip-licking, stiffened backs, or turning the head away
                        indicate unease. If you notice any of these signs, step back slowly and give the dog
                        time and space to relax.
                      </p>
                    </div>
                  </div>

                  <div className="tag-rule-card">
                    <div className="tag-rule-num">4</div>
                    <div className="tag-rule-content">
                      <h4>Protocol for Sick or Injured Animals</h4>
                      <p>
                        If the animal appears injured or bleeding, do not attempt to move or lift them unassisted
                        without professional equipment. Search their collar code to reach their primary caregiver,
                        or contact a local animal ambulance immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="tag-guide-footer-tip">
                  <Sparkles size={18} className="tag-tip-icon" />
                  <div>
                    <strong>Responsible Feeding Best Practice:</strong> Feed in shaded, low-traffic areas away
                    from vehicle parking and building doorways. Always provide a clean bowl of fresh drinking water,
                    especially during summer months.
                  </div>
                </div>
              </div>
            </section>

            {/* What Lives Inside Every Digital Passport */}
            <section className="tag-section">
              <div className="tag-section-header">
                <span className="tag-section-tag">
                  <Compass size={14} />
                  <span>Inside Every Profile</span>
                </span>
                <h2>Transparent Community Medical Records</h2>
                <p>
                  Every collar lookup provides transparent, community-verified data to keep pets and neighborhoods safe:
                </p>
              </div>

              <div className="tag-features-row">
                <div className="tag-feature-pill">
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Annual Anti-Rabies vaccination status with expiry countdown</span>
                </div>
                <div className="tag-feature-pill">
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Sterilization (ABC) and ear-notch surgical identification</span>
                </div>
                <div className="tag-feature-pill">
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Primary feeder contact with one-tap phone and WhatsApp access</span>
                </div>
                <div className="tag-feature-pill">
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Crowdsourced feeding logs and neighborhood sighting timeline</span>
                </div>
                <div className="tag-feature-pill">
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Real-time field intake pairing in 30 seconds during volunteer drives</span>
                </div>
                <div className="tag-feature-pill">
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Automatic location updates whenever a citizen logs a sighting</span>
                </div>
              </div>
            </section>

            {/* Community FAQ */}
            <section className="tag-section">
              <div className="tag-section-header">
                <span className="tag-section-tag">
                  <HelpCircle size={14} />
                  <span>Community FAQ</span>
                </span>
                <h2>Frequently Asked Questions</h2>
              </div>

              <div className="tag-faq-grid">
                <div className="tag-faq-card">
                  <h4>Are these collars safe and comfortable for the dogs?</h4>
                  <p>
                    Yes. All collars are designed specifically for free-roaming community animals with
                    elastic stretch safety segments and breakaway points to prevent snagging on gates or shrubs.
                    The band is lined with 360-degree reflective stitching to protect animals from oncoming traffic at night.
                  </p>
                </div>

                <div className="tag-faq-card">
                  <h4>Can any citizen log a feeding or sighting update?</h4>
                  <p>
                    Yes! Community stewardship works best when neighbors collaborate. If you feed the animal,
                    notice they have moved to an adjacent lane, or spot them in good health, submit a quick log.
                    It helps local feeders keep an accurate welfare ledger.
                  </p>
                </div>

                <div className="tag-faq-card">
                  <h4>What should I do if a collar is too tight or damaged?</h4>
                  <p>
                    Enter the tag code here and call the registered caregiver phone number. Local feeders
                    maintain replacement collar bands and will adjust or replace the collar during their regular rounds.
                  </p>
                </div>

                <div className="tag-faq-card">
                  <h4>How can our volunteer group or NGO get collar tags?</h4>
                  <p>
                    The Tailz Club collaborates with local animal welfare organizations, RWAs, and independent caretakers
                    to provide subsidized collar batches for upcoming vaccination drives. Connect with us through the
                    community portal to organize a drive in your locality.
                  </p>
                </div>
              </div>
            </section>

            {/* Promoting The Tailz Club & Movement CTA */}
            <section className="tag-cta-section">
              <div className="tag-cta-card">
                <div className="tag-cta-content">
                  <span className="tag-cta-badge">
                    <Heart size={14} />
                    <span>Empowering Street Animal Welfare</span>
                  </span>
                  <h2>Be the Guardian Your Street Animals Deserve</h2>
                  <p>
                    The Tailz Club is built to uplift community animals across India. Connect with neighborhood feeders,
                    map your local street dogs, coordinate medical emergencies, and create safe, welcoming spaces
                    for all beings.
                  </p>
                  <div className="tag-cta-actions">
                    <Link to="/community" className="tag-cta-btn-primary">
                      <span>Explore Community Feed</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link to="/" className="tag-cta-btn-secondary">
                      <span>Learn More About The Tailz Club</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Phase 2 Option A: Unassigned Tag OR User Feeding Details on New Tag */}
        {!loading && ((animal && animal.status === 'unassigned') || isPairingNew) && (
          <div className="tag-pair-card">
            <div className="tag-pair-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="pill pill--sterilized">
                  <Tag size={13} />
                  <span>Collar Tag: {animal?.tag_code || cleanCode}</span>
                </span>
                {isPairingNew && (
                  <button
                    type="button"
                    className="pill pill--territory"
                    onClick={() => {
                      setIsPairingNew(false);
                      setNotFound(true);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              <h2>Field Vaccination Drive Intake</h2>
              <p>
                This collar tag is ready to pair. Enter animal details to link and
                activate it live in 30 seconds.
              </p>
            </div>

            <form className="tag-pair-form" onSubmit={handlePairSubmit}>
              <div className="tag-pair-row tag-pair-row--2">
                <div className="tag-field-group">
                  <label htmlFor="pair-name">Animal Name / Nickname</label>
                  <input
                    id="pair-name"
                    type="text"
                    className="tag-field-input"
                    value={pairName}
                    onChange={(e) => setPairName(e.target.value)}
                    placeholder="e.g. Sheru / Brownie"
                    required
                  />
                </div>

                <div className="tag-field-group">
                  <label htmlFor="pair-gender">Gender</label>
                  <select
                    id="pair-gender"
                    className="tag-field-input"
                    value={pairGender}
                    onChange={(e) =>
                      setPairGender(e.target.value as 'male' | 'female' | 'unknown')
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="tag-checkbox-group">
                <label className="tag-checkbox-label">
                  <input
                    type="checkbox"
                    checked={pairSterilized}
                    onChange={(e) => setPairSterilized(e.target.checked)}
                  />
                  <span>Sterilized (ABC Surgery Completed)</span>
                </label>

                <label className="tag-checkbox-label">
                  <input
                    type="checkbox"
                    checked={pairEarNotched}
                    onChange={(e) => setPairEarNotched(e.target.checked)}
                  />
                  <span>Ear Notched (Identification Mark)</span>
                </label>
              </div>

              <div className="tag-pair-row tag-pair-row--2">
                <div className="tag-field-group">
                  <label htmlFor="pair-territory">Home Street / Landmark</label>
                  <input
                    id="pair-territory"
                    type="text"
                    className="tag-field-input"
                    value={pairTerritory}
                    onChange={(e) => setPairTerritory(e.target.value)}
                    placeholder="e.g. Carter Road Promenade near Amphitheatre"
                    required
                  />
                </div>

                <div className="tag-field-group">
                  <label htmlFor="pair-city">City</label>
                  <input
                    id="pair-city"
                    type="text"
                    className="tag-field-input"
                    value={pairCity}
                    onChange={(e) => setPairCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    required
                  />
                </div>
              </div>

              <div className="tag-pair-row tag-pair-row--2">
                <div className="tag-field-group">
                  <label htmlFor="pair-caregiver">
                    Local Feeder / Caregiver Phone <span className="tag-field-optional">(Optional)</span>
                  </label>
                  <input
                    id="pair-caregiver"
                    type="tel"
                    className="tag-field-input"
                    value={pairCaregiver}
                    onChange={(e) => setPairCaregiver(e.target.value)}
                    placeholder="e.g. +91 98200 12345 (Leave blank if none)"
                  />
                  <span className="tag-field-hint">Optional: Can be linked or updated later by community feeders.</span>
                </div>

                <div className="tag-field-group">
                  <label>
                    Animal Photo <span className="tag-field-optional">(Optional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />

                  {!photoPreview ? (
                    <div
                      className="tag-photo-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="tag-photo-dropzone__icon-row">
                        <Camera size={22} />
                        <Upload size={18} />
                      </div>
                      <p className="tag-photo-dropzone__title">Click / Upload Photo</p>
                      <p className="tag-photo-dropzone__sub">Snap with camera or pick from gallery</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                      <div className="tag-photo-preview-wrap">
                        <img src={photoPreview} alt="Animal Preview" className="tag-photo-preview-img" />
                        <button
                          type="button"
                          className="tag-photo-remove-btn"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPairPhotoUrl('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="tag-photo-retake-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera size={14} />
                        <span>Retake / Change Photo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Initial Vaccine Administered */}
              <div className="tag-vax-box">
                <p className="tag-vax-box__title">
                  <ShieldCheck size={16} color="#059669" />
                  <span>Vaccine Administered During Intake</span>
                </p>
                <div className="tag-pair-row tag-pair-row--3">
                  <div className="tag-field-group">
                    <label>Vaccine Name</label>
                    <input
                      type="text"
                      className="tag-field-input"
                      value={pairVaxName}
                      onChange={(e) => setPairVaxName(e.target.value)}
                      placeholder="Anti-Rabies (ARV)"
                      required
                    />
                  </div>

                  <div className="tag-field-group">
                    <label>Drive Name</label>
                    <input
                      type="text"
                      className="tag-field-input"
                      value={pairDriveName}
                      onChange={(e) => setPairDriveName(e.target.value)}
                      placeholder="Drive Name"
                    />
                  </div>

                  <div className="tag-field-group">
                    <label>Batch No. (optional)</label>
                    <input
                      type="text"
                      className="tag-field-input"
                      value={pairBatchNo}
                      onChange={(e) => setPairBatchNo(e.target.value)}
                      placeholder="e.g. RAB-2026-A1"
                    />
                  </div>
                </div>
              </div>

              {pairError && (
                <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: 0 }}>
                  {pairError}
                </p>
              )}

              <button
                type="submit"
                className="tag-pair-submit-btn"
                disabled={pairingSubmitting || photoUploading}
              >
                <PlusCircle size={18} />
                <span>
                  {photoUploading
                    ? 'Uploading Photo...'
                    : pairingSubmitting
                    ? 'Activating Collar...'
                    : 'Activate & Pair Collar Tag'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Animal Details & Profile for Active Tag */}
        {!loading && animal && animal.status !== 'unassigned' && (
          <>
            <div className="tag-hero-card">
              <div className="tag-hero-grid">
                <div className="tag-hero-media">
                  <img
                    src={
                      animal.photo_url ||
                      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={animal.name}
                  />
                  <div className="tag-badge-overlay">
                    <ShieldCheck size={14} />
                    <span>TAG: {animal.tag_code}</span>
                  </div>
                </div>

                <div className="tag-hero-content">
                  <div>
                    <div className="tag-hero-title-row">
                      <div>
                        <h1 className="tag-hero-name">{animal.name}</h1>
                        <div className="tag-hero-species">
                          {animal.species} &bull; {animal.gender || 'Unknown gender'} &bull;{' '}
                          <span style={{ textTransform: 'capitalize' }}>
                            Status: {animal.status}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="pill pill--territory"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `${animal.name} - The Tailz Club Collar Tag`,
                              url: window.location.href,
                            });
                          }
                        }}
                        title="Share profile"
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>

                    <div className="tag-status-pills">
                      {isRabiesValid ? (
                        <span className="pill pill--rabies-valid">
                          <ShieldCheck size={14} />
                          <span>Rabies Vaccinated (Valid)</span>
                        </span>
                      ) : (
                        <span className="pill pill--rabies-expired">
                          <ShieldAlert size={14} />
                          <span>Rabies Booster Due</span>
                        </span>
                      )}

                      {animal.is_sterilized && (
                        <span className="pill pill--sterilized">
                          <CheckCircle2 size={14} />
                          <span>Sterilized (ABC Program)</span>
                        </span>
                      )}

                      {animal.ear_notched && (
                        <span className="pill pill--sterilized">
                          <CheckCircle2 size={14} />
                          <span>Ear Notched</span>
                        </span>
                      )}

                      {animal.territory && (
                        <span className="pill pill--territory">
                          <MapPin size={14} />
                          <span>
                            Territory: {animal.territory}
                            {animal.city ? `, ${animal.city}` : ''}
                          </span>
                        </span>
                      )}

                      {animal.last_seen_location && (
                        <span
                          className="pill"
                          style={{
                            background: '#F0FDF4',
                            color: '#166534',
                            border: '1px solid #BBF7D0',
                          }}
                        >
                          <Eye size={14} />
                          <span>
                            Last spotted: {animal.last_seen_location}
                            {animal.last_seen_at
                              ? ` (${new Date(animal.last_seen_at).toLocaleDateString()})`
                              : ''}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {animal.caregiver_contact && (
                    <div className="tag-caregiver-box">
                      <div className="tag-caregiver-info">
                        <h4>Community Caregiver</h4>
                        <p>{animal.caregiver_contact}</p>
                      </div>
                      <a
                        href={`tel:${animal.caregiver_contact.replace(/[^0-9+]/g, '')}`}
                        className="tag-call-btn"
                      >
                        <Phone size={13} />
                        <span>Contact</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Split Content: Vaccinations & Community Log */}
            <div className="tag-content-grid">
              {/* Vaccination Card */}
              <div className="tag-card">
                <h3 className="tag-card__title">
                  <ShieldCheck size={18} color="#7C3AED" />
                  <span>Vaccination & Health History</span>
                </h3>

                {vaccinations.length === 0 ? (
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
                    No recorded vaccinations for this animal yet.
                  </p>
                ) : (
                  <div>
                    {vaccinations.map((vax) => {
                      const isValid = new Date(vax.valid_until) >= new Date();
                      return (
                        <div key={vax.id} className="vax-item">
                          <div className="vax-item__dot" />
                          <p className="vax-item__title">{vax.vaccine_name}</p>
                          <div className="vax-item__meta">
                            Administered: {vax.administered_date} &bull; Valid until:{' '}
                            <strong style={{ color: isValid ? '#065F46' : '#991B1B' }}>
                              {vax.valid_until}
                            </strong>
                          </div>
                          {vax.drive_name && (
                            <span className="vax-item__badge">
                              Drive: {vax.drive_name}
                            </span>
                          )}
                          {vax.batch_number && (
                            <span
                              className="vax-item__badge"
                              style={{ marginLeft: '0.4rem' }}
                            >
                              Batch: {vax.batch_number}
                            </span>
                          )}
                          {vax.notes && (
                            <p
                              style={{
                                margin: '0.35rem 0 0',
                                fontSize: '0.82rem',
                                color: '#475569',
                              }}
                            >
                              {vax.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Community Log Card */}
              <div className="tag-card">
                <h3 className="tag-card__title">
                  <HeartHandshake size={18} color="#7C3AED" />
                  <span>Community Care & Sightings Log</span>
                </h3>

                {/* Form to log updates */}
                <form className="log-form" onSubmit={handleLogSubmit}>
                  <div className="log-type-selector">
                    <button
                      type="button"
                      className={`log-type-btn ${
                        logType === 'feeding' ? 'log-type-btn--active' : ''
                      }`}
                      onClick={() => setLogType('feeding')}
                    >
                      <Utensils size={13} />
                      <span>Fed Today</span>
                    </button>
                    <button
                      type="button"
                      className={`log-type-btn ${
                        logType === 'sighting' ? 'log-type-btn--active' : ''
                      }`}
                      onClick={() => setLogType('sighting')}
                    >
                      <Eye size={13} />
                      <span>Sighting</span>
                    </button>
                    <button
                      type="button"
                      className={`log-type-btn ${
                        logType === 'health_alert' ? 'log-type-btn--active' : ''
                      }`}
                      onClick={() => setLogType('health_alert')}
                    >
                      <AlertCircle size={13} />
                      <span>Health Alert</span>
                    </button>
                  </div>

                  <textarea
                    className="log-input"
                    rows={2}
                    placeholder={
                      logType === 'feeding'
                        ? 'What did you feed? e.g. Boiled rice, broth, and kibble.'
                        : logType === 'sighting'
                        ? 'Where was the animal spotted? e.g. Resting near Gate 2.'
                        : 'Describe health issue: e.g. Limping on front right paw.'
                    }
                    value={logBody}
                    onChange={(e) => setLogBody(e.target.value)}
                    required
                  />

                  <div className="log-meta-inputs">
                    <input
                      type="text"
                      className="log-sub-input"
                      placeholder="Your name (optional)"
                      value={logReporter}
                      onChange={(e) => setLogReporter(e.target.value)}
                    />
                    <input
                      type="text"
                      className="log-sub-input"
                      placeholder="Landmark / Spot"
                      value={logLocation}
                      onChange={(e) => setLogLocation(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="log-submit-btn"
                      disabled={submittingLog || !logBody.trim()}
                    >
                      Submit
                    </button>
                  </div>

                  {logMessage && (
                    <p
                      style={{
                        margin: '0.5rem 0 0',
                        fontSize: '0.8rem',
                        color: logMessage.includes('Could not')
                          ? '#DC2626'
                          : '#059669',
                      }}
                    >
                      {logMessage}
                    </p>
                  )}
                </form>

                {/* Timeline */}
                <div className="log-timeline">
                  {logs.length === 0 ? (
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                      No community reports yet. Be the first to log a feeding or
                      sighting!
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className={`log-bubble log-bubble--${log.log_type}`}
                      >
                        <div className="log-bubble__header">
                          <span className="log-bubble__author">
                            {log.reporter_name || 'Local Resident'}
                          </span>
                          <span>
                            {new Date(log.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="log-bubble__text">{log.body}</p>
                        {log.location_detail && (
                          <div
                            style={{
                              marginTop: '0.35rem',
                              fontSize: '0.75rem',
                              color: '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <MapPin size={11} />
                            <span>{log.location_detail}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* The Tailz Club Mission & Cause Promotion Banner */}
            <section className="tag-promo-banner">
              <div className="tag-promo-content">
                <h2>Protecting Street Animals Together with The Tailz Club</h2>
                <p>
                  This collar was fitted during a community vaccination drive to
                  protect street animals from preventable diseases like Rabies and
                  ensure neighborhood harmony. The Tailz Club connects volunteers, feeders,
                  and local citizens to look after community pets.
                </p>
                <div className="tag-promo-actions">
                  <Link to="/community" className="tag-promo-btn tag-promo-btn--primary">
                    <Users size={16} />
                    <span>Join The Tailz Club Community</span>
                  </Link>
                  <Link to="/" className="tag-promo-btn tag-promo-btn--secondary">
                    <Sparkles size={16} />
                    <span>Learn About the Cause</span>
                  </Link>
                </div>
              </div>

              <div className="tag-promo-perks">
                <div className="tag-perk-item">
                  <ShieldCheck size={18} className="tag-perk-icon" />
                  <span>
                    <strong>100% Verified Rabies Records:</strong> Transparent safety
                    for peaceful human-canine coexistence.
                  </span>
                </div>
                <div className="tag-perk-item">
                  <HeartHandshake size={18} className="tag-perk-icon" />
                  <span>
                    <strong>Community Guardianship:</strong> Connect with area feeders
                    and volunteers in an emergency.
                  </span>
                </div>
                <div className="tag-perk-item">
                  <Calendar size={18} className="tag-perk-icon" />
                  <span>
                    <strong>Annual Booster Reminders:</strong> Never let a street dog
                    miss their yearly vaccination.
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
