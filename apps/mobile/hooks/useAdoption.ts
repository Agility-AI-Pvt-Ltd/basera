import { useCallback, useEffect, useState } from 'react';

import { getAdoptionMediaUrl } from '@/lib/adoptionStorage';
import { computeCompatibility } from '@/lib/adoptionCompatibility';
import { supabase } from '@/lib/supabase';
import type {
  AdoptionApplication,
  AdoptionConversation,
  AdoptionListing,
  AdoptionListingMedia,
  AdoptionMessage,
  ApplicationStatus,
  ListingFilters,
  ListingSourceType,
} from '@/types/adoption';

type ListingRow = Record<string, unknown>;
type ApplicationRow = Record<string, unknown>;

function mapListing(row: ListingRow, media: AdoptionListingMedia[] = []): AdoptionListing {
  return {
    id: row.id as string,
    listedBy: row.listed_by as string,
    petId: (row.pet_id as string | null) ?? null,
    sourceType: row.source_type as AdoptionListing['sourceType'],
    status: row.status as AdoptionListing['status'],
    title: row.title as string,
    description: row.description as string,
    petName: row.pet_name as string,
    species: row.species as AdoptionListing['species'],
    breed: row.breed as string,
    ageLabel: row.age_label as string,
    gender: (row.gender as AdoptionListing['gender']) ?? null,
    size: (row.size as AdoptionListing['size']) ?? null,
    color: row.color as string,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    sterilized: row.sterilized as boolean | null,
    goodWithChildren: row.good_with_children as boolean | null,
    goodWithDogs: row.good_with_dogs as boolean | null,
    goodWithCats: row.good_with_cats as boolean | null,
    energyLevel: (row.energy_level as AdoptionListing['energyLevel']) ?? null,
    temperamentTags: (row.temperament_tags as string[]) ?? [],
    healthStatus: (row.health_status as AdoptionListing['healthStatus']) ?? null,
    vaccinationTags: (row.vaccination_tags as string[]) ?? [],
    strayInfo: (row.stray_info as AdoptionListing['strayInfo']) ?? {},
    adoptionRequirements: (row.adoption_requirements as AdoptionListing['adoptionRequirements']) ?? {},
    adoptionPreferences: (row.adoption_preferences as AdoptionListing['adoptionPreferences']) ?? {},
    city: row.city as string,
    state: row.state as string,
    country: row.country as string,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    publicLocationLabel: row.public_location_label as string,
    adoptionRadius: row.adoption_radius as string,
    verificationStatus: row.verification_status as string,
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    media,
  };
}

