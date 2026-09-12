-- Training system: library → preferences → plan → tasks → completions

create table public.training_exercises (
  id text primary key,
  title text not null,
  category text not null,
  display_tag text not null default 'PHYSICAL',
  pet_types text[] not null default '{dog}',
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  min_age_months int not null default 0,
  duration_minutes int not null default 5,
  description text not null,
  steps jsonb not null default '[]',
  goal_tags text[] not null default '{}',
  frequency text not null default 'daily'
);

alter table public.training_exercises enable row level security;

create policy "authenticated read training exercises"
  on public.training_exercises for select
  to authenticated
  using (true);

-- Per-pet training preferences (editable, separate from plan)
create table public.pet_training_preferences (
  pet_id uuid primary key references public.pets (id) on delete cascade,
  categories text[] not null default '{}',
  goals text[] not null default '{}',
  experience text not null default 'beginner'
    check (experience in ('beginner', 'some_training', 'well_trained')),
  daily_time_minutes int not null default 15,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  environment text check (environment in ('apartment', 'house')),
  has_outdoor_space boolean,
  has_other_pets boolean,
  has_children boolean,
  activity_level text check (activity_level in ('very_high', 'high', 'moderate', 'low')),
  preferred_time text check (preferred_time in ('morning', 'afternoon', 'evening', 'flexible')),
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.pet_training_preferences enable row level security;

create policy "owners manage pet training preferences"
  on public.pet_training_preferences for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create trigger pet_training_preferences_updated_at
  before update on public.pet_training_preferences
  for each row
  execute function public.set_updated_at();

-- Generated training plans (versioned; old plans kept for history)
create table public.pet_training_plans (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  week_start date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index pet_training_plans_pet_active_idx
  on public.pet_training_plans (pet_id, is_active);

alter table public.pet_training_plans enable row level security;

create policy "owners manage pet training plans"
  on public.pet_training_plans for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

-- Daily tasks (linked to plan + exercise)
create table public.pet_training_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.pet_training_plans (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  exercise_id text not null references public.training_exercises (id),
  task_date date not null,
  sort_order int not null default 0,
  title text not null,
  category text not null,
  display_tag text not null default 'PHYSICAL',
  duration_minutes int not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index pet_training_tasks_pet_date_idx
  on public.pet_training_tasks (pet_id, task_date);

alter table public.pet_training_tasks enable row level security;

create policy "owners manage pet training tasks"
  on public.pet_training_tasks for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

-- Completion history (date-dependent, separate from task row)
create table public.pet_training_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.pet_training_tasks (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  completion_date date not null,
  completed_at timestamptz not null default now(),
  unique (task_id, completion_date)
);

create index pet_training_completions_pet_date_idx
  on public.pet_training_completions (pet_id, completion_date);

alter table public.pet_training_completions enable row level security;

create policy "owners manage pet training completions"
  on public.pet_training_completions for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

-- Seed exercise library
insert into public.training_exercises (
  id, title, category, display_tag, pet_types, difficulty, min_age_months,
  duration_minutes, description, steps, goal_tags
) values
  (
    'stop_jumping', 'Stop Jumping', 'indoor', 'PHYSICAL', '{dog}', 'beginner', 3, 5,
    'Teach your dog to keep four paws on the floor when greeting people.',
    '["Turn away when your dog jumps","Reward only when paws stay down","Practice with family members"]',
    '{jumping,indoor}'
  ),
  (
    'place_training', 'Place Training', 'indoor', 'PHYSICAL', '{dog}', 'beginner', 3, 5,
    'Send your dog to a mat or bed and reward calm settling.',
    '["Lure onto the mat with a treat","Add a verbal cue like Place","Increase duration gradually"]',
    '{indoor,anxiety}'
  ),
  (
    'sit_stay', 'Sit & Stay', 'basic_obedience', 'MENTAL', '{dog,cat}', 'beginner', 2, 5,
    'Build impulse control with a reliable sit-stay.',
    '["Ask for sit","Hold palm up and wait one second","Reward calm stays"]',
    '{not_listening,basic_obedience}'
  ),
  (
    'come_when_called', 'Come When Called', 'outdoor', 'OUTDOOR', '{dog}', 'beginner', 4, 5,
    'Practice recall in a low-distraction area before moving outdoors.',
    '["Say come in a happy tone","Reward immediately on arrival","Never punish after recall"]',
    '{outdoor,not_listening}'
  ),
  (
    'loose_leash', 'Loose Leash Walking', 'leash_walking', 'OUTDOOR', '{dog}', 'beginner', 4, 10,
    'Reward your dog for walking beside you without pulling.',
    '["Stop moving when the leash tightens","Reward when slack returns","Change direction to regain focus"]',
    '{pulling_leash,leash_walking}'
  ),
  (
    'slow_eating', 'Slow Eating', 'eating', 'MEALTIME', '{dog,cat}', 'beginner', 2, 5,
    'Use a slow feeder or scatter feeding to prevent gulping.',
    '["Spread kibble on a mat","Use a puzzle feeder","Pause if eating becomes frantic"]',
    '{eating_fast,eating}'
  ),
  (
    'wait_before_eating', 'Wait Before Eating', 'eating', 'MEALTIME', '{dog,cat}', 'beginner', 3, 5,
    'Ask for a brief wait before releasing your pet to their bowl.',
    '["Hold bowl above reach","Say wait","Release with okay when calm"]',
    '{eating,not_listening}'
  ),
  (
    'indoor_potty', 'Indoor Potty Training', 'toilet', 'INDOOR', '{dog,cat}', 'beginner', 2, 10,
    'Establish a consistent potty routine with frequent breaks.',
    '["Take outside after meals and naps","Reward immediately outdoors","Avoid scolding accidents"]',
    '{accidents_indoor,toilet}'
  ),
  (
    'crate_training', 'Crate Training', 'indoor', 'INDOOR', '{dog}', 'beginner', 3, 10,
    'Make the crate a safe, positive resting space.',
    '["Feed treats inside the open crate","Close door briefly while calm","Build duration slowly"]',
    '{separation,indoor,anxiety}'
  ),
  (
    'leave_it', 'Leave It', 'basic_obedience', 'MENTAL', '{dog}', 'beginner', 3, 5,
    'Teach your dog to ignore tempting items on cue.',
    '["Cover treat with hand","Say leave it","Reward when they look away"]',
    '{not_listening,biting}'
  ),
  (
    'quiet_on_cue', 'Quiet on Cue', 'indoor', 'MENTAL', '{dog}', 'intermediate', 4, 5,
    'Reward brief moments of silence to reduce excessive barking.',
    '["Wait for a pause in barking","Mark quiet with a word","Reward calm"]',
    '{barking,indoor}'
  ),
  (
    'settle_mat', 'Settle on Mat', 'anxiety', 'MENTAL', '{dog,cat}', 'beginner', 3, 5,
    'Practice calm relaxation for anxious pets.',
    '["Guide to mat","Reward relaxed posture","Add gentle petting if enjoyed"]',
    '{anxiety,indoor}'
  ),
  (
    'social_greeting', 'Calm Greeting', 'socialization', 'OUTDOOR', '{dog}', 'beginner', 4, 10,
    'Practice polite greetings with people and dogs from a distance.',
    '["Start at a comfortable distance","Reward eye contact","Move closer only when calm"]',
    '{socialization,jumping,barking}'
  ),
  (
    'fetch_focus', 'Fetch & Focus', 'outdoor', 'PHYSICAL', '{dog}', 'beginner', 3, 10,
    'Burn energy while reinforcing recall and drop-it skills.',
    '["Toss toy a short distance","Call back before next throw","End while still engaged"]',
    '{outdoor,mental}'
  ),
  (
    'trick_shake', 'Shake Paw', 'tricks', 'MENTAL', '{dog}', 'beginner', 3, 5,
    'A fun trick that builds engagement and confidence.',
    '["Lure paw lift with treat","Add cue shake","Reward each successful lift"]',
    '{tricks,mental}'
  ),
  (
    'trick_spin', 'Spin', 'tricks', 'MENTAL', '{dog,cat}', 'beginner', 3, 5,
    'Lure a full circle and add a spin cue.',
    '["Lure nose in a circle","Reward completion","Fade lure to hand signal"]',
    '{tricks,mental}'
  ),
  (
    'cat_target', 'Target Touch', 'basic_obedience', 'MENTAL', '{cat}', 'beginner', 2, 5,
    'Teach your cat to touch a target stick or finger.',
    '["Present target near nose","Reward touch","Move target slightly farther"]',
    '{not_listening,indoor}'
  ),
  (
    'cat_carrier', 'Carrier Comfort', 'anxiety', 'INDOOR', '{cat}', 'beginner', 2, 10,
    'Help your cat feel safe entering and resting in a carrier.',
    '["Leave carrier open with bedding","Toss treats inside","Close door briefly when relaxed"]',
    '{anxiety,separation,indoor}'
  ),
  (
    'structured_play', 'Structured Play Session', 'mental', 'PHYSICAL', '{dog,cat}', 'beginner', 2, 15,
    'Short focused play that mixes physical and mental stimulation.',
    '["Use a flirt pole or toy for 2 minutes","Pause for a calm break","Repeat for the session duration"]',
    '{mental,outdoor,indoor}'
  ),
  (
    'down_stay', 'Down & Stay', 'basic_obedience', 'MENTAL', '{dog}', 'intermediate', 4, 5,
    'Build duration on a relaxed down position.',
    '["Lure into down","Wait two seconds","Reward without releasing"]',
    '{not_listening,basic_obedience}'
  );
