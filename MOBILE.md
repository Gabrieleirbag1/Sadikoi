npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init Sadikoi com.yourname.sadikoi --web-dir=dist/sadikoi/browser
npm i @capacitor/android @capacitor/ios
ng build
npx cap add android
npx cap add ios        # needs a Mac
npx cap sync
npx cap open android   # opens Android Studio