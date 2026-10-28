npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init Sadikoi com.yourname.sadikoi --web-dir=dist/sadikoi/browser
npm i @capacitor/android @capacitor/ios
ng build
npx cap add android
npx cap add ios        # needs a Mac
npx cap sync
npx cap open android   # opens Android Studio
npx ng build && npx cap sync android
# Release Android (Play Store)

## 1. Upload key (once)
Keep the .jks file and its passwords outside the repo, with a backup: without them, no more updates can be published.

    keytool -genkey -v -keystore /home/<you>/sadikoi-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

Create `android/keystore.properties` (ignored by git):

    storeFile=/home/<you>/sadikoi-upload.jks
    storePassword=...
    keyAlias=upload
    keyPassword=...

`storeFile` must be an absolute path (`~` is not expanded) or relative to `android/app/`.

## 2. Build the AAB

    npm run android:release

Output: `android/app/build/outputs/bundle/release/app-release.aab`, to upload to Play Console.
For every new upload, increase `versionCode` (and `versionName`) in `android/app/build.gradle`.

## 3. Fingerprints
Upload key: `cd android && ./gradlew :app:signingReport` ("release" variant), or `keytool -list -v -keystore /home/<you>/sadikoi-upload.jks -alias upload`
Play key (only exists after the first upload): Play Console > Test and release > App integrity > App signing.

- `public/.well-known/assetlinks.json` (App Links): SHA-256 of the upload key and of the Play key, then redeploy the site.
- Google Cloud Console, Android OAuth client (Google Sign-In): SHA-1 of the upload key and of the Play key.

Neither requires a new AAB. Check on a phone installed from Play:

    adb shell pm get-app-links com.missclick.sadikoi   # should say "verified"
