# `@tailz-club/assets`

Shared images and media for **mobile**, **web**, and **admin**.

## Usage

### React Native / Expo

```ts
import { HOME_IMAGES, WEB_IMAGES } from '@tailz-club/assets/native';

<Image source={HOME_IMAGES.pets.goldenRetriever} />
```

SVGs with `react-native-svg-transformer` can also be imported by path:

```ts
import AdoptionImage from '@tailz-club/assets/images/onboarding/adoption.svg';
```

### Vite (web / admin)

```ts
import { HOME_IMAGES, WEB_IMAGES } from '@tailz-club/assets/web';
// or a single file:
import playstore from '@tailz-club/assets/images/web/playstore.png';

<img src={WEB_IMAGES.playstore} alt="Google Play" />
```

### Path catalog (no bundler resolve)

```ts
import { ASSET_PATHS } from '@tailz-club/assets';
```

## Layout

```
icon/            # brand marks (tailz_club_logo.png)
images/
  home/          # avatar, categories, pets
  web/           # landing / marketing
  onboarding/    # SVG illustrations
src/
  native.ts      # Metro `require()` map
  web.ts         # Vite ESM URL map
  index.ts       # path catalog
```

Brand logo:

```ts
import { BRAND_IMAGES } from '@tailz-club/assets/web';
// or: import logo from '@tailz-club/assets/icon/tailz_club_logo.png'
<img src={BRAND_IMAGES.logo} alt="The Tailz Club" />
```

App-specific Expo icons/splash stay under `apps/mobile/assets`.
