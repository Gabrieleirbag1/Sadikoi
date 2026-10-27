export const environment = {
    apiUrl: 'http://localhost:8082/api/',
    /** Public site address, for links shared outside the app (in the mobile app, window.location is https://localhost). */
    siteUrl: 'http://localhost:4200',
    /** Push notifications in the mobile app. Keep false until android/app/google-services.json is added:
     *  without Firebase, the push plugin crashes the app. */
    pushNotificationsEnabled: false,
    production: false,
    turnstileSiteKey: '0x4AAAAAAFVlADDuHjoD9GEt'
};