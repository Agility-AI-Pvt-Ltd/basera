import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildRecommendedFeed } from '@/lib/communityRecommendations';
import { distanceKm, withDistance, type GeoPoint } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type {
  CommunityMeetup,
  CommunityPack,
  MeetupType,
  NeighborProfile,
  PackCategory,
  PackPost,
  PackPrivacy,
} from '@/types/community';
import type { UserProfile } from '@/types/profile';

type Row = Record<string, unknown>;

function mapPack(row: Row): CommunityPack {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    coverStorageKey: (row.cover_storage_key as string | null) ?? null,
    category: row.category as CommunityPack['category'],
    city: row.city as string,
    area: row.area as string,
    state: row.state as string,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    radiusKm: Number(row.radius_km),
    privacy: row.privacy as CommunityPack['privacy'],
    rules: (row.rules as string[]) ?? [],
    memberCount: Number(row.member_count),
    createdBy: row.created_by as string,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

function mapMeetup(row: Row): CommunityMeetup {
  return {
    id: row.id as string,
    packId: (row.pack_id as string | null) ?? null,
    createdBy: row.created_by as string,
    title: row.title as string,
    meetupType: row.meetup_type as CommunityMeetup['meetupType'],
    description: row.description as string,
    startAt: row.start_at as string,
    endAt: (row.end_at as string | null) ?? null,
    locationName: row.location_name as string,
    city: row.city as string,
    area: row.area as string,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    maxAttendees: row.max_attendees != null ? Number(row.max_attendees) : null,
    privacy: row.privacy as string,
    status: row.status as string,
  };
}

function originFromProfile(profile: UserProfile | null): GeoPoint | null {
  if (!profile?.localityPin) return null;
  return profile.localityPin;
}

export function useCommunityDiscovery(profile: UserProfile | null, userId: string | null) {
  const [packs, setPacks] = useState<CommunityPack[]>([]);
  const [meetups, setMeetups] = useState<CommunityMeetup[]>([]);
  const [neighbors, setNeighbors] = useState<NeighborProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const origin = originFromProfile(profile);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();

    let packQuery = supabase.from('community_packs').select('*').eq('status', 'active');
    if (profile?.city?.trim()) {
      packQuery = packQuery.ilike('city', `%${profile.city.trim()}%`);
    }

    const meetupQuery = supabase
      .from('community_meetups')
      .select('*')
      .eq('status', 'upcoming')
      .gte('start_at', now)
      .order('start_at', { ascending: true });

    const [packRes, meetupRes, profileRes, petsRes, membershipRes, attendeeRes, connRes] =
      await Promise.all([
        packQuery,
        meetupQuery,
        supabase
          .from('profiles')
          .select('id, name, city, locality, photo_uri, locality_lat, locality_lng, show_distance, show_pet_to_neighbors, pet')
          .neq('id', userId ?? '')
          .eq('signup_complete', true),
        supabase.from('pets').select('owner_id, name, breed, species'),
        userId
          ? supabase.from('pack_members').select('pack_id, status').eq('user_id', userId)
          : Promise.resolve({ data: [], error: null }),
        userId
          ? supabase.from('meetup_attendees').select('meetup_id, status').eq('user_id', userId)
          : Promise.resolve({ data: [], error: null }),
        userId
          ? supabase
              .from('community_connections')
              .select('requester_id, recipient_id, status')
              .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          : Promise.resolve({ data: [], error: null }),
      ]);

    const membership = new Map(
      ((membershipRes.data ?? []) as Row[]).map((m) => [m.pack_id as string, m.status as string]),
    );
    const attendance = new Map(
      ((attendeeRes.data ?? []) as Row[]).map((m) => [
        m.meetup_id as string,
        m.status as 'going' | 'interested',
      ]),
    );

    const goingCounts = new Map<string, number>();
    if (meetupRes.data?.length) {
      const ids = (meetupRes.data as Row[]).map((r) => r.id as string);
      const { data: counts } = await supabase
        .from('meetup_attendees')
        .select('meetup_id')
        .in('meetup_id', ids)
        .eq('status', 'going');
      for (const row of (counts ?? []) as Row[]) {
        const id = row.meetup_id as string;
        goingCounts.set(id, (goingCounts.get(id) ?? 0) + 1);
      }
    }

    let nextPacks = withDistance(
      ((packRes.data ?? []) as Row[]).map(mapPack),
      origin,
    ).map((p) => ({
      ...p,
      isMember: membership.get(p.id) === 'active',
      memberStatus: membership.get(p.id) as CommunityPack['memberStatus'],
    }));

    if (origin) {
      nextPacks = nextPacks.filter(
        (p) => p.distanceKm == null || p.distanceKm <= Math.max(p.radiusKm, 25),
      );
    }

    let nextMeetups = withDistance(((meetupRes.data ?? []) as Row[]).map(mapMeetup), origin).map(
      (m) => ({
        ...m,
        goingCount: goingCounts.get(m.id) ?? 0,
        userAttendance: attendance.get(m.id) ?? null,
      }),
    );

    const petsByOwner = new Map<string, { name: string; breed: string; species: string }>();
    for (const pet of (petsRes.data ?? []) as Row[]) {
      const oid = pet.owner_id as string;
      if (!petsByOwner.has(oid)) {
        petsByOwner.set(oid, {
          name: pet.name as string,
          breed: pet.breed as string,
          species: pet.species as string,
        });
      }
    }

    const connStatus = (otherId: string): NeighborProfile['connectionStatus'] => {
      for (const c of (connRes.data ?? []) as Row[]) {
        const req = c.requester_id as string;
        const rec = c.recipient_id as string;
        if (req !== otherId && rec !== otherId) continue;
        const st = c.status as string;
        if (st === 'accepted') return 'accepted';
        if (st === 'pending') return 'pending';
      }
      return 'none';
    };

    const nextNeighbors: NeighborProfile[] = [];
    for (const row of (profileRes.data ?? []) as Row[]) {
      const lat = row.locality_lat != null ? Number(row.locality_lat) : null;
      const lng = row.locality_lng != null ? Number(row.locality_lng) : null;
      if (lat == null || lng == null) continue;
      let dist: number | null = null;
      if (origin && row.show_distance !== false) {
        dist = distanceKm(origin, { latitude: lat, longitude: lng });
        if (dist > 15) continue;
      }
      const uid = row.id as string;
      const petInfo = row.show_pet_to_neighbors !== false ? petsByOwner.get(uid) : undefined;
      const draftPet = row.pet as { name?: string; breed?: string } | null;
      nextNeighbors.push({
        userId: uid,
        name: row.name as string,
        city: row.city as string,
        locality: row.locality as string,
        photoUri: (row.photo_uri as string | null) ?? null,
        distanceKm: dist,
        petName: petInfo?.name ?? draftPet?.name,
        petBreed: petInfo?.breed ?? draftPet?.breed,
        petSpecies: petInfo?.species,
        connectionStatus: connStatus(uid),
      });
    }
    nextNeighbors.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    setPacks(nextPacks);
    setMeetups(nextMeetups);
    setNeighbors(nextNeighbors);
    setLoading(false);
  }, [origin, profile?.city, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const recommended = useMemo(
    () =>
      buildRecommendedFeed(packs, meetups, neighbors, {
        city: profile?.city,
        locality: profile?.locality,
        petSpecies: profile?.pet ? 'dog' : undefined,
        petBreed: profile?.pet?.breed,
      }),
    [packs, meetups, neighbors, profile],
  );

  return { packs, meetups, neighbors, recommended, loading, reload: load, origin };
}

export function usePackDetail(packId: string, userId: string | null) {
  const [pack, setPack] = useState<CommunityPack | null>(null);
  const [posts, setPosts] = useState<PackPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: packRow }, { data: postRows }, { data: memberRow }] = await Promise.all([
      supabase.from('community_packs').select('*').eq('id', packId).maybeSingle(),
      supabase
        .from('pack_posts')
        .select('*')
        .eq('pack_id', packId)
        .order('created_at', { ascending: false })
        .limit(40),
      userId
        ? supabase
            .from('pack_members')
            .select('status, role')
            .eq('pack_id', packId)
            .eq('user_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (packRow) {
      const mapped = mapPack(packRow as Row);
      mapped.isMember = (memberRow as Row | null)?.status === 'active';
      mapped.memberStatus = (memberRow as Row | null)?.status as CommunityPack['memberStatus'];
      setPack(mapped);
    }

    const authorIds = [...new Set(((postRows ?? []) as Row[]).map((p) => p.author_id as string))];
    const { data: authors } = authorIds.length
      ? await supabase.from('profiles').select('id, name').in('id', authorIds)
      : { data: [] };
    const nameById = new Map(
      ((authors ?? []) as Row[]).map((a) => [a.id as string, a.name as string]),
    );

    setPosts(
      ((postRows ?? []) as Row[]).map((p) => ({
        id: p.id as string,
        packId: p.pack_id as string,
        authorId: p.author_id as string,
        authorName: nameById.get(p.author_id as string),
        body: p.body as string,
        createdAt: p.created_at as string,
      })),
    );
    setLoading(false);
  }, [packId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { pack, posts, loading, reload: load };
}

export async function joinPack(pack: CommunityPack, userId: string): Promise<{ error?: string }> {
  const status = pack.privacy === 'public' ? 'active' : 'pending';
  const { error } = await supabase.from('pack_members').upsert(
    {
      pack_id: pack.id,
      user_id: userId,
      role: 'member',
      status,
    },
    { onConflict: 'pack_id,user_id' },
  );
  if (error) return { error: error.message };
  if (status === 'active') {
    await supabase
      .from('community_packs')
      .update({ member_count: pack.memberCount + 1 })
      .eq('id', pack.id);
  }
  return {};
}

export async function leavePack(pack: CommunityPack, userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('pack_members')
    .update({ status: 'left' })
    .eq('pack_id', pack.id)
    .eq('user_id', userId);
  if (error) return { error: error.message };
  await supabase
    .from('community_packs')
    .update({ member_count: Math.max(1, pack.memberCount - 1) })
    .eq('id', pack.id);
  return {};
}

export type CreatePackInput = {
  name: string;
  description: string;
  category: PackCategory;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  privacy: PackPrivacy;
  rules: string[];
};

export async function createPack(input: CreatePackInput, userId: string): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('community_packs')
    .insert({
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      city: input.city.trim(),
      area: input.area.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      radius_km: input.radiusKm,
      privacy: input.privacy,
      rules: input.rules,
      created_by: userId,
      member_count: 1,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  const packId = data.id as string;
  await supabase.from('pack_members').insert({
    pack_id: packId,
    user_id: userId,
    role: 'owner',
    status: 'active',
  });
  return { id: packId };
}

export type CreateMeetupInput = {
  title: string;
  meetupType: MeetupType;
  description: string;
  startAt: string;
  locationName: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  maxAttendees: number | null;
  packId: string | null;
  privacy: string;
};

export async function createMeetup(
  input: CreateMeetupInput,
  userId: string,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('community_meetups')
    .insert({
      title: input.title.trim(),
      meetup_type: input.meetupType,
      description: input.description.trim(),
      start_at: input.startAt,
      location_name: input.locationName.trim(),
      city: input.city.trim(),
      area: input.area.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      max_attendees: input.maxAttendees,
      pack_id: input.packId,
      privacy: input.privacy,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };
  return { id: data.id as string };
}

export function useMeetupDetail(meetupId: string, userId: string | null) {
  const [meetup, setMeetup] = useState<CommunityMeetup | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_meetups')
      .select('*')
      .eq('id', meetupId)
      .maybeSingle();
    if (data) {
      const mapped = mapMeetup(data as Row);
      const [{ count }, { data: att }, { data: host }] = await Promise.all([
        supabase
          .from('meetup_attendees')
          .select('*', { count: 'exact', head: true })
          .eq('meetup_id', meetupId)
          .eq('status', 'going'),
        userId
          ? supabase
              .from('meetup_attendees')
              .select('status')
              .eq('meetup_id', meetupId)
              .eq('user_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('profiles').select('name').eq('id', mapped.createdBy).maybeSingle(),
      ]);
      mapped.goingCount = count ?? 0;
      mapped.userAttendance = (att as Row | null)?.status as CommunityMeetup['userAttendance'];
      mapped.hostName = (host as Row | null)?.name as string | undefined;
      setMeetup(mapped);
    }
    setLoading(false);
  }, [meetupId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { meetup, loading, reload: load };
}

export async function setMeetupAttendance(
  meetupId: string,
  userId: string,
  status: 'going' | 'interested' | null,
): Promise<{ error?: string }> {
  if (!status) {
    const { error } = await supabase
      .from('meetup_attendees')
      .delete()
      .eq('meetup_id', meetupId)
      .eq('user_id', userId);
    return error ? { error: error.message } : {};
  }
  const { error } = await supabase.from('meetup_attendees').upsert(
    { meetup_id: meetupId, user_id: userId, status },
    { onConflict: 'meetup_id,user_id' },
  );
  return error ? { error: error.message } : {};
}

export async function createPackPost(
  packId: string,
  userId: string,
  body: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from('pack_posts').insert({
    pack_id: packId,
    author_id: userId,
    body: body.trim(),
  });
  return error ? { error: error.message } : {};
}

export async function requestConnection(
  requesterId: string,
  recipientId: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from('community_connections').upsert(
    {
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    },
    { onConflict: 'requester_id,recipient_id' },
  );
  return error ? { error: error.message } : {};
}
