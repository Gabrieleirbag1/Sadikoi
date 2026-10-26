export const environment = {
    apiUrl: 'https://sadikoi.missclick.net/api/',
    /** Public site address, for links shared outside the app (in the mobile app, window.location is https://localhost). */
    siteUrl: 'https://sadikoi.missclick.net',
    /** Push notifications in the mobile app. Keep false until android/app/google-services.json is added:
     *  without Firebase, the push plugin crashes the app. */
    pushNotificationsEnabled: true,
    production: true,
    turnstileSiteKey: '0x4AAAAAAFVlADDuHjoD9GEt'
};