# Play Store listing

Texts and graphics for the Google Play store listing, in English (`en/`, default language) and French (`fr/`).

| Play Console field | File | Limit |
|---|---|---|
| App name | `Sadikoi` | 30 characters |
| Short description | `en/short-description.txt`, `fr/short-description.txt` | 80 characters |
| Full description | `en/full-description.txt`, `fr/full-description.txt` | 4000 characters |
| App icon | `app-icon-512.png` (same for both languages) | 512 × 512 PNG, 1 MB |
| Feature graphic | `en/feature-graphic-1024x500.png`, `fr/feature-graphic-1024x500.png` | 1024 × 500 |
| Phone screenshots | `en/phone-screenshot-*.png`, `fr/phone-screenshot-*.png`, upload them in file order | 2 to 8, 1080 × 1920 (9:16) |

`phone-screenshots-without-caption/` has the same screens without the blue frame and caption, if you prefer them.

The screenshots come from the real app at phone size (1080 × 1920), with fake friends, groups and messages.

# App Store screenshots

App Store Connect → the app → the iOS version → **App Previews and Screenshots**, for each language (English, then French in the language menu at the top right). Upload the files in name order (`01` to `05`).

| App Store Connect size | Folder | Size |
|---|---|---|
| iPhone 6.9" Display | `en/app-store/iphone-6.9/`, `fr/app-store/iphone-6.9/` | 1320 × 2868 |
| iPad 13" Display | `en/app-store/ipad-13/`, `fr/app-store/ipad-13/` | 2064 × 2752 |

Only these two sizes are needed: App Store Connect scales them down for the smaller iPhones and iPads. PNG without transparency, as Apple requires.

`app-store/without-caption/` has the same screens without the blue frame and caption, at the same sizes.

Like the Play Store ones, they come from the real app (iPhone 440 × 956 at 3x, iPad 1032 × 1376 at 2x), with fake friends, groups and messages and drawn avatars.
