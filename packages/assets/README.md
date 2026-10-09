# `@basera/assets`

Shared images and media for **mobile**, **web**, and **admin**.

## Usage

### React Native / Expo

```ts
import { HOME_IMAGES, WEB_IMAGES } from '@basera/assets/native';

<Image source={HOME_IMAGES.pets.goldenRetriever} />
```

SVGs with `react-native-svg-transformer` can also be imported by path:

```ts
import AdoptionImage from '@basera/assets/images/onboarding/adoption.svg';
```

### Vite (web / admin)

```ts
import { HOME_IMAGES, WEB_IMAGES } from '@basera/assets/web';
// or a single file:
import playstore from '@basera/assets/images/web/playstore.png';

<img src={WEB_IMAGES.playstore} alt="Google Play" />
```

### Path catalog (no bundler resolve)

```ts
import { ASSET_PATHS } from '@basera/assets';
```

## Layout

```
icon/            # brand marks (basera_logo.png)
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
import { BRAND_IMAGES } from '@basera/assets/web';
// or: import logo from '@basera/assets/icon/basera_logo.png'
<img src={BRAND_IMAGES.logo} alt="Basera" />
```

App-specific Expo icons/splash stay under `apps/mobile/assets`.