function mapApplication(row: ApplicationRow): AdoptionApplication {
  return {
    id: row.id as string,
    listingId: row.listing_id as string,
    applicantId: row.applicant_id as string,
    status: row.status as ApplicationStatus,
    applicantProfile: (row.applicant_profile as Record<string, unknown>) ?? {},
    home: (row.home as Record<string, unknown>) ?? {},
    household: (row.household as Record<string, unknown>) ?? {},
    existingPets: (row.existing_pets as Record<string, unknown>[]) ?? [],
    experience: (row.experience as Record<string, unknown>) ?? {},
    availability: (row.availability as Record<string, unknown>) ?? {},
    financial: (row.financial as Record<string, unknown>) ?? {},
    answers: (row.answers as Record<string, unknown>) ?? {},
    compatibilityScore: row.compatibility_score != null ? Number(row.compatibility_score) : null,
    compatibilityInsights: (row.compatibility_insights as AdoptionApplication['compatibilityInsights']) ?? [],
    submittedAt: (row.submitted_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

async function attachMediaUrls(media: AdoptionListingMedia[]): Promise<AdoptionListingMedia[]> {
  return Promise.all(
    media.map(async (m) => ({
      ...m,
      url: await getAdoptionMediaUrl(m.storageKey),
    })),
  );
}

export function useAdoptionBrowse(filters: ListingFilters) {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('adoption_listings').select('*').eq('status', 'active').order('published_at', {
      ascending: false,
    });

    if (filters.species && filters.species !== 'all') {
      query = query.eq('species', filters.species);
    }
    if (filters.city?.trim()) {
      query = query.ilike('city', `%${filters.city.trim()}%`);
    }
    if (filters.gender && filters.gender !== 'all') {
      query = query.eq('gender', filters.gender);
    }
    if (filters.size && filters.size !== 'all') {
      query = query.eq('size', filters.size);
    }
    if (filters.goodWithChildren) query = query.eq('good_with_children', true);
    if (filters.goodWithDogs) query = query.eq('good_with_dogs', true);
    if (filters.sterilized) query = query.eq('sterilized', true);

    const { data, error } = await query;
    if (error) {
      setListings([]);
      setLoading(false);
      return;
    }

    let rows = (data as ListingRow[]) ?? [];
    if (filters.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          String(r.pet_name).toLowerCase().includes(q) ||
          String(r.breed).toLowerCase().includes(q) ||
          String(r.city).toLowerCase().includes(q),
      );
    }
    if (filters.vaccinated) {
      rows = rows.filter((r) => ((r.vaccination_tags as string[]) ?? []).length > 0);
    }

    const withMedia = await Promise.all(
      rows.map(async (row) => {
        const { data: mediaRows } = await supabase
          .from('adoption_listing_media')
          .select('*')
          .eq('listing_id', row.id as string)
          .order('sort_order');
        const media = await attachMediaUrls(
          ((mediaRows as Record<string, unknown>[]) ?? []).map((m) => ({
            id: m.id as string,
            listingId: m.listing_id as string,
            mediaType: m.media_type as 'image' | 'video',
            storageKey: m.storage_key as string,
            sortOrder: m.sort_order as number,
            category: (m.category as string | null) ?? null,
          })),
        );
        return mapListing(row, media);
      }),
    );

    setListings(withMedia);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return { listings, loading, reload: load };
}

export function useAdoptionListing(listingId: string | undefined) {
  const [listing, setListing] = useState<AdoptionListing | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('adoption_listings')
      .select('*')
      .eq('id', listingId)
      .maybeSingle();
    if (error || !data) {
      setListing(null);
      setLoading(false);
      return;
    }
    const { data: mediaRows } = await supabase
      .from('adoption_listing_media')
      .select('*')
      .eq('listing_id', listingId)
      .order('sort_order');
    const media = await attachMediaUrls(
      ((mediaRows as Record<string, unknown>[]) ?? []).map((m) => ({
        id: m.id as string,
        listingId: m.listing_id as string,
        mediaType: m.media_type as 'image' | 'video',
        storageKey: m.storage_key as string,
        sortOrder: m.sort_order as number,
        category: (m.category as string | null) ?? null,
      })),
    );
    const { count } = await supabase
      .from('adoption_applications')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);
    const mapped = mapListing(data as ListingRow, media);
    mapped.applicationCount = count ?? 0;
    setListing(mapped);
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { listing, loading, reload: load };
}

export async function createListingDraft(input: {
  sourceType: ListingSourceType;
  petId?: string | null;
  petName: string;
  species?: AdoptionListing['species'];
}): Promise<AdoptionListing> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('adoption_listings')
    .insert({
      listed_by: user.id,
      pet_id: input.petId ?? null,
      source_type: input.sourceType,
      status: 'draft',
      pet_name: input.petName,
      species: input.species ?? 'dog',
      title: `${input.petName} is looking for a loving home`,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapListing(data as ListingRow);
}

export async function updateListing(listingId: string, patch: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('adoption_listings')
    .update(patch)
    .eq('id', listingId)
    .select('*')
    .single();
  if (error) throw error;
  return mapListing(data as ListingRow);
}

export async function publishListing(listingId: string, sourceType: ListingSourceType) {
  const status = sourceType === 'stray' ? 'pending_verification' : 'active';
  const verification = sourceType === 'stray' ? 'pending' : 'none';
  const { data, error } = await supabase
    .from('adoption_listings')
    .update({
      status,
      verification_status: verification,
      published_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select('*')
    .single();
  if (error) throw error;
  return mapListing(data as ListingRow);
}

export async function addListingMediaRow(
  listingId: string,
  storageKey: string,
  mediaType: 'image' | 'video',
  sortOrder: number,
) {
  const { error } = await supabase.from('adoption_listing_media').insert({
    listing_id: listingId,
    storage_key: storageKey,
    media_type: mediaType,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function submitAdoptionApplication(input: {
  listing: AdoptionListing;
  applicantProfile: Record<string, unknown>;
  home: Record<string, unknown>;
  household: Record<string, unknown>;
  existingPets: Record<string, unknown>[];
  experience: Record<string, unknown>;
  availability: Record<string, unknown>;
  financial: Record<string, unknown>;
  answers: Record<string, unknown>;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const draft = {
    home: input.home,
    household: input.household,
    existingPets: input.existingPets,
    experience: input.experience,
    availability: input.availability,
    financial: input.financial,
  };
  const { score, insights } = computeCompatibility(input.listing, {
    ...draft,
    existingPets: input.existingPets,
  });

  const { data, error } = await supabase
    .from('adoption_applications')
    .upsert(
      {
        listing_id: input.listing.id,
        applicant_id: user.id,
        status: 'pending',
        applicant_profile: input.applicantProfile,
        home: input.home,
        household: input.household,
        existing_pets: input.existingPets,
        experience: input.experience,
        availability: input.availability,
        financial: input.financial,
        answers: input.answers,
        compatibility_score: score,
        compatibility_insights: insights,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'listing_id,applicant_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  const application = mapApplication(data as ApplicationRow);

  await supabase.from('adoption_conversations').upsert(
    {
      listing_id: input.listing.id,
      application_id: application.id,
      lister_id: input.listing.listedBy,
      applicant_id: user.id,
    },
    { onConflict: 'application_id' },
  );

  await supabase
    .from('adoption_applications')
    .update({ status: 'under_review' })
    .eq('id', application.id);

  return { ...application, status: 'under_review' as ApplicationStatus };
}

export function useMyAdoptionListings() {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('adoption_listings')
      .select('*')
      .eq('listed_by', user.id)
      .order('updated_at', { ascending: false });
    const rows = (data as ListingRow[]) ?? [];
    const mapped = await Promise.all(
      rows.map(async (row) => {
        const { count } = await supabase
          .from('adoption_applications')
          .select('*', { count: 'exact', head: true })
          .eq('listing_id', row.id as string);
        const listing = mapListing(row);
        listing.applicationCount = count ?? 0;
        return listing;
      }),
    );
    setListings(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { listings, loading, reload: load };
}

export function useListingApplications(listingId: string | undefined) {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    const { data } = await supabase
      .from('adoption_applications')
      .select('*')
      .eq('listing_id', listingId)
      .order('submitted_at', { ascending: false });
    setApplications(((data as ApplicationRow[]) ?? []).map(mapApplication));
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (applicationId: string, status: ApplicationStatus) => {
    const { error } = await supabase
      .from('adoption_applications')
      .update({ status })
      .eq('id', applicationId);
    if (error) throw error;
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  return { applications, loading, reload: load, updateStatus };
}

export function useMyApplications() {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('adoption_applications')
      .select('*')
      .eq('applicant_id', user.id)
      .order('updated_at', { ascending: false });
    setApplications(((data as ApplicationRow[]) ?? []).map(mapApplication));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { applications, loading, reload: load };
}

export function useAdoptionChat(applicationId: string | undefined) {
  const [conversation, setConversation] = useState<AdoptionConversation | null>(null);
  const [messages, setMessages] = useState<AdoptionMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    const { data: conv } = await supabase
      .from('adoption_conversations')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();
    if (!conv) {
      setConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }
    setConversation({
      id: conv.id,
      listingId: conv.listing_id,
      applicationId: conv.application_id,
      listerId: conv.lister_id,
      applicantId: conv.applicant_id,
      createdAt: conv.created_at,
    });
    const { data: msgs } = await supabase
      .from('adoption_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at');
    setMessages(
      ((msgs as Record<string, unknown>[]) ?? []).map((m) => ({
        id: m.id as string,
        conversationId: m.conversation_id as string,
        senderId: m.sender_id as string,
        body: m.body as string,
        createdAt: m.created_at as string,
      })),
    );
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendMessage = async (body: string) => {
    if (!conversation) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('adoption_messages')
      .insert({ conversation_id: conversation.id, sender_id: user.id, body: body.trim() })
      .select('*')
      .single();
    if (error) throw error;
    const msg: AdoptionMessage = {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      body: data.body,
      createdAt: data.created_at,
    };
    setMessages((prev) => [...prev, msg]);
  };

  return { conversation, messages, loading, reload: load, sendMessage };
}

export async function reportListing(listingId: string, reason: string, details?: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('adoption_reports').insert({
    reporter_id: user.id,
    listing_id: listingId,
    reason,
    details: details?.trim() || null,
  });
  if (error) throw error;
}
