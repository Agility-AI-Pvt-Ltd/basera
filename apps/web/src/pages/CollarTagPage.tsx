import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  HeartHandshake,
  MapPin,
  Phone,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Eye,
  PlusCircle,
  Tag,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
  const [pairVaxName, setPairVaxName] = useState('Anti-Rabies Vaccine (ARV)');
  const [pairDriveName, setPairDriveName] = useState('Community Vaccination Drive');
  const [pairBatchNo, setPairBatchNo] = useState('');
  const [pairingSubmitting, setPairingSubmitting] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  // Community log form state
  const [logType, setLogType] = useState<AnimalLog['log_type']>('feeding');
  const [logBody, setLogBody] = useState('');
  const [logReporter, setLogReporter] = useState('');
  const [logLocation, setLogLocation] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  const cleanCode = (tagCode || '').trim().toUpperCase();

  const fetchAnimalData = useCallback(async (code: string) => {
    if (!code) {
      setAnimal(null);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      // 1. Fetch animal
      const { data: animalData, error: animalErr } = await supabase
        .from('community_animals')
        .select('*')
        .ilike('tag_code', code)
        .maybeSingle();

      if (animalErr || !animalData) {
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

  // Phase 2 Option A: Field Volunteer Fast Pairing
  const handlePairSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!animal) return;

    setPairingSubmitting(true);
    setPairError(null);

    const today = new Date().toISOString().slice(0, 10);
    const validUntilDate = new Date();
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
    const validUntil = validUntilDate.toISOString().slice(0, 10);

    try {
      // 1. Activate animal
      const { error: animalErr } = await supabase
        .from('community_animals')
        .update({
          name: pairName.trim() || `Community Dog #${animal.tag_code}`,
          gender: pairGender,
          territory: pairTerritory.trim(),
          city: pairCity.trim(),
          is_sterilized: pairSterilized,
          ear_notched: pairEarNotched,
          caregiver_contact: pairCaregiver.trim() || null,
          photo_url: pairPhotoUrl.trim() || null,
          status: 'active',
          last_seen_location: pairTerritory.trim() || null,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', animal.id);

      if (animalErr) throw animalErr;

      // 2. Insert initial vaccination record
      if (pairVaxName.trim()) {
        const { error: vaxErr } = await supabase
          .from('community_animal_vaccinations')
          .insert({
            animal_id: animal.id,
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
        animal_id: animal.id,
        log_type: 'sighting',
        body: 'Collar tag fitted and vaccinated during community drive.',
        reporter_name: 'Drive Volunteer',
        location_detail: pairTerritory.trim() || pairCity.trim() || undefined,
      });

      // Reload
      await fetchAnimalData(animal.tag_code);
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
            <span>Basera</span>
          </Link>
          <div className="tag-nav__links">
            <Link to="/community" className="tag-nav__link">
              Community Feed
            </Link>
            <Link to="/" className="tag-nav__btn">
              About Basera
            </Link>
          </div>
        </div>
      </header>

      <main className="tag-container">
        {/* Search Bar for Quick Tag Lookup */}
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

        {/* Loading State */}
        {loading && (
          <div className="tag-empty-state">
            <Activity className="animate-spin" size={32} color="#7C3AED" />
            <h2>Loading Tag Details...</h2>
          </div>
        )}

        {/* Not Found State */}
        {!loading && notFound && (
          <div className="tag-empty-state">
            <AlertCircle size={44} color="#DC2626" />
            <h2>Tag Not Found</h2>
            <p>
              We could not find an animal linked to tag code{' '}
              <strong>"{cleanCode}"</strong>. Check the collar code or contact the
              local animal drive coordinator.
            </p>
            <Link to="/tag" className="tag-nav__btn">
              Try Another Tag
            </Link>
          </div>
        )}

        {/* Empty / Landing Search State */}
        {!loading && !notFound && !animal && (
          <div className="tag-empty-state">
            <ShieldCheck size={48} color="#7C3AED" />
            <h2>Basera Community Collar Lookup</h2>
            <p>
              Enter the tag number printed below the QR code on the animal's
              collar to check vaccination history, sterilization status, and
              caregiver contacts.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="tag-nav__btn"
                onClick={() => navigate('/t/BAS-001')}
              >
                View Sample Active Tag (BAS-001)
              </button>
              <button
                type="button"
                className="tag-nav__btn"
                style={{ background: '#4C1D95' }}
                onClick={() => navigate('/t/BAS-003')}
              >
                Test Field Pairing (BAS-003)
              </button>
            </div>
          </div>
        )}

        {/* Phase 2 Option A: Unassigned Tag -> Field Pairing Form */}
        {!loading && animal && animal.status === 'unassigned' && (
          <div className="tag-pair-card">
            <div className="tag-pair-header">
              <span className="pill pill--sterilized">
                <Tag size={13} />
                <span>Collar Tag: {animal.tag_code}</span>
              </span>
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
                  <label htmlFor="pair-caregiver">Local Feeder / Caregiver Contact</label>
                  <input
                    id="pair-caregiver"
                    type="text"
                    className="tag-field-input"
                    value={pairCaregiver}
                    onChange={(e) => setPairCaregiver(e.target.value)}
                    placeholder="e.g. +91 98200 12345 (Renu)"
                  />
                </div>

                <div className="tag-field-group">
                  <label htmlFor="pair-photo">Photo URL (optional)</label>
                  <input
                    id="pair-photo"
                    type="url"
                    className="tag-field-input"
                    value={pairPhotoUrl}
                    onChange={(e) => setPairPhotoUrl(e.target.value)}
                    placeholder="https://..."
                  />
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
                disabled={pairingSubmitting}
              >
                <PlusCircle size={18} />
                <span>
                  {pairingSubmitting
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
                              title: `${animal.name} - Basera Collar Tag`,
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

            {/* Basera Mission & Cause Promotion Banner */}
            <section className="tag-promo-banner">
              <div className="tag-promo-content">
                <h2>Protecting Street Animals Together with Basera</h2>
                <p>
                  This collar was fitted during a community vaccination drive to
                  protect street animals from preventable diseases like Rabies and
                  ensure neighborhood harmony. Basera connects volunteers, feeders,
                  and local citizens to look after community pets.
                </p>
                <div className="tag-promo-actions">
                  <Link to="/community" className="tag-promo-btn tag-promo-btn--primary">
                    <Users size={16} />
                    <span>Join Basera Community</span>
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
